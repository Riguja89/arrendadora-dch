import { describe, expect, it, vi } from "vitest";
import { ObtenerPropiedadUseCase } from "./obtener-propiedad.use-case";
import { Propiedad } from "../../domain/entities/propiedad.entity";
import {
  PropiedadNoEncontradaError,
  SinPermisoPropiedadError,
} from "../../domain/errors/dominio-propiedades.errors";
import type { PropiedadRepositoryPort } from "../../domain/ports/propiedad.repository.port";
import type {
  FotoPublica,
  MultimediaQueryPort,
} from "../../../admin-multimedia/domain/ports/multimedia-query.port";

const AHORA = new Date("2026-07-01T10:00:00.000Z");

function propiedadDe(agenteId: string | null): Propiedad {
  return Propiedad.crear({
    id: "prop-1", codigo: "AP-001", titulo: "Casa", descripcion: "d", tipoOperacion: "arriendo",
    tipoPropiedadId: "tipo-1", ciudad: "Bogotá", barrio: "b", direccion: null, precio: 1_000_000,
    area: 50, habitaciones: 1, banos: 1, estrato: null, parqueaderos: null, destacada: false,
    agenteId, amenidades: [], ahora: AHORA,
  });
}

function buildRepo(propiedad: Propiedad | null): PropiedadRepositoryPort {
  return {
    guardar: vi.fn(), buscarPorId: vi.fn().mockResolvedValue(propiedad), listar: vi.fn(), cambiarEstado: vi.fn(),
  };
}

function fotoDe(orden: number, esPortada: boolean): FotoPublica {
  return {
    id: `foto-${orden}`, orden, esPortada, formatoOriginal: "jpg",
    urlOptimizada: `https://cdn/${orden}/original.jpg`, urlCard: `https://cdn/${orden}/card.jpg`,
    urlThumbnail: `https://cdn/${orden}/thumb.jpg`, createdAt: AHORA,
  };
}

function buildMultimedia(fotos: FotoPublica[]): MultimediaQueryPort {
  return { listarFotosDePropiedad: vi.fn().mockResolvedValue(fotos) };
}

describe("ObtenerPropiedadUseCase", () => {
  it("lanza PropiedadNoEncontradaError si no existe", async () => {
    const uc = new ObtenerPropiedadUseCase(buildRepo(null), buildMultimedia([]));
    await expect(uc.ejecutar({ actor: { id: "u-1", rol: "administrador" }, id: "x" })).rejects.toBeInstanceOf(
      PropiedadNoEncontradaError,
    );
  });

  it("lanza SinPermisoPropiedadError si el Agente no es el dueño (RN-010)", async () => {
    const uc = new ObtenerPropiedadUseCase(buildRepo(propiedadDe("otro")), buildMultimedia([]));
    await expect(uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" })).rejects.toBeInstanceOf(
      SinPermisoPropiedadError,
    );
  });

  it("no consulta multimedia si el permiso falla (RN-010)", async () => {
    const multimedia = buildMultimedia([]);
    const uc = new ObtenerPropiedadUseCase(buildRepo(propiedadDe("otro")), multimedia);
    await expect(
      uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" }),
    ).rejects.toBeInstanceOf(SinPermisoPropiedadError);
    expect(multimedia.listarFotosDePropiedad).not.toHaveBeenCalled();
  });

  it("devuelve la propiedad con sus fotos si el Agente es el dueño", async () => {
    const fotos = [fotoDe(1, true), fotoDe(2, false)];
    const multimedia = buildMultimedia(fotos);
    const uc = new ObtenerPropiedadUseCase(buildRepo(propiedadDe("agente-1")), multimedia);
    const ficha = await uc.ejecutar({ actor: { id: "agente-1", rol: "agente" }, id: "prop-1" });
    expect(ficha.propiedad.id).toBe("prop-1");
    expect(ficha.fotos).toEqual(fotos);
    expect(multimedia.listarFotosDePropiedad).toHaveBeenCalledWith("prop-1");
  });

  it("el Administrador ve cualquier propiedad (RN-011)", async () => {
    const uc = new ObtenerPropiedadUseCase(buildRepo(propiedadDe("otro")), buildMultimedia([]));
    const ficha = await uc.ejecutar({ actor: { id: "u-admin", rol: "administrador" }, id: "prop-1" });
    expect(ficha.propiedad.id).toBe("prop-1");
    expect(ficha.fotos).toEqual([]);
  });
});
