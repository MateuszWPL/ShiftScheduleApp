"use client";

import Link from "next/link";
import { APP_URL } from "@/lib/site-config";

export function AnnouncementBanner() {
  return (
    <div className="bg-brand text-white py-2.5 px-4 text-center text-sm font-medium">
      <span className="hidden sm:inline">
        14 dni za darmo
        <span className="mx-3 opacity-60">·</span>
        Bez karty płatniczej
        <span className="mx-3 opacity-60">·</span>
        Bez zobowiązań
        <span className="mx-3 opacity-60">·</span>
      </span>
      <Link
        href={APP_URL}
        className="underline hover:no-underline font-semibold"
      >
        Wypróbuj Staffer za darmo →
      </Link>
    </div>
  );
}
