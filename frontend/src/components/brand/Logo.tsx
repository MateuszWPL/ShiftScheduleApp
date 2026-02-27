"use client";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  showPl?: boolean;
}

/**
 * Logo Staffer – ikona z dwoma nachodzącymi kwadratami (niebieski + pomarańczowy)
 * oraz tekst "staffer". Kolory z palety: #8FACDB, #FF8400, #0B0829
 */
export function Logo({ variant = "full", className = "", showPl = true }: LogoProps) {
  const icon = (
    <>
      <rect x="0" y="0" width="28" height="28" rx="8" fill="#8FACDB" />
      <rect x="12" y="12" width="28" height="28" rx="8" fill="#FF8400" />
    </>
  );

  if (variant === "icon") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden>
        {icon}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 220 40"
      className={`h-8 w-auto flex-shrink-0 ${className}`}
      preserveAspectRatio="xMinYMid meet"
      aria-label="Staffer"
    >
      <g transform="translate(0, 6)">{icon}</g>
      <text
        x="48"
        y="28"
        fill="#0B0829"
        fontSize="22"
        fontWeight="700"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        letterSpacing="-0.02em"
      >
        staffer{showPl && ".pl"}
      </text>
    </svg>
  );
}

