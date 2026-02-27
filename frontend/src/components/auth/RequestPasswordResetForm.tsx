"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/api";

interface RequestPasswordResetFormProps {
  onBack: () => void;
}

export function RequestPasswordResetForm({ onBack }: RequestPasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
      toast.success("Email z linkiem resetu hasła został wysłany!");
    } catch (error: any) {
      toast.error("Błąd", {
        description: error.message || "Nie udało się wysłać emaila. Spróbuj ponownie.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Jeśli konto istnieje, email z linkiem resetu hasła został wysłany na adres{" "}
            <strong>{email}</strong>. Sprawdź skrzynkę pocztową.
          </p>
        </div>
        <Button onClick={onBack} variant="outline" className="w-full">
          Wróć do logowania
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          placeholder="twoj@email.pl"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Wysyłanie..." : "Wyślij link resetu hasła"}
      </Button>

      <Button
        type="button"
        onClick={onBack}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        Wróć do logowania
      </Button>
    </form>
  );
}

