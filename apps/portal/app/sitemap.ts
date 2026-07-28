import type { MetadataRoute } from "next";
import { generarSitemap } from "@/lib/sitemap";

/** Base pública del portal para armar URLs absolutas del sitemap (Next las exige absolutas). */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/** `sitemap.xml` — ver `src/lib/sitemap.ts` para la lógica (ADR-010, ADR-018 Decisión 1.A). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generarSitemap(SITE_URL);
}
