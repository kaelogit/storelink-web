import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // 1. Image Optimization Domains (Keep your existing settings)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'pngimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'yolqfndprzohjkrizbzu.supabase.co', // ✅ Your Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
  },

  // 2. 🛡️ FORCE HEADERS (The Fix for Facebook)
  // This explicitly tells Vercel/Browsers: "og-image.jpg IS an image, not a webpage."
  async headers() {
    return [
      {
        source: "/og-image.jpg",
        headers: [
          {
            key: "Content-Type",
            value: "image/jpeg",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;