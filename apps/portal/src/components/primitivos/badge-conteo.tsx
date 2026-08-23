/**
 * Badge numérico reutilizable (BUILD-040 §2.2 y §4.5).
 *
 * Convenciones:
 *   - `count === 0` → no renderiza nada (el consumer maneja la ausencia).
 *   - `count > 9` → muestra "9+" (defensivo; con 5 filtros máximo del portal
 *     nunca debería ocurrir, pero mantiene el contrato general del primitivo).
 *   - `aria-hidden="true"` por default — la información numérica se comunica
 *     al lector de pantalla vía el `aria-label` del contenedor (ej. el FAB).
 */
interface BadgeConteoProps {
  count: number;
  className?: string;
}

export function BadgeConteo({ count, className }: BadgeConteoProps) {
  if (count <= 0) return null;
  const texto = count > 9 ? "9+" : String(count);
  const clases = ["badge-conteo", className].filter(Boolean).join(" ");
  return (
    <span className={clases} aria-hidden="true">
      {texto}
    </span>
  );
}
