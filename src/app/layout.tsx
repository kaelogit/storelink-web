import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; 
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from "../components/home/Navbar";
import "./globals.css";

// 1. Load High-End Fonts
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: "--font-space",
  display: "swap",
});

// 2. Comprehensive SEO & Brand Metadata
export const viewport: Viewport = {
  themeColor: "#10b981", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://storelink.ng'), 
  title: {
    default: "StoreLink | The Operating System for Commerce",
    template: "%s | StoreLink", 
  },
  description: "Commerce without fear. The first social marketplace where reputation is currency. Turn your hustle into a professional brand.",
  keywords: ["StoreLink", "Social Commerce", "WhatsApp Store", "Nigeria Ecommerce", "Online Shop", "Verified Vendors"],
  
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    title: "StoreLink | The Operating System for Commerce",
    description: "Empowering vendors to sell faster and safer. Join the ecosystem and grow your business with reputation-backed commerce.",
    url: 'https://storelink.ng',
    siteName: "StoreLink",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: 'https://storelink.ng/og-image.jpg', 
        width: 1200,
        height: 630,
        alt: "StoreLink - The Commerce Operating System",
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: "StoreLink | Commerce without Fear",
    description: "The professional way to manage and grow your social commerce business.",
    creator: '@kaelodev', 
    images: ['https://storelink.ng/og-image.jpg'],
  },

  verification: {
    google: 'R8d8mi7fxJ-XZ0yvJ0brHnx6cZZqo78BI1iGl-sDVcY'
  },
  category: 'business',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🔥 STRATEGIC SCHEMA: Helps Google understand the Organization
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StoreLink",
    "url": "https://storelink.ng",
    "logo": "https://storelink.ng/icon.png",
    "description": "The Operating System for Commerce. Building trust and efficiency for vendors and buyers.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "hello@storelink.ng"
    }
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900`}>
        
        {/* The Fixed Glass Navbar */}
        <Navbar />
        
        {/* The Main Stage */}
        <main className="min-h-screen flex flex-col relative w-full overflow-x-hidden">
          {children}
        </main>

        {/* Analytics Integration */}
        <GoogleAnalytics gaId="G-LC8PN9CT62" />
      </body>
    </html>
  );
}