"use client";

import { useState, useEffect, useRef } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createLocation } from "@/lib/api";
import { useLocation } from "@/components/providers/LocationContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddLocationDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { refetchLocations, setActiveLocationId } = useLocation();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-add-location-dialog", handler);
    return () => window.removeEventListener("open-add-location-dialog", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setName("");
      setAddress("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => createLocation({ name: name.trim(), address: address.trim() || undefined }),
    onSuccess: (loc) => {
      refetchLocations();
      setActiveLocationId(loc.id);
      setOpen(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nazwa lokalizacji jest wymagana.");
      return;
    }
    setError("");
    mutation.mutate();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center">
              <MapPin className="h-4 w-4 text-brand" />
            </div>
            <h2 className="text-base font-semibold text-brand-dark">Nowa lokalizacja</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-brand-dark-muted hover:bg-brand-warm-light cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-dark-soft">
              Nazwa lokalizacji <span className="text-red-500">*</span>
            </label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="np. Centrum, Oddział Mokotów"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-brand-dark-soft">
              Adres <span className="text-brand-dark-muted font-normal">(opcjonalnie)</span>
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="np. ul. Marszałkowska 1, Warszawa"
              maxLength={200}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending || !name.trim()}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Dodaj lokalizację"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
