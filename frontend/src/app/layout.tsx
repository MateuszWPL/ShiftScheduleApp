import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Zakładam domyślne fonty z Nexta
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider"; // <--- SPRAWDŹ TEN IMPORT
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

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
      <body>
        <AuthProvider>        {/* <--- DODAJEMY */}
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors />
          </QueryProvider>
        </AuthProvider>       {/* <--- ZAMYKAMY */}
      </body>
    </html >
  );
}