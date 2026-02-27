import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Zakładam domyślne fonty z Nexta
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Staffer.pl — Zarządzanie grafikami zmian",
    template: "%s | Staffer.pl",
  },
  description:
    "Prosty system do tworzenia grafiku zmian, zarządzania zespołem i giełdy zmian. Dla restauracji, sklepów i usług.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://staffer.pl"),
  openGraph: {
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
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