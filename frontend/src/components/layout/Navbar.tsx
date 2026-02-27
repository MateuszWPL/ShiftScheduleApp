"use client";

import { Button } from "@/components/ui/button";
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
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-brand-dark">Staffer.pl</span>
          </Link>

          {/* Przyciski */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onLoginClick}
              className="text-brand-dark-muted hover:text-brand-dark"
            >
              Zaloguj się
            </Button>
            <Button
              onClick={onRegisterClick}
              className="bg-brand hover:bg-brand-light text-white"
            >
              Zacznij za darmo
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

