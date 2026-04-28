import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/explore',
        destination: '/',
        permanent: true,
      },
      // Support profile links shared as /@username by redirecting to canonical /username.
      {
        source: '/@:username',
        destination: '/:username',
        permanent: true,
      },
    ];
  },
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