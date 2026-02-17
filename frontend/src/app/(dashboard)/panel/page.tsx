"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PanelPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/grafik");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Przekierowanie do grafiku...
    </div>
  );
}
