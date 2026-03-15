"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTemplate, type ScheduleTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";

interface DeleteTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: ScheduleTemplate | null;
}

export function DeleteTemplateDialog({
  isOpen,
  onClose,
  template,
}: DeleteTemplateDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteTemplate(template!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(`Szablon „${template!.name}" został usunięty`);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-brand-dark">Usuń szablon</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brand-warm-light transition-colors duration-150 text-brand-dark-muted hover:text-brand-dark cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-brand-dark">
                Czy na pewno chcesz usunąć szablon{" "}
                <span className="font-semibold">„{template.name}"</span>?
              </p>
              <p className="text-xs text-brand-dark-muted mt-1">
                Tej operacji nie można cofnąć.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-warm flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="text-brand-dark-muted"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="destructive"
            className="gap-1.5"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Usuń
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
