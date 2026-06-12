import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

// Configure the English font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Configure the Arabic font
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Curated Archive Hub",
  description: "A premium dashboard for curated media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      {/* By applying 'font-sans' here, Tailwind will use our custom stack 
        defined in the tailwind.config.ts file 
      */}
      <body className="font-sans bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}