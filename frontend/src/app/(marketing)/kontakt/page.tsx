import type { Metadata } from "next";
import { ContactPageContent } from "@/components/marketing/ContactPageContent";

export const metadata: Metadata = {
  title: "Kontakt | Staffer.pl",
  description:
    "Skontaktuj się z nami — pomożemy wdrożyć Staffera w Twoim zespole.",
};

export default function KontaktPage() {
  return <ContactPageContent />;
}
