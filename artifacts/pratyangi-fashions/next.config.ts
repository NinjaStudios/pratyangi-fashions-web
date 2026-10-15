import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["**.replit.dev", "127.0.0.1"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
