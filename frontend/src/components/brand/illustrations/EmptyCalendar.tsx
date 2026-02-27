"use client";

/**
 * Ilustracja brandowa – pusty kalendarz / grafik
 * Kolory: #8FACDB, #FF8400, #F9DFC6, #0B0829
 */
export function EmptyCalendarIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={`w-full h-auto max-h-[120px] ${className}`}
      aria-hidden
    >
      {/* Tło – delikatne kółko */}
      <circle cx="80" cy="60" r="50" fill="#F9DFC6" opacity="0.5" />
      {/* Ramka kalendarza */}
      <rect x="35" y="25" width="90" height="70" rx="8" fill="white" stroke="#8FACDB" strokeWidth="2" />
      {/* Nagłówek kalendarza */}
      <rect x="35" y="25" width="90" height="18" rx="8" fill="#8FACDB" />
      <rect x="35" y="36" width="90" height="7" fill="#8FACDB" />
      {/* Linie dni */}
      <line x1="35" y1="50" x2="125" y2="50" stroke="#F9DFC6" strokeWidth="1.5" />
      <line x1="63" y1="50" x2="63" y2="95" stroke="#F9DFC6" strokeWidth="1.5" />
      <line x1="91" y1="50" x2="91" y2="95" stroke="#F9DFC6" strokeWidth="1.5" />
      {/* Akcent – pomarańczowe kółko (nowy wpis) */}
      <circle cx="77" cy="72" r="8" fill="#FF8400" opacity="0.9" />
      <circle cx="105" cy="72" r="5" fill="#8FACDB" opacity="0.6" />
    </svg>
  );
}
