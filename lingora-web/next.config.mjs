import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: fileURLToPath(new URL('../', import.meta.url)),
  outputFileTracingIncludes: {
    '/*': ['./generated/product-client/schema.prisma', './generated/product-client/*.node'],
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
