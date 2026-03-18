"use client";

export function LoginWelcomeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 100"
      className={`w-32 h-auto max-h-[80px] flex-shrink-0 ${className}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <ellipse cx="70" cy="55" rx="60" ry="45" fill="#D1FAE5" opacity="0.5" />
      <rect x="45" y="25" width="50" height="55" rx="6" fill="white" stroke="#10B77F" strokeWidth="2" />
      <rect x="45" y="25" width="50" height="14" rx="6" fill="#10B77F" />
      <circle cx="85" cy="55" r="8" fill="#0F172A" />
      <circle cx="55" cy="75" r="4" fill="#10B77F" opacity="0.7" />
      <circle cx="70" cy="75" r="4" fill="#10B77F" opacity="0.5" />
      <circle cx="85" cy="75" r="4" fill="#0F172A" opacity="0.7" />
    </svg>
  );
}
