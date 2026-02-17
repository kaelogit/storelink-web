import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; 
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from "../components/home/Navbar";
import "./globals.css";

// 1. Load the High-End Fonts
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

// 2. Mobile & Theme Settings
export const viewport: Viewport = {
  themeColor: "#10b981", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 3. Rich SEO Metadata (Makes links look expensive on WhatsApp/Twitter)
export const metadata: Metadata = {
  metadataBase: new URL('https://storelink.ng'), 
  title: {
    default: "StoreLink | Ready for Discovery",
    template: "%s | StoreLink", 
  },
  description: "Commerce without fear. The first social marketplace in Africa where reputation is currency.",
  keywords: ["StoreLink", "Social Commerce", "Nigeria Ecommerce", "Online Shop", "Verified Vendors"],
  
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
    title: "StoreLink | Ready for Discovery",
    description: "Commerce without fear. The first social marketplace in Africa where reputation is currency.",
    url: 'https://storelink.ng',
    siteName: "StoreLink",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: 'https://storelink.ng/og-image.jpg', // 👈 Absolute URL
        width: 1200,
        height: 630,
        alt: "StoreLink - The Commerce Operating System",
        type: "image/jpeg", // 👈 CRITICAL FIX: Explicitly tell FB this is a JPG
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

  // 👇 Once you get your FB ID, uncomment this to remove the warning
  /*
  other: {
    "fb:app_id": "YOUR_FUTURE_APP_ID",
  },
  */

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
  // 4. Structured Data (Helps Google understand your brand)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "StoreLink",
    "url": "https://storelink.ng",
    "logo": "https://storelink.ng/icon.png",
    "description": "Ready for Discovery.",
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
        
        {/* 🌟 THE ATMOSPHERE LAYER 🌟 */}
        <div className="bg-noise" />

        <Navbar />
        
        <main className="min-h-screen flex flex-col relative w-full overflow-x-hidden">
          {children}
        </main>

        <GoogleAnalytics gaId="G-LC8PN9CT62" />
      </body>
    </html>
  );
}