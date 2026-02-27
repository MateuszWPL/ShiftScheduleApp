"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, string> = {
  SHIFT_ASSIGNED: "📋",
  SHIFT_PUBLISHED: "📢",
  SHIFT_DELETED: "🗑️",
  SHIFT_ON_MARKETPLACE: "🏪",
  MEMBERSHIP_APPROVED: "👥",
  ANNOUNCEMENT: "📣",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  const days = Math.floor(hrs / 24);
  return `${days}d temu`;
}

export function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: open,
  });

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllReadMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-brand-dark-muted hover:text-brand hover:bg-brand-muted transition-colors"
        title="Powiadomienia"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`fixed top-24 left-2 right-2 w-auto z-50 md:absolute md:top-full md:mt-2 md:left-auto md:right-0 md:w-[360px] md:max-w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden ${align === "left" ? "md:left-0 md:right-auto" : ""}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-warm bg-brand-surface">
            <h3 className="font-semibold text-slate-800 text-sm">Powiadomienia</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-blue-600"
                  onClick={() => markAllReadMut.mutate()}
                  disabled={markAllReadMut.isPending}
                >
                  <CheckCheck className="h-3 w-3" />
                  Oznacz wszystkie
                </Button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-slate-500 text-sm">Ładowanie...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Brak powiadomień
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-brand-warm/30 transition-colors cursor-pointer hover:bg-brand-warm-light ${
                    !n.read ? "bg-blue-50/40" : ""
                  }`}
                  onClick={() => {
                    if (!n.read) markReadMut.mutate(n.id);
                  }}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
