"use client";

/**
 * Ilustracja brandowa – brak ogłoszeń / megafon
 * Kolory: #8FACDB, #FF8400, #F9DFC6
 */
export function AnnouncementsEmptyIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 80"
      className={`w-full h-auto max-h-[80px] ${className}`}
      aria-hidden
    >
      <ellipse cx="50" cy="45" rx="35" ry="28" fill="#F9DFC6" opacity="0.4" />
      {/* Megafon / tuba */}
      <path
        d="M30 35 L55 30 L75 40 L75 50 L55 60 L30 55 Z"
        fill="#8FACDB"
        stroke="#8FACDB"
        strokeWidth="1"
        opacity="0.9"
      />
      <ellipse cx="35" cy="45" rx="8" ry="12" fill="#FF8400" opacity="0.9" />
      <path d="M45 42 L60 45 L60 47 L45 44 Z" fill="white" opacity="0.5" />
    </svg>
  );
}
