/**
 * Config de scaffolding. `images.remotePatterns` queda abierto a placeholder de mocks
 * (`via.placeholder.com`) — se restringe al dominio real de CloudFront (ADR-002/ADR-005)
 * cuando se implemente CU-001 (spec-002) con fetch real a la API.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "via.placeholder.com" }],
  },
};

export default nextConfig;
