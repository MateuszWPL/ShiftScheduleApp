"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ImageIcon } from "lucide-react";

interface LandingImageProps {
  src: string;
  alt: string;
  placeholderText: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

/** Obraz z fallbackiem na placeholder — użytkownik może podmienić pliki w public/landing/ */
export function LandingImage({
  src,
  alt,
  placeholderText,
  className = "",
  fill,
  sizes,
  priority = false,
}: LandingImageProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => setHasError(true), []);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-warm bg-brand-warm-light/30 text-brand-dark-muted min-h-[200px] ${fill ? "absolute inset-0" : ""} ${className}`}
      >
        <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
        <span className="text-sm font-medium text-center px-4">{placeholderText}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      onError={handleError}
      className={`rounded-xl object-cover object-top ${className}`}
    />
  );
}
