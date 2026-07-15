import { describe, expect, it } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "../src/app.controller";

/**
 * Smoke test de scaffolding — confirma que el módulo raíz arranca y responde el healthcheck.
 * Se reemplaza por tests de dominio reales a medida que cada bounded context implemente lógica.
 */
describe("AppController (smoke)", () => {
  it("responde ok en /health", async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);
    expect(controller.health()).toEqual({ status: "ok" });
  });
});
