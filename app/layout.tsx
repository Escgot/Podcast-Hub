import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google"; // Pulling in your fonts
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
      </body>
    </html>
  );
}