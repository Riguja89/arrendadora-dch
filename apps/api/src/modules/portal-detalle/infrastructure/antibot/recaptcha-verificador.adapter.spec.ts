import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { RecaptchaVerificadorAdapter } from "./recaptcha-verificador.adapter";
import type { AntibotConfig } from "../../../../config/configuration";

const CONFIG: AntibotConfig = {
  driver: "recaptcha",
  recaptchaSecret: "secret-de-prueba",
  scoreMinimo: 0.5,
  verifyUrl: "https://www.google.com/recaptcha/api/siteverify",
  verifyTimeoutMs: 7000,
};

function buildConfigService(overrides: Partial<AntibotConfig> = {}): ConfigService {
  const antibot = { ...CONFIG, ...overrides };
  return { get: vi.fn().mockReturnValue(antibot) } as unknown as ConfigService;
}

function build(overrides: Partial<AntibotConfig> = {}) {
  return new RecaptchaVerificadorAdapter(buildConfigService(overrides));
}

describe("RecaptchaVerificadorAdapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("aprueba cuando siteverify responde success:true y score >= umbral", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9 }),
    });

    const adapter = build();
    const resultado = await adapter.verificar("token-valido");

    expect(resultado).toEqual({ disponible: true, aprobado: true, score: 0.9 });
  });

  it("pasa un AbortSignal con el timeout configurado (RECAPTCHA_VERIFY_TIMEOUT_MS)", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, score: 1 }) });

    const adapter = build({ verifyTimeoutMs: 7000 });
    await adapter.verificar("token-cualquiera");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  it("cae en fail-closed (disponible:false) cuando el fetch aborta por timeout — sin esperar el timeout real", async () => {
    // Simula exactamente lo que produce AbortSignal.timeout() al disparar: el fetch rechaza con
    // un AbortError. No se espera ningún timer real — el test corre instantáneo.
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));

    const adapter = build({ verifyTimeoutMs: 50 });
    const resultado = await adapter.verificar("token-cualquiera");

    // Mismo camino fail-closed (ADR-007) que cualquier otra falla de red — la política de
    // seguridad no cambia, solo la latencia hasta llegar a este resultado.
    expect(resultado).toEqual({ disponible: false, aprobado: false, score: null });
  });

  it("cae en fail-closed cuando siteverify responde HTTP no-ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const adapter = build();
    const resultado = await adapter.verificar("token-cualquiera");

    expect(resultado).toEqual({ disponible: false, aprobado: false, score: null });
  });

  it("cae en fail-closed sin llamar a fetch cuando falta RECAPTCHA_SECRET_KEY", async () => {
    const adapter = build({ recaptchaSecret: "" });
    const resultado = await adapter.verificar("token-cualquiera");

    expect(resultado).toEqual({ disponible: false, aprobado: false, score: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rechaza cuando success:false o score < umbral (no es fail-closed, es 403 normal)", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, score: 0.1 }) });

    const adapter = build();
    const resultado = await adapter.verificar("token-bajo-score");

    expect(resultado).toEqual({ disponible: true, aprobado: false, score: 0.1 });
  });
});
