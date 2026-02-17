import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // 👈 This Wildcard allows ALL https images
      },
    ],
  },
  // No headers needed! Next.js handles opengraph-image.jpg automatically.
};

export default nextConfig;