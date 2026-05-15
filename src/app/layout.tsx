import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Dashboard Gex",
  description: "Operação Gex — leads e vendas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
