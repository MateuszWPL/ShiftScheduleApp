"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  syncToGoogleCalendar,
  disconnectGoogleCalendar,
  getPlanStatus,
} from "@/lib/api";
import {
  CalendarSync,
  Check,
  Loader2,
  LogOut,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

interface CalendarSyncButtonProps {
  from: string;
  to: string;
  label?: string;
  className?: string;
}

export function CalendarSyncButton({
  from,
  to,
  label = "Synchronizuj z Google Calendar",
  className = "",
}: CalendarSyncButtonProps) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
  });

  const { data: gcalStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: getGoogleCalendarStatus,
    enabled: planStatus?.hasStarter ?? false,
  });

  const hasAccess = planStatus?.hasStarter ?? false;
  const isConnected = gcalStatus?.connected ?? false;

  const handleConnect = useCallback(async () => {
    try {
      const { url } = await getGoogleCalendarAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się rozpocząć połączenia z Google.",
      );
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      const result = await syncToGoogleCalendar(from, to);
      setSyncDone(true);
      const msg =
        result.total === 0
          ? "Brak zmian do zsynchronizowania w wybranym okresie."
          : `Zsynchronizowano ${result.total} zmian (${result.created} nowych, ${result.updated} zaktualizowanych).`;
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
      setTimeout(() => setSyncDone(false), 3000);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Błąd synchronizacji z Google Calendar.",
      );
    }
    setSyncing(false);
  }, [from, to, queryClient]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectGoogleCalendar();
      toast.success("Rozłączono z Google Calendar.");
      queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
      setShowMenu(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Błąd rozłączania.",
      );
    }
  }, [queryClient]);

  if (!hasAccess) {
    return null;
  }

  if (statusLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-brand-warm bg-white text-sm text-brand-dark-muted ${className}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Kalendarz...</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-brand-warm hover:border-brand/30 hover:bg-brand-warm-light text-sm font-medium text-brand-dark transition-colors ${className}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Połącz z Google Calendar
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="inline-flex rounded-lg border border-brand-warm bg-white overflow-hidden">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-brand-dark hover:bg-brand-warm-light transition-colors disabled:opacity-60"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          ) : syncDone ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <CalendarSync className="h-4 w-4 text-brand" />
          )}
          {syncing ? "Synchronizuję..." : syncDone ? "Zsynchronizowano!" : label}
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-2 py-2 border-l border-brand-warm hover:bg-brand-warm-light transition-colors"
          aria-label="Opcje kalendarza"
        >
          <CalendarDays className="h-4 w-4 text-brand-dark-muted" />
        </button>
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl bg-white border border-brand-warm shadow-lg p-2 space-y-0.5">
            {gcalStatus?.email && (
              <div className="px-3 py-2 text-xs text-brand-dark-muted border-b border-brand-warm mb-1">
                Połączono: {gcalStatus.email}
                {gcalStatus.lastSyncedAt && (
                  <span className="block mt-0.5">
                    Ostatnia sync:{" "}
                    {new Date(gcalStatus.lastSyncedAt).toLocaleString("pl-PL", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            )}
            <button
              onClick={() => {
                handleSync();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-dark hover:bg-brand-warm-light transition-colors"
            >
              <CalendarSync className="h-4 w-4 text-brand" />
              Synchronizuj teraz
            </button>
            <button
              onClick={() => {
                window.open("https://calendar.google.com", "_blank");
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-brand-dark hover:bg-brand-warm-light transition-colors"
            >
              <ExternalLink className="h-4 w-4 text-brand-dark-muted" />
              Otwórz Google Calendar
            </button>
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Rozłącz Google Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
