import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Zakładam domyślne fonty z Nexta
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider"; // <--- SPRAWDŹ TEN IMPORT

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shift Marketplace",
  description: "Zarządzanie zmianami",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* PROVIDER MUSI BYĆ TUTAJ */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}