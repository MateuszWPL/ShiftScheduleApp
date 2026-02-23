"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
  type Announcement,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  Eye,
} from "lucide-react";

const PRIORITY_CONFIG = {
  URGENT: {
    label: "Pilne",
    border: "border-red-300",
    bg: "bg-red-50/50",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
  },
  IMPORTANT: {
    label: "Ważne",
    border: "border-amber-300",
    bg: "bg-amber-50/50",
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
  },
  NORMAL: {
    label: "Zwykłe",
    border: "border-brand-warm",
    bg: "bg-white",
    bar: "bg-brand-blue",
    badge: "bg-brand-blue-muted text-brand-blue",
    icon: <Info className="h-4 w-4 text-brand-blue" />,
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

export default function AnnouncementsPage() {
  const { dbUser } = useDashboardUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "IMPORTANT" | "URGENT">("NORMAL");
  const [expiresIn, setExpiresIn] = useState("");

  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("Ogłoszenie utworzone");
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Ogłoszenie usunięte");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const readMutation = useMutation({
    mutationFn: markAnnouncementRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setContent("");
    setPriority("NORMAL");
    setExpiresIn("");
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Wypełnij tytuł i treść");
      return;
    }

    let expiresAt: string | undefined;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }
    }

    createMutation.mutate({ title: title.trim(), content: content.trim(), priority, expiresAt });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Ogłoszenia</h1>
            <p className="text-xs text-brand-dark-muted">
              {isAdmin ? "Twórz i zarządzaj ogłoszeniami zespołu" : "Ogłoszenia od zespołu"}
            </p>
          </div>
        </div>
        {isAdmin && !showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="gap-1.5 bg-brand hover:bg-brand-light text-white text-sm"
          >
            <Plus className="h-4 w-4" />
            Nowe ogłoszenie
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && isAdmin && (
        <div className="bg-white border border-brand-warm rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-brand-dark text-sm">Nowe ogłoszenie</h2>
            <button onClick={resetForm} className="p-1 rounded-lg text-brand-dark-soft hover:text-brand-dark hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-brand-dark-muted mb-1 block">Tytuł</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Np. Zmiana godzin otwarcia"
              maxLength={120}
              className="border-brand-warm focus:border-brand focus:ring-brand/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-brand-dark-muted mb-1 block">Treść</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Treść ogłoszenia..."
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border border-brand-warm px-3 py-2 text-sm focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none resize-none"
            />
            <p className="text-[10px] text-brand-dark-soft mt-0.5 text-right">{content.length}/2000</p>
          </div>

          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">Priorytet</label>
              <div className="flex gap-1.5">
                {(["NORMAL", "IMPORTANT", "URGENT"] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p];
                  const selected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? `${cfg.border} ${cfg.bg} ${cfg.badge.split(" ")[1]}`
                          : "border-brand-warm text-brand-dark-muted hover:bg-slate-50"
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-dark-muted mb-1.5 block">
                Wygaśnięcie (dni)
              </label>
              <Input
                type="number"
                min="0"
                max="365"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                placeholder="np. 7"
                className="w-24 border-brand-warm focus:border-brand focus:ring-brand/20"
              />
            </div>

            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={resetForm} className="text-brand-dark-muted">
                Anuluj
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createMutation.isPending || !title.trim() || !content.trim()}
                className="bg-brand hover:bg-brand-light text-white"
              >
                {createMutation.isPending ? "Tworzenie..." : "Opublikuj"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {isLoading ? (
        <div className="bg-white border border-brand-warm rounded-xl p-12 text-center">
          <div className="inline-flex items-center gap-2 text-brand-dark-muted text-sm">
            <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
            Ładowanie ogłoszeń...
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white border border-brand-warm rounded-xl p-12 text-center">
          <Megaphone className="h-10 w-10 mx-auto mb-3 text-brand-dark-soft" />
          <p className="text-sm font-medium text-brand-dark-muted">Brak ogłoszeń</p>
          <p className="text-xs text-brand-dark-soft mt-1 mb-4">
            {isAdmin ? "Utwórz pierwsze ogłoszenie, aby poinformować zespół." : "Tu pojawią się ogłoszenia od zespołu."}
          </p>
          {isAdmin && !showForm && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="gap-1.5 bg-brand hover:bg-brand-light text-white"
            >
              <Plus className="h-4 w-4" />
              Utwórz pierwsze ogłoszenie
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a: Announcement) => {
            const cfg = PRIORITY_CONFIG[a.priority];
            return (
              <div
                key={a.id}
                className={`relative bg-white border rounded-xl overflow-hidden transition-all ${cfg.border} ${
                  !a.isRead ? "shadow-sm" : "opacity-80"
                }`}
              >
                {/* Left priority bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />

                <div className="pl-4 pr-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {a.priority !== "NORMAL" && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        )}
                        {!a.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                        )}
                      </div>
                      <h3 className="font-semibold text-brand-dark text-sm">{a.title}</h3>
                      <p className="text-brand-dark-muted text-sm mt-1 whitespace-pre-line leading-relaxed">
                        {a.content}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-brand-dark-soft">
                        <span>{a.author.nickname || a.author.name}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {timeAgo(a.createdAt)}
                        </span>
                        {a.expiresAt && (
                          <>
                            <span>·</span>
                            <span>
                              Wygasa: {new Date(a.expiresAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!a.isRead && (
                        <button
                          onClick={() => readMutation.mutate(a.id)}
                          className="p-1.5 rounded-lg text-brand-dark-soft hover:text-brand-blue hover:bg-brand-blue-muted/50 transition-colors"
                          title="Oznacz jako przeczytane"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) {
                              deleteMutation.mutate(a.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-brand-dark-soft hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Usuń ogłoszenie"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
