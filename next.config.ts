/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com', // ✅ REQUIRED: Fixes the crash you just saw
      },
      {
        protocol: 'https',
        hostname: 'pngimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // ✅ FIXED: Removed '/api/**' so all unsplash images work
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
};

export default nextConfig;