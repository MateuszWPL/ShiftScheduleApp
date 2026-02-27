import type { Metadata } from "next";
import { LayoutHeader } from "@/components/marketing/LayoutHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Staffer.pl — Zarządzanie grafikami zmian",
  description:
    "Prosty system do tworzenia grafiku zmian, zarządzania zespołem i giełdy zmian. Dla restauracji, sklepów i usług.",
  openGraph: {
    title: "Staffer.pl — Zarządzanie grafikami zmian",
    description:
      "Prosty system do tworzenia grafiku zmian, zarządzania zespołem i giełdy zmian.",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-surface">
      <LayoutHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
