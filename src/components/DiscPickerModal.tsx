import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

/** Common picks for people & categories */
export const EMOJI_SUGGESTIONS = [
  "🙂",
  "😀",
  "🎬",
  "🎮",
  "🍔",
  "☕",
  "🏠",
  "💳",
  "✈️",
  "🎵",
  "📱",
  "💼",
  "🏥",
  "🔧",
  "🏷️",
  "🌟",
  "❤️",
  "🎁",
  "🚗",
  "🏋️",
  "🎨",
  "📚",
  "🐶",
  "🌮",
  "💡",
  "🛒",
  "🎧",
  "✨",
  "🔔",
  "📊",
  "🌿",
  "🎸",
] as const;

type DiscPickerModalProps = {
  open: boolean;
  onClose: () => void;
  initialColor: string;
  initialEmoji: string;
  onSave: (next: { color: string; emoji: string }) => void;
  title: string;
  colorLabel: string;
  iconLabel: string;
  customHint: string;
  cancelLabel: string;
  applyLabel: string;
};

export function DiscPickerModal({
  open,
  onClose,
  initialColor,
  initialEmoji,
  onSave,
  title,
  colorLabel,
  iconLabel,
  customHint,
  cancelLabel,
  applyLabel,
}: DiscPickerModalProps) {
  const id = useId();
  const colorId = `${id}-color`;
  const [color, setColor] = useState(initialColor);
  const [emoji, setEmoji] = useState(initialEmoji);

  useEffect(() => {
    if (open) {
      setColor(initialColor);
      setEmoji(initialEmoji);
    }
  }, [open, initialColor, initialEmoji]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  function save() {
    onSave({ color, emoji: emoji.trim() });
    onClose();
  }

  return createPortal(
    open ? (
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          className="w-full max-w-sm space-y-4 rounded-[12px] border border-zinc-800 bg-[#100c09] p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="title-app text-lg" id={`${id}-title`}>
            {title}
          </div>

          <div>
            <label
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-white/45"
              htmlFor={colorId}
            >
              {colorLabel}
            </label>
            <div className="flex items-center gap-3">
              <input
                id={colorId}
                type="color"
                className="h-12 w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <code className="min-w-0 flex-1 truncate text-xs text-white/50 tabular-nums">
                {color}
              </code>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-white/45">
              {iconLabel}
            </p>
            <div className="mb-2 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {EMOJI_SUGGESTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-lg leading-none transition-colors ${
                    emoji === e
                      ? "border-[rgb(var(--accent-500-rgb))] bg-white/10"
                      : "border-white/10 bg-white/[0.03] active:bg-white/10"
                  }`}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              className="field w-full"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder={customHint}
              maxLength={12}
            />
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="button" className="btn-primary flex-1" onClick={save}>
              {applyLabel}
            </button>
          </div>
        </div>
      </div>
    ) : null,
    document.body,
  );
}
