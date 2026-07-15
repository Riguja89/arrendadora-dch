import Link from "next/link";
import { PROPIEDADES_DESTACADAS_MOCK } from "@/mocks/propiedades";

/**
 * Home del portal — placeholder de scaffolding. Muestra destacadas MOCK (RN-023 exige hasta 6,
 * completadas con las más recientes); se conecta a `/public/destacadas` al implementar CU-001.
 */
export default function HomePage() {
  return (
    <main className="container">
      <h1>Arrendadora — arriendo y venta en Yopal y Aguazul</h1>
      <p>
        Portal público en construcción (scaffolding). Las propiedades listadas abajo son datos
        mock — sin conexión real a la API todavía (ver <code>src/mocks/propiedades.ts</code>).
      </p>
      <h2>Destacadas</h2>
      <ul>
        {PROPIEDADES_DESTACADAS_MOCK.map((propiedad) => (
          <li key={propiedad.codigo}>
            <Link href={`/propiedades/${propiedad.slug}`}>{propiedad.titulo}</Link>
            {propiedad.badgeReservada ? " — Reservada" : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
