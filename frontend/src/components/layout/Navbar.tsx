"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import Link from "next/link";

interface NavbarProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export function Navbar({ onLoginClick, onRegisterClick }: NavbarProps) {
  return (
    <nav className="w-full border-b border-brand-warm bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center h-8">
            <Logo className="h-8" showPl />
          </Link>

          {/* Przyciski */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onLoginClick}
              className="text-brand-dark-muted hover:text-brand-dark cursor-pointer"
            >
              Zaloguj się
            </Button>
            <Button
              onClick={onRegisterClick}
              className="bg-brand hover:bg-brand-light text-white cursor-pointer"
            >
              Zacznij za darmo
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

