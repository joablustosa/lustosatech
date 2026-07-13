/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Erros de tipo não bloqueiam o build de produção; o dev server continua reportando.
    ignoreBuildErrors: false,
  },
  async headers() {
    // Impede o navegador de guardar HTML/imagens antigas. Assim, quando um
    // deploy novo sobe, o front sempre pega a versão nova sem precisar limpar
    // cache. Os assets com hash (/_next/static/*) NÃO são afetados e continuam
    // com cache longo (são imutáveis, o nome muda a cada build).
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
