import type { Metadata, Viewport } from "next";
import { Inter, Lobster, Space_Grotesk } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from "../components/home/Navbar";
import { ThemeProvider } from "../components/providers/ThemeProvider";
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

/** Matches app `(tabs)/profile` nav @slug — `Lobster_400Regular` + `fontSizes.titleLg` (26). */
const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-app-profile-slug",
  display: "swap",
});

// 2. Mobile & Theme Settings
export const viewport: Viewport = {
  themeColor: "#10b981", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 3. Rich SEO Metadata
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
    // ✅ Next.js automatically injects opengraph-image.jpg here
  },

  twitter: {
    card: 'summary_large_image',
    title: "StoreLink | Commerce without Fear",
    description: "The professional way to manage and grow your social commerce business.",
    creator: '@kaelodev', 
    // ✅ Next.js automatically injects opengraph-image.jpg here too
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${lobster.variable} font-sans antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <ThemeProvider>
        {/* Skip to main content for keyboard/screen reader */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-emerald-500 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Skip to main content
        </a>

        <div className="bg-noise" aria-hidden="true" />

        <Navbar />

        <main id="main-content" className="min-h-screen flex flex-col relative w-full overflow-x-hidden">
          {children}
        </main>

        <GoogleAnalytics gaId="G-LC8PN9CT62" />
        </ThemeProvider>
      </body>
    </html>
  );
}