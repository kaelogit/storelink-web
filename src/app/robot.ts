import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/api/'], // Block internal API routes or private areas
    },
    sitemap: 'https://storelink.ng/sitemap.xml',
  };
}