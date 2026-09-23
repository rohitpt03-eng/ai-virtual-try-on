import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Virtual Try-On Platform | Realistic Fitting & Size Recommendation",
  description: "Upload your full-body photo, paste any clothing link, and experience realistic AI virtual try-on with instant size and fit recommendations.",
  keywords: ["virtual try-on", "ai fashion", "online fitting room", "size recommendation", "clothing fit preview", "ai clothes changer"],
  openGraph: {
    title: "AI Virtual Try-On Platform",
    description: "Try on any clothes virtually with AI and get precise size & fit recommendations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Virtual Try-On Platform",
    description: "Experience realistic virtual clothing try-on powered by AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}