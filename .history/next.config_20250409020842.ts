import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ESLint のビルドエラーを無視
  },
};

export default nextConfig;
