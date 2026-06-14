/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM; let Next transpile it for SSR/build.
  transpilePackages: ['three'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
