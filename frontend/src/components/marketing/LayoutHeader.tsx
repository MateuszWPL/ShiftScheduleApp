"use client";

import { useState, useEffect } from "react";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { MarketingNavbar } from "./MarketingNavbar";

export function LayoutHeader() {
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setShowBanner(window.scrollY < 80);
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showBanner ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <AnnouncementBanner />
      </div>
      <MarketingNavbar />
    </header>
  );
}
