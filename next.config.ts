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
  async headers() {
    const wellKnown = [
      {
        key: "Content-Type",
        value: "application/json",
      },
      {
        key: "Cache-Control",
        value: "public, max-age=3600",
      },
    ];
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: wellKnown,
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: wellKnown,
      },
    ];
  },
};

export default nextConfig;