import { TEXTO_SOBRE_NOSOTROS } from "@/lib/contacto-config";

/**
 * Sección "Sobre nosotros" (HU-L01 escenario 3). Dos columnas: imagen del equipo
 * (placeholder) y texto institucional. El texto se centraliza en
 * `contacto-config.ts` para reemplazarlo con facilidad.
 *
 * TODO(cliente): reemplazar el placeholder de imagen por una foto real del
 * equipo o de la oficina.
 */
export function SobreNosotros() {
  return (
    <section className="seccion seccion--pagina" aria-labelledby="sobre-nosotros-titulo">
      <div className="contenedor-landing sobre-nosotros">
        <div
          className="sobre-nosotros__imagen"
          role="img"
          aria-label="Equipo de D-CH Inmobiliaria"
        >
          {/* TODO(cliente): reemplazar por <Image> con foto real del equipo/oficina (4:3). */}
          <span className="sobre-nosotros__imagen-nota">Foto del equipo D-CH</span>
        </div>
        <div className="sobre-nosotros__texto">
          <h2 id="sobre-nosotros-titulo" className="seccion__titulo">
            Sobre nosotros
          </h2>
          {TEXTO_SOBRE_NOSOTROS.map((parrafo, indice) => (
            <p key={indice} className="sobre-nosotros__parrafo">
              {parrafo}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
