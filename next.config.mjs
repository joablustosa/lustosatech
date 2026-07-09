/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Erros de tipo não bloqueiam o build de produção; o dev server continua reportando.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
