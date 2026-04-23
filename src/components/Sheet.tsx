import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
  maxHeight = "85vh",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            style={{ maxHeight }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <div className="relative mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
            <div
              className="relative overflow-y-auto pb-[env(safe-area-inset-bottom)]"
              style={{ maxHeight: `calc(${maxHeight} - 48px)` }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
