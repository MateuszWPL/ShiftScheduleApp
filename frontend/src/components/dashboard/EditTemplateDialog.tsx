"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTemplate, type ScheduleTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, X, Loader2, Check } from "lucide-react";

interface EditTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: ScheduleTemplate | null;
}

export function EditTemplateDialog({
  isOpen,
  onClose,
  template,
}: EditTemplateDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (template && isOpen) {
      setName(template.name);
      setDescription(template.description ?? "");
    }
  }, [template, isOpen]);

  const editMutation = useMutation({
    mutationFn: () =>
      updateTemplate(template!.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Szablon zaktualizowany");
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    onClose();
  };

  if (!isOpen || !template) return null;

  const hasChanged =
    name.trim() !== template.name ||
    (description.trim() || "") !== (template.description ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-warm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-muted flex items-center justify-center">
              <Pencil className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark">
                Edytuj szablon
              </h2>
              <p className="text-[11px] text-brand-dark-muted">
                Zmień nazwę lub opis
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-brand-warm-light transition-colors duration-150 text-brand-dark-muted hover:text-brand-dark cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Nazwa *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1.5 w-full px-3 py-2.5 text-sm border border-brand-warm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-dark-muted uppercase tracking-wider">
              Opis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1.5 w-full px-3 py-2.5 text-sm border border-brand-warm rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-brand-warm flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            className="text-brand-dark-muted"
            onClick={handleClose}
          >
            Anuluj
          </Button>
          <Button
            className="bg-brand hover:bg-brand-light text-white gap-1.5"
            onClick={() => editMutation.mutate()}
            disabled={editMutation.isPending || !name.trim() || !hasChanged}
          >
            {editMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Zapisz zmiany
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
