"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { paths } from "@/lib/app-paths";

export default function PanelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(paths.grafik);
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64 text-brand-dark-muted">
      Przekierowanie do grafiku...
    </div>
  );
}
