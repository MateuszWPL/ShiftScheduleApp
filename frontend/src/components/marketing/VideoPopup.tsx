"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL wideo YouTube lub Vimeo — np. https://www.youtube.com/embed/xxx */
  videoSrc?: string;
}

export function VideoPopup({ isOpen, onClose, videoSrc }: VideoPopupProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose]);

  const embedUrl = videoSrc;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="relative w-full max-w-4xl aspect-video bg-brand-dark rounded-xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Demo Staffer"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 p-8">
                <p className="text-lg font-medium mb-2">Wkrótce demo wideo</p>
                <p className="text-sm text-center max-w-md">
                  Umieść URL wideo YouTube w komponencie VideoPopup (prop videoSrc)
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
