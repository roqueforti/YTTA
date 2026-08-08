import { DM_Sans, Kalam, Playfair_Display } from "next/font/google";
import "./globals.css";
import SecurityGuard from "@/components/SecurityGuard";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });
const handwriting = Kalam({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-hand" });

export const metadata = {
  title: "YTTA — Memory Sphere",
  description: "An immersive collection of shared memories.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${sans.variable} ${serif.variable} ${handwriting.variable}`}><SecurityGuard />{children}</body>
    </html>
  );
}
