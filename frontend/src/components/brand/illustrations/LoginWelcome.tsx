"use client";

/**
 * Ilustracja brandowa – witamy / logowanie
 * Kolory: #8FACDB, #FF8400, #F9DFC6, #0B0829
 */
export function LoginWelcomeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 100"
      className={`w-32 h-auto max-h-[80px] flex-shrink-0 ${className}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {/* Łagodne tło */}
      <ellipse cx="70" cy="55" rx="60" ry="45" fill="#F9DFC6" opacity="0.4" />
      {/* Ikona „drzwi” / wejście – stylizowane */}
      <rect x="45" y="25" width="50" height="55" rx="6" fill="white" stroke="#8FACDB" strokeWidth="2" />
      <rect x="45" y="25" width="50" height="14" rx="6" fill="#8FACDB" />
      {/* Klamka */}
      <circle cx="85" cy="55" r="8" fill="#FF8400" />
      {/* Małe kółka – ludzie / zespoły */}
      <circle cx="55" cy="75" r="4" fill="#8FACDB" opacity="0.7" />
      <circle cx="70" cy="75" r="4" fill="#8FACDB" opacity="0.5" />
      <circle cx="85" cy="75" r="4" fill="#FF8400" opacity="0.7" />
    </svg>
  );
}
