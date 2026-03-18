"use client";

export function TeamEmptyIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={`w-full h-auto max-h-[90px] ${className}`}
      aria-hidden
    >
      <ellipse cx="60" cy="50" rx="45" ry="35" fill="#D1FAE5" opacity="0.4" />
      <circle cx="35" cy="40" r="12" fill="#10B77F" opacity="0.6" />
      <rect x="28" y="52" width="14" height="22" rx="4" fill="#10B77F" opacity="0.5" />
      <circle cx="60" cy="38" r="14" fill="#0F172A" opacity="0.9" />
      <rect x="51" y="50" width="18" height="24" rx="4" fill="#0F172A" opacity="0.8" />
      <circle cx="85" cy="42" r="11" fill="#10B77F" opacity="0.5" />
      <rect x="79" y="53" width="12" height="20" rx="4" fill="#10B77F" opacity="0.4" />
      <circle cx="95" cy="25" r="10" fill="#10B77F" />
      <line x1="95" y1="20" x2="95" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="25" x2="100" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
