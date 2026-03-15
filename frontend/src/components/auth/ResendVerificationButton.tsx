"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { API_URL } from "@/lib/api";

interface ResendVerificationButtonProps {
  email: string;
}

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Błąd wysyłania emaila");
      }

      toast.success("Email wysłany!", {
        description: "Sprawdź skrzynkę pocztową.",
      });

      // Cooldown 60 sekund
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error("Błąd", {
        description: error.message || "Nie udało się wysłać emaila.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleResend}
      disabled={isLoading || cooldown > 0}
      variant="outline"
      className="w-full"
    >
      {isLoading
        ? "Wysyłanie..."
        : cooldown > 0
        ? `Wyślij ponownie (${cooldown}s)`
        : "Wyślij ponownie email weryfikacyjny"}
    </Button>
  );
}

