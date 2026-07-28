import { useEffect, useId, useState, type FormEvent } from "react";
import type { Usuario } from "@arrendadora/shared";
import { useAuth } from "@/lib/auth-context";
import { crearPropiedad, editarPropiedad, listarAgentesActivos, listarAmenidades, listarTiposPropiedad } from "@/lib/propiedades-api";
import {
  construirAmenidadesFormulario,
  construirPayloadPropiedad,
  mapearErroresValidacion,
  valoresInicialesPropiedad,
  validarFormularioPropiedad,
  type PropiedadFormValues,
} from "@/lib/propiedad-form-validation";
import type { Propiedad, TipoPropiedadCatalogo } from "@/lib/propiedades-types";

interface PropiedadFormProps {
  modo: "crear" | "editar";
  propiedad?: Propiedad;
  onGuardado: (propiedad: Propiedad) => void;
}

/**
 * Formulario compartido de creación/edición (spec-003 CU-001, CU-002). Valida en cliente
 * (RN-017, RN-018) antes de enviar, y funde los errores 422 del servidor (`detalles[].campo`,
 * ADR-015) con los propios si el backend rechaza algo que el cliente dejó pasar.
 *
 * El campo "Agente responsable" (RN-016) solo es editable para Administrador: `GET
 * /admin/usuarios` exige ese rol (DESIGN-028). Para Agente, el backend autoasigna al usuario
 * actual (se omite el campo del formulario). Para Editor, el campo queda oculto en este
 * incremento — decisión pragmática documentada en el CLAUDE.md del módulo.
 */
