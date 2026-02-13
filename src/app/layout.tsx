import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; 
import "./globals.css";
import Navbar from "../components/home/Navbar";

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

// 2. SEO Metadata
export const metadata: Metadata = {
  title: "StoreLink | The Operating System for Commerce",
  description: "Commerce without fear. The first social marketplace in Africa where reputation is currency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900`}>
        
        {/* The Fixed Glass Navbar */}
        <Navbar />
        
        {/* The Main Stage 
            - overflow-x-hidden is CRITICAL for the Hero animation 
            - relative ensures z-index works correctly
        */}
        <main className="min-h-screen flex flex-col relative w-full overflow-x-hidden">
          {children}
        </main>

      </body>
    </html>
  );
}