import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google"; // Pulling in your fonts
import { Toaster } from "react-hot-toast";
import "./globals.css";

// 1. Initialize your fonts and define their CSS variables
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const cairo = Cairo({
  subsets: ["arabic", "latin"], // Add weights or subsets if needed
  variable: "--font-cairo"
});

// 2. Set your browser tab title and site description here
export const metadata: Metadata = {
  title: "Podcast Hub | Premium Media Library",
  description: "Curate, organize, and share your favorite podcasts and media links.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. Keep the font variables injected here so Tailwind 'font-sans' works!
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <body className="font-sans bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
        {children}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#09090b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: '#fff',
                secondary: '#09090b',
              },
            },
          }}
        />
      </body>
    </html>
  );
}