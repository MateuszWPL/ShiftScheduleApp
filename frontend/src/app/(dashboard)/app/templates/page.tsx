"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTemplates,
  getPlanStatus,
  type ScheduleTemplate,
} from "@/lib/api";
import { useDashboardUser } from "@/components/providers/DashboardUserContext";
import { CreateTemplateDialog } from "@/components/dashboard/CreateTemplateDialog";
import { SaveAsTemplateDialog } from "@/components/dashboard/SaveAsTemplateDialog";
import { ApplyTemplateDialog } from "@/components/dashboard/ApplyTemplateDialog";
import { EditTemplateDialog } from "@/components/dashboard/EditTemplateDialog";
import { DeleteTemplateDialog } from "@/components/dashboard/DeleteTemplateDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { paths } from "@/lib/app-paths";
import {
  Copy,
  Crown,
  Plus,
  FilePlus2,
  Calendar,
  Play,
  Pencil,
  Trash2,
  ChevronDown,
  Clock,
  User,
  LayoutTemplate,
} from "lucide-react";

function getWeekMonday(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Dzisiaj";
  if (diffDays === 1) return "Wczoraj";
  if (diffDays < 7) return `${diffDays} dni temu`;
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MAX_TEMPLATES = 20;

export default function TemplatesPage() {
  const { dbUser } = useDashboardUser();
  const isAdmin = dbUser?.role === "OWNER" || dbUser?.role === "MANAGER";

  const { data: planStatus } = useQuery({
    queryKey: ["plan-status"],
    queryFn: getPlanStatus,
  });

  const hasAccess = planStatus?.hasBusiness ?? false;

  const {
    data: templates = [],
    isLoading,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
    enabled: hasAccess && isAdmin,
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [saveFromWeekOpen, setSaveFromWeekOpen] = useState(false);
  const [applyTemplate, setApplyTemplate] = useState<ScheduleTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<ScheduleTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<ScheduleTemplate | null>(null);

  const currentMonday = getWeekMonday(new Date());

  // Premium gate
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-muted flex items-center justify-center mb-4">
          <Copy className="h-8 w-8 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-brand-dark mb-1">
          Szablony grafiku
        </h2>
        <p className="text-sm text-brand-dark-muted max-w-sm mb-5">
          Zapisuj tygodnie jako szablony i stosuj je jednym kliknięciem.
          Dostępne od planu{" "}
          <span className="font-semibold text-brand-blue">Business+</span>.
        </p>
        <Link
          href={paths.billing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-light text-white text-sm font-medium transition-colors"
        >
          <Crown className="h-4 w-4" />
          Ulepsz do Business+
        </Link>
      </div>
    );
  }

  // Non-admin gate
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-muted flex items-center justify-center mb-4">
          <Copy className="h-8 w-8 text-brand" />
        </div>
        <h2 className="text-lg font-bold text-brand-dark mb-1">
          Szablony grafiku
        </h2>
        <p className="text-sm text-brand-dark-muted max-w-sm">
          Szablony są dostępne tylko dla właścicieli i menedżerów.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center">
            <LayoutTemplate className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark">Szablony</h1>
            <p className="text-xs text-brand-dark-muted">
              {templates.length} / {MAX_TEMPLATES} szablonów
            </p>
          </div>
        </div>

        {/* New template button */}
        <div className="relative">
          <Button
            className="bg-brand hover:bg-brand-light text-white gap-1.5"
            onClick={() => setShowDropdown((v) => !v)}
            disabled={templates.length >= MAX_TEMPLATES}
          >
            <Plus className="h-4 w-4" />
            Nowy szablon
            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
          </Button>
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-brand-warm z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setCreateDialogOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-brand-dark hover:bg-brand-warm-light transition-colors cursor-pointer"
                >
                  <FilePlus2 className="h-4 w-4 text-brand-dark-soft" />
                  Od zera
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setSaveFromWeekOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-brand-dark hover:bg-brand-warm-light transition-colors cursor-pointer border-t border-brand-warm"
                >
                  <Calendar className="h-4 w-4 text-brand-dark-soft" />
                  Z bieżącego tygodnia
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-brand-warm bg-white p-5 animate-pulse"
            >
              <div className="h-5 bg-brand-warm rounded w-3/4 mb-3" />
              <div className="h-3 bg-brand-warm-light rounded w-1/2 mb-4" />
              <div className="h-3 bg-brand-warm-light rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && templates.length === 0 && (
        <EmptyState
          icon={Copy}
          title="Brak szablonów"
          description="Stwórz pierwszy szablon, aby szybko stosować go na nowe tygodnie."
          actionLabel="Stwórz szablon"
          onAction={() => setCreateDialogOpen(true)}
        />
      )}

      {/* Template cards */}
      {!isLoading && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="group rounded-xl border border-brand-warm bg-white hover:border-brand/30 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-brand-dark leading-snug line-clamp-2">
                    {tmpl.name}
                  </h3>
                  <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTemplate(tmpl)}
                      className="p-1.5 rounded-lg text-brand-dark-muted hover:text-brand hover:bg-brand-muted/50 transition-colors cursor-pointer touch-manipulation"
                      title="Edytuj"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTemplate(tmpl)}
                      className="p-1.5 rounded-lg text-brand-dark-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer touch-manipulation"
                      title="Usuń"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {tmpl.description && (
                  <p className="text-xs text-brand-dark-muted line-clamp-2 mb-3">
                    {tmpl.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-[11px] text-brand-dark-soft mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tmpl._count?.shifts ?? 0} zmian
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {tmpl.createdBy?.nickname || tmpl.createdBy?.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-dark-soft">
                    {relativeDate(tmpl.createdAt)}
                  </span>
                  <Button
                    size="sm"
                    className="bg-brand hover:bg-brand-light text-white gap-1 text-xs h-8"
                    onClick={() => setApplyTemplate(tmpl)}
                  >
                    <Play className="h-3 w-3" />
                    Zastosuj
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateTemplateDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      <SaveAsTemplateDialog
        isOpen={saveFromWeekOpen}
        onClose={() => setSaveFromWeekOpen(false)}
        weekStart={currentMonday}
      />
      <ApplyTemplateDialog
        isOpen={!!applyTemplate}
        onClose={() => setApplyTemplate(null)}
        template={applyTemplate}
      />
      <EditTemplateDialog
        isOpen={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        template={editTemplate}
      />
      <DeleteTemplateDialog
        isOpen={!!deleteTemplate}
        onClose={() => setDeleteTemplate(null)}
        template={deleteTemplate}
      />
    </div>
  );
}
