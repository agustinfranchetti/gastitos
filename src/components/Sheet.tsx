import {
  AnimatePresence,
  motion,
  useDragControls,
} from "framer-motion";
import { type CSSProperties, type ReactNode, useEffect } from "react";
import { lockBodyScroll, unlockBodyScroll } from "../lib/bodyScrollLock";

/** Default max height; align with `Settings` / main panels (month picker often overrides smaller). */
export const SHEET_DEFAULT_MAX_HEIGHT = "85vh";

export function Sheet({
  open,
  onClose,
  children,
  footer,
  maxHeight = SHEET_DEFAULT_MAX_HEIGHT,
  sizing = "default",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom; body scrolls independently (no footer prop = single scroll) */
  footer?: ReactNode;
  maxHeight?: string;
  /**
   * `default` = sheet is always the max height (scroll inside).
   * `content` = height follows content, capped at maxHeight (day tap, small panels).
   */
  sizing?: "default" | "content";
}) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlockBodyScroll();
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
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Panel"
            className={
              sizing === "content"
                ? "sheet flex touch-manipulation h-auto min-h-0 w-full max-w-full flex-col overflow-hidden !min-h-0 max-h-[var(--sheet-h)]"
                : "sheet flex touch-manipulation h-[var(--sheet-h)] max-h-[var(--sheet-h)] min-h-[var(--sheet-h)] w-full max-w-full flex-col overflow-hidden"
            }
            style={
              {
                "--sheet-h": maxHeight,
              } as CSSProperties
            }
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 320 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 72 || info.velocity.y > 650) onClose();
            }}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none flex-col items-center pb-1 pt-2 active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="h-1.5 w-10 rounded-full bg-zinc-300/80 dark:bg-white/25" />
            </div>
            <div
              className={
                sizing === "content"
                  ? "sheet-scroll relative h-auto min-h-0 w-full max-h-[calc(var(--sheet-h)-2.75rem)] overflow-x-hidden overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
                  : `sheet-scroll relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain ${
                      footer
                        ? "pb-3"
                        : "pb-[env(safe-area-inset-bottom)]"
                    }`
              }
            >
              {children}
            </div>
            {footer && (
              <div className="shrink-0 border-t border-white/[0.08] pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
