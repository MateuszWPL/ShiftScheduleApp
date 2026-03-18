"use client";

export function EmptyCalendarIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={`w-full h-auto max-h-[120px] ${className}`}
      aria-hidden
    >
      <circle cx="80" cy="60" r="50" fill="#D1FAE5" opacity="0.5" />
      <rect x="35" y="25" width="90" height="70" rx="8" fill="white" stroke="#10B77F" strokeWidth="2" />
      <rect x="35" y="25" width="90" height="18" rx="8" fill="#10B77F" />
      <rect x="35" y="36" width="90" height="7" fill="#10B77F" />
      <line x1="35" y1="50" x2="125" y2="50" stroke="#D1FAE5" strokeWidth="1.5" />
      <line x1="63" y1="50" x2="63" y2="95" stroke="#D1FAE5" strokeWidth="1.5" />
      <line x1="91" y1="50" x2="91" y2="95" stroke="#D1FAE5" strokeWidth="1.5" />
      <circle cx="77" cy="72" r="8" fill="#10B77F" opacity="0.9" />
      <circle cx="105" cy="72" r="5" fill="#0F172A" opacity="0.6" />
    </svg>
  );
}