export function PropiedadForm({ modo, propiedad, onGuardado }: PropiedadFormProps) {
  const { rol } = useAuth();
  const idBase = useId();

  const [tipos, setTipos] = useState<TipoPropiedadCatalogo[]>([]);
  const [agentes, setAgentes] = useState<Usuario[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState<string | null>(null);

  const [valores, setValores] = useState<PropiedadFormValues>({
    ...valoresInicialesPropiedad(propiedad),
    amenidades: [],
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    let cancelado = false;

    void (async () => {
      setCargandoCatalogos(true);
      setErrorCatalogos(null);

      const [tiposResp, amenidadesResp, agentesResp] = await Promise.all([
        listarTiposPropiedad(controlador.signal),
        listarAmenidades(controlador.signal),
        rol === "administrador" ? listarAgentesActivos(controlador.signal) : Promise.resolve(null),
      ]);

      if (cancelado) return;

      if (!tiposResp.ok) {
        setErrorCatalogos(tiposResp.error.message);
        setCargandoCatalogos(false);
        return;
      }
      if (!amenidadesResp.ok) {
        setErrorCatalogos(amenidadesResp.error.message);
        setCargandoCatalogos(false);
        return;
      }

      setTipos(tiposResp.data);
      if (agentesResp && agentesResp.ok) setAgentes(agentesResp.data);

      setValores((actual) => ({
        ...actual,
        amenidades: construirAmenidadesFormulario(amenidadesResp.data, propiedad?.amenidades),
      }));
      setCargandoCatalogos(false);
    })();

    return () => {
      cancelado = true;
      controlador.abort();
    };
    // Solo se recarga el catálogo al montar (o si cambia el rol) — no en cada tecleo del form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  function actualizarCampo<K extends keyof PropiedadFormValues>(campo: K, valor: PropiedadFormValues[K]): void {
    setValores((actual) => ({ ...actual, [campo]: valor }));
  }

  function actualizarAmenidad(amenidadId: string, cambios: Partial<{ seleccionada: boolean; cantidad: string }>): void {
    setValores((actual) => ({
      ...actual,
      amenidades: actual.amenidades.map((a) => (a.amenidad_id === amenidadId ? { ...a, ...cambios } : a)),
    }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setErrorGeneral(null);

    const validacion = validarFormularioPropiedad(valores);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    const payload = construirPayloadPropiedad(valores);
    // Agente: el backend ignora agente_id y autoasigna al usuario actual (RN-011); Editor: sin
    // selector en este incremento, se omite para no enviar un valor no intencional.
    if (rol !== "administrador") delete payload.agente_id;

    setEnviando(true);
    const resultado =
      modo === "crear" ? await crearPropiedad(payload) : await editarPropiedad((propiedad as Propiedad).id, payload);
    setEnviando(false);

    if (!resultado.ok) {
      if (resultado.error.detalles && resultado.error.detalles.length > 0) {
        setErrores((actual) => ({ ...actual, ...mapearErroresValidacion(resultado.error.detalles) }));
      }
      setErrorGeneral(resultado.error.message);
      return;
    }

    onGuardado(resultado.data);
  }

  if (cargandoCatalogos) {
    return <p className="texto-muted">Cargando catálogos…</p>;
  }

  if (errorCatalogos) {
    return (
      <p className="campo-error" role="alert">
        No se pudieron cargar los catálogos: {errorCatalogos}
      </p>
    );
  }

  return (
    <form className="propiedad-form" onSubmit={manejarEnvio} noValidate>
      <div className="campo">
        <label htmlFor={`${idBase}-titulo`}>Título</label>
        <input
          id={`${idBase}-titulo`}
          value={valores.titulo}
          disabled={enviando}
          onChange={(e) => actualizarCampo("titulo", e.target.value)}
        />
        {errores.titulo ? <span className="campo-error">{errores.titulo}</span> : null}
      </div>

      <div className="campo">
        <label htmlFor={`${idBase}-descripcion`}>Descripción</label>
        <textarea
          id={`${idBase}-descripcion`}
          rows={4}
          value={valores.descripcion}
          disabled={enviando}
          onChange={(e) => actualizarCampo("descripcion", e.target.value)}
        />
        {errores.descripcion ? <span className="campo-error">{errores.descripcion}</span> : null}
      </div>

      <div className="propiedad-form__grid">
        <div className="campo">
          <label htmlFor={`${idBase}-tipo-operacion`}>Tipo de operación</label>
          <select
            id={`${idBase}-tipo-operacion`}
            value={valores.tipo_operacion}
            disabled={enviando}
            onChange={(e) => actualizarCampo("tipo_operacion", e.target.value as PropiedadFormValues["tipo_operacion"])}
          >
            <option value="">Seleccioná…</option>
            <option value="arriendo">Arriendo</option>
            <option value="venta">Venta</option>
          </select>
          {errores.tipo_operacion ? <span className="campo-error">{errores.tipo_operacion}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-tipo-propiedad`}>Tipo de propiedad</label>
          <select
            id={`${idBase}-tipo-propiedad`}
            value={valores.tipo_propiedad_id}
            disabled={enviando}
            onChange={(e) => actualizarCampo("tipo_propiedad_id", e.target.value)}
          >
            <option value="">Seleccioná…</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
          {errores.tipo_propiedad_id ? <span className="campo-error">{errores.tipo_propiedad_id}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-ciudad`}>Ciudad</label>
          <input
            id={`${idBase}-ciudad`}
            value={valores.ciudad}
            disabled={enviando}
            onChange={(e) => actualizarCampo("ciudad", e.target.value)}
          />
          {errores.ciudad ? <span className="campo-error">{errores.ciudad}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-barrio`}>Barrio / Sector</label>
          <input
            id={`${idBase}-barrio`}
            value={valores.barrio}
            disabled={enviando}
            onChange={(e) => actualizarCampo("barrio", e.target.value)}
          />
          {errores.barrio ? <span className="campo-error">{errores.barrio}</span> : null}
        </div>

        <div className="campo campo--ancho">
          <label htmlFor={`${idBase}-direccion`}>Dirección exacta (privada — no se publica, ADR-011)</label>
          <input
            id={`${idBase}-direccion`}
            value={valores.direccion}
            disabled={enviando}
            onChange={(e) => actualizarCampo("direccion", e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-precio`}>Precio (COP)</label>
          <input
            id={`${idBase}-precio`}
            inputMode="numeric"
            value={valores.precio}
            disabled={enviando}
            placeholder="Ej. 1.500.000"
            onChange={(e) => actualizarCampo("precio", e.target.value)}
          />
          {errores.precio ? <span className="campo-error">{errores.precio}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-area`}>Área (m²)</label>
          <input
            id={`${idBase}-area`}
            inputMode="numeric"
            value={valores.area}
            disabled={enviando}
            onChange={(e) => actualizarCampo("area", e.target.value)}
          />
          {errores.area ? <span className="campo-error">{errores.area}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-habitaciones`}>Habitaciones</label>
          <input
            id={`${idBase}-habitaciones`}
            inputMode="numeric"
            value={valores.habitaciones}
            disabled={enviando}
            onChange={(e) => actualizarCampo("habitaciones", e.target.value)}
          />
          {errores.habitaciones ? <span className="campo-error">{errores.habitaciones}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-banos`}>Baños</label>
          <input
            id={`${idBase}-banos`}
            inputMode="numeric"
            value={valores.banos}
            disabled={enviando}
            onChange={(e) => actualizarCampo("banos", e.target.value)}
          />
          {errores.banos ? <span className="campo-error">{errores.banos}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-estrato`}>Estrato (1-6, opcional)</label>
          <input
            id={`${idBase}-estrato`}
            inputMode="numeric"
            value={valores.estrato}
            disabled={enviando}
            onChange={(e) => actualizarCampo("estrato", e.target.value)}
          />
          {errores.estrato ? <span className="campo-error">{errores.estrato}</span> : null}
        </div>

        <div className="campo">
          <label htmlFor={`${idBase}-parqueaderos`}>Parqueaderos (opcional)</label>
          <input
            id={`${idBase}-parqueaderos`}
            inputMode="numeric"
            value={valores.parqueaderos}
            disabled={enviando}
            onChange={(e) => actualizarCampo("parqueaderos", e.target.value)}
          />
          {errores.parqueaderos ? <span className="campo-error">{errores.parqueaderos}</span> : null}
        </div>

        {rol === "administrador" ? (
          <div className="campo">
            <label htmlFor={`${idBase}-agente`}>Agente responsable</label>
            <select
              id={`${idBase}-agente`}
              value={valores.agente_id}
              disabled={enviando}
              onChange={(e) => actualizarCampo("agente_id", e.target.value)}
            >
              <option value="">Sin agente asignado (usa el WhatsApp central)</option>
              {agentes.map((agente) => (
                <option key={agente.id} value={agente.id}>
                  {agente.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="campo campo--checkbox">
        <label htmlFor={`${idBase}-destacada`}>
          <input
            id={`${idBase}-destacada`}
            type="checkbox"
            checked={valores.destacada}
            disabled={enviando}
            onChange={(e) => actualizarCampo("destacada", e.target.checked)}
          />
          Destacar en el portal
        </label>
      </div>

      <fieldset className="propiedad-form__amenidades">
        <legend>Amenidades</legend>
        {valores.amenidades.length === 0 ? (
          <p className="texto-muted">No hay amenidades activas en el catálogo.</p>
        ) : (
          valores.amenidades.map((amenidad) => (
            <div key={amenidad.amenidad_id} className="propiedad-form__amenidad">
              <label>
                <input
                  type="checkbox"
                  checked={amenidad.seleccionada}
                  disabled={enviando}
                  onChange={(e) => actualizarAmenidad(amenidad.amenidad_id, { seleccionada: e.target.checked })}
                />
                {amenidad.nombre}
              </label>
              {amenidad.seleccionada ? (
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={`Cantidad de ${amenidad.nombre}`}
                  className="propiedad-form__amenidad-cantidad"
                  value={amenidad.cantidad}
                  disabled={enviando}
                  onChange={(e) => actualizarAmenidad(amenidad.amenidad_id, { cantidad: e.target.value })}
                />
              ) : null}
              {errores[`amenidad_${amenidad.amenidad_id}`] ? (
                <span className="campo-error">{errores[`amenidad_${amenidad.amenidad_id}`]}</span>
              ) : null}
            </div>
          ))
        )}
      </fieldset>

      {errorGeneral ? (
        <p className="campo-error" role="alert">
          {errorGeneral}
        </p>
      ) : null}

      <button type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : modo === "crear" ? "Crear propiedad" : "Guardar cambios"}
      </button>
    </form>
  );
}
