import { useState, type ChangeEvent } from "react";
import { cargarFotos, eliminarFoto, marcarFotoPortada, reordenarFotos } from "@/lib/fotos-api";
import {
  MAX_FOTOS_POR_PROPIEDAD,
  MIN_FOTOS_PARA_PUBLICAR,
  moverFotoAbajo,
  moverFotoArriba,
  ordenarFotosPorOrden,
  validarLoteFotos,
} from "@/lib/fotos-validation";
import type { Foto } from "@/lib/propiedades-types";

interface FotosFieldProps {
  propiedadId: string;
  fotos: Foto[];
  onActualizado: (fotos: Foto[]) => void;
}

interface RechazoDisplay {
  nombreArchivo: string;
  motivo: string;
}

/**
 * Galería de fotos de la propiedad (spec-004 CU-001/CU-002, RN-006, RN-014, RN-028 a RN-032).
 * Solo disponible en edición, igual que `UbicacionField` — el endpoint de carga exige una
 * propiedad ya creada.
 *
 * RBAC (ADR-014): las tres roles (`administrador`, `agente`, `editor`) pueden gestionar
 * multimedia — `agente` solo sobre sus propias propiedades, ya filtrado por el backend antes de
 * llegar acá. No hay gating de rol en este componente (mismo criterio que `UbicacionField`).
 *
 * Reordenamiento (RN-031): esta implementación usa **solo** los controles "mover arriba/abajo"
 * — el flujo alternativo explícito del CU-002 para dispositivos sin soporte de drag-and-drop.
 * Decisión pragmática: cubre la regla de negocio completa (persistir el nuevo orden) sin sumar
 * una librería de drag-and-drop; si el negocio prioriza la interacción de arrastre, es un
 * incremento de UI aislado sobre `manejarOrden`/`reordenarFotos`, que ya quedan listos.
 */
export function FotosField({ propiedadId, fotos, onActualizado }: FotosFieldProps) {
  const [subiendo, setSubiendo] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rechazos, setRechazos] = useState<RechazoDisplay[]>([]);

  const fotosOrdenadas = ordenarFotosPorOrden(fotos);
  const ocupado = subiendo || accionEnCurso !== null;
  const cupoCompleto = fotos.length >= MAX_FOTOS_POR_PROPIEDAD;

  async function manejarSeleccionArchivos(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const archivos = evento.target.files ? Array.from(evento.target.files) : [];
    evento.target.value = ""; // permite re-seleccionar el mismo archivo si se corrige el lote
    if (archivos.length === 0) return;

    setError(null);
    const { validos, rechazados } = validarLoteFotos(archivos, fotos.length);
    const rechazosCliente = rechazados.map((r) => ({ nombreArchivo: r.archivo.name, motivo: r.motivo }));

    if (validos.length === 0) {
      setRechazos(rechazosCliente);
      return;
    }

    setSubiendo(true);
    const resultado = await cargarFotos(propiedadId, validos);
    setSubiendo(false);

    if (!resultado.ok) {
      setError(resultado.error.message);
      setRechazos(rechazosCliente);
      return;
    }

    onActualizado([...fotos, ...resultado.data.cargadas]);
    setRechazos([
      ...rechazosCliente,
      ...resultado.data.rechazadas.map((r) => ({ nombreArchivo: r.nombre_archivo, motivo: r.motivo })),
    ]);
  }

  async function manejarPortada(fotoId: string): Promise<void> {
    setError(null);
    setAccionEnCurso(fotoId);
    const resultado = await marcarFotoPortada(propiedadId, fotoId);
    setAccionEnCurso(null);

    if (!resultado.ok) {
      setError(resultado.error.message);
      return;
    }
    onActualizado(resultado.data);
  }

  async function manejarOrden(fotoId: string, direccion: "arriba" | "abajo"): Promise<void> {
    const nuevoOrden = direccion === "arriba" ? moverFotoArriba(fotosOrdenadas, fotoId) : moverFotoAbajo(fotosOrdenadas, fotoId);
    if (nuevoOrden.every((id, indice) => id === fotosOrdenadas[indice]?.id)) return; // ya está en el extremo

    setError(null);
    setAccionEnCurso(fotoId);
    const resultado = await reordenarFotos(propiedadId, nuevoOrden);
    setAccionEnCurso(null);

    if (!resultado.ok) {
      // RN-031 flujo de excepción: el estado local no se tocó — el orden anterior queda intacto.
      setError(resultado.error.message);
      return;
    }
    onActualizado(resultado.data);
  }

  async function manejarEliminar(foto: Foto): Promise<void> {
    const confirmado = window.confirm("¿Eliminar esta foto? Esta acción no se puede deshacer.");
    if (!confirmado) return;

    setError(null);
    setAccionEnCurso(foto.id);
    const resultado = await eliminarFoto(propiedadId, foto.id);
    setAccionEnCurso(null);

    if (!resultado.ok) {
      // Incluye el 409 cuando es la última foto de una propiedad visible (ADR-008) — se muestra tal cual.
      setError(resultado.error.message);
      return;
    }
    onActualizado(fotos.filter((f) => f.id !== foto.id));
  }

  return (
    <fieldset className="fotos-field">
      <legend>
        Fotos ({fotos.length}/{MAX_FOTOS_POR_PROPIEDAD})
      </legend>
      <p className="texto-muted">
        Formatos permitidos: JPG, PNG o WEBP — hasta 10 MB por imagen. Mínimo {MIN_FOTOS_PARA_PUBLICAR} foto para
        publicar en el portal (RN-029, RN-030).
      </p>

      <label className="fotos-field__subir">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={ocupado || cupoCompleto}
          onChange={(evento) => void manejarSeleccionArchivos(evento)}
        />
        <span>{subiendo ? "Subiendo…" : "Cargar fotos"}</span>
      </label>

      {cupoCompleto ? (
        <p className="texto-muted">Se alcanzó el máximo de {MAX_FOTOS_POR_PROPIEDAD} fotos por propiedad.</p>
      ) : null}

      {rechazos.length > 0 ? (
        <ul className="fotos-field__rechazos" role="alert">
          {rechazos.map((rechazo, indice) => (
            <li key={`${rechazo.nombreArchivo}-${indice}`} className="campo-error">
              {rechazo.nombreArchivo}: {rechazo.motivo}
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}

      {fotosOrdenadas.length === 0 ? (
        <p className="texto-muted">Todavía no hay fotos cargadas.</p>
      ) : (
        <ul className="fotos-field__galeria">
          {fotosOrdenadas.map((foto, indice) => (
            <li key={foto.id} className="fotos-field__item">
              <div className="fotos-field__miniatura-wrap">
                <img src={foto.url_thumbnail} alt={`Foto ${indice + 1} de la propiedad`} className="fotos-field__miniatura" />
                {foto.es_portada ? <span className="badge fotos-field__badge-portada">Portada</span> : null}
              </div>
              <div className="fotos-field__acciones">
                <button
                  type="button"
                  disabled={ocupado || indice === 0}
                  aria-label="Mover foto arriba"
                  onClick={() => void manejarOrden(foto.id, "arriba")}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={ocupado || indice === fotosOrdenadas.length - 1}
                  aria-label="Mover foto abajo"
                  onClick={() => void manejarOrden(foto.id, "abajo")}
                >
                  ↓
                </button>
                <button type="button" disabled={ocupado || foto.es_portada} onClick={() => void manejarPortada(foto.id)}>
                  Marcar portada
                </button>
                <button type="button" disabled={ocupado} onClick={() => void manejarEliminar(foto)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
