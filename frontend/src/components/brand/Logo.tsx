"use client";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  showPl?: boolean;
  inverted?: boolean;
}

export function Logo({ variant = "full", className = "", showPl = true, inverted = false }: LogoProps) {
  const icon = (
    <>
      <rect x="0" y="0" width="28" height="28" rx="8" fill="#10B77F" fillOpacity="0.4" />
      <rect x="12" y="12" width="28" height="28" rx="8" fill="#10B77F" />
    </>
  );

  if (variant === "icon") {
    return (
      <svg viewBox="0 -1 40 42" className={className} aria-hidden>
        {icon}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 -1 220 43"
      className={`h-8 w-auto flex-shrink-0 ${className}`}
      preserveAspectRatio="xMinYMid meet"
      aria-label="Staffer"
    >
      {icon}
      <text
        x="48"
        y="28"
        fill={inverted ? "#ffffff" : "#0F172A"}
        fontSize="22"
        fontWeight="800"
        fontFamily="'Inter', var(--font-geist-sans), system-ui, sans-serif"
        letterSpacing="-0.03em"
      >
        staffer{showPl && ".pl"}
      </text>
    </svg>
  );
}

