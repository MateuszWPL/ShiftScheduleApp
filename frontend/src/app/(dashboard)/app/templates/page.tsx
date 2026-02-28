"use client";

import { Crown, Copy } from "lucide-react";
import Link from "next/link";
import { paths } from "@/lib/app-paths";

export default function TemplatesPage() {
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-muted flex items-center justify-center mx-auto mb-6">
        <Copy className="h-8 w-8 text-brand" />
      </div>
      <h1 className="text-xl font-bold text-brand-dark mb-2">Szablony grafiku</h1>
      <p className="text-brand-dark-muted text-sm mb-6">
        Ta funkcja jest dostępna w planie Pro. Zapisuj tygodnie jako szablony i stosuj je jednym kliknięciem.
      </p>
      <Link
        href={paths.billing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light text-white text-sm font-medium transition-colors"
      >
        <Crown className="h-4 w-4" />
        Ulepsz do Pro
      </Link>
    </div>
  );
}
