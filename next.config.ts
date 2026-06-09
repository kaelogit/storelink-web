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
};

export default nextConfig;