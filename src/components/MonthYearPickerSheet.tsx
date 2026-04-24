import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { format, startOfMonth } from "date-fns";
import type { Locale } from "date-fns";
import { Sheet } from "./Sheet";
import { useI18n } from "../lib/i18n";

const ITEM_H = 44;
const PICKER_H = 220;
const ARROW_H = 32;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Current month (any day in that month) */
  value: Date;
  onChange: (monthStart: Date) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scrollIndexFromTop(scrollTop: number, count: number) {
  return clamp(Math.round(scrollTop / ITEM_H), 0, count - 1);
}

function PickerNudgeButton({
  dir,
  onClick,
  label,
}: {
  dir: "up" | "down";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative z-20 mx-0.5 flex h-8 max-w-full shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0 [isolation:isolate]"
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-7 w-7 shrink-0 ${dir === "up" ? "-translate-y-px rotate-180" : "translate-y-px"}`}
        style={{ fill: "rgb(var(--accent-400-rgb))" }}
        aria-hidden
      >
        <path d="M12 16.2 4.2 7.8h15.6L12 16.2z" />
      </svg>
    </button>
  );
}

function useDesktopUi() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const s = () => setOn(mq.matches);
    s();
    mq.addEventListener("change", s);
    return () => mq.removeEventListener("change", s);
  }, []);
  return on;
}

export function MonthYearPickerSheet({ open, onClose, value, onChange }: Props) {
  const { t, dateLocale: locale } = useI18n();
  const id = useId();
  const monthListRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const yearCount = 32;
  const yStart = value.getFullYear() - 12;
  const years = useMemo(
    () => Array.from({ length: yearCount }, (_, i) => yStart + i),
    [yStart],
  );
  const months = Array.from({ length: 12 }, (_, m) => m);

  const desktop = useDesktopUi();
  const listH = desktop ? PICKER_H - 2 * ARROW_H : PICKER_H;
  const pad = (listH - ITEM_H) / 2;

  const scrollToValue = useCallback(() => {
    const m = value.getMonth();
    const y = value.getFullYear();
    const yi = clamp(years.indexOf(y), 0, yearCount - 1);
    requestAnimationFrame(() => {
      monthListRef.current?.scrollTo({ top: m * ITEM_H, behavior: "auto" });
      yearListRef.current?.scrollTo({ top: yi * ITEM_H, behavior: "auto" });
    });
  }, [value, years, yearCount]);

  useEffect(() => {
    if (!open) return;
    scrollToValue();
  }, [open, scrollToValue, desktop, pad]);

  const nudgeMonth = useCallback((d: -1 | 1) => {
    const el = monthListRef.current;
    if (!el) return;
    const i = scrollIndexFromTop(el.scrollTop, 12);
    const next = clamp(i + d, 0, 11);
    el.scrollTo({ top: next * ITEM_H, behavior: "smooth" });
  }, []);

  const nudgeYear = useCallback(
    (d: -1 | 1) => {
      const el = yearListRef.current;
      if (!el) return;
      const i = scrollIndexFromTop(el.scrollTop, yearCount);
      const next = clamp(i + d, 0, yearCount - 1);
      el.scrollTo({ top: next * ITEM_H, behavior: "smooth" });
    },
    [yearCount],
  );

  function readSelection(): Date {
    const me = monthListRef.current;
    const ye = yearListRef.current;
    const mi = me ? scrollIndexFromTop(me.scrollTop, 12) : 0;
    const yi = ye ? scrollIndexFromTop(ye.scrollTop, yearCount) : 0;
    const y = years[yi] ?? value.getFullYear();
    return startOfMonth(new Date(y, mi, 1));
  }

  function commit() {
    onChange(readSelection());
    onClose();
  }

  const nudgeUpLabel = t("header.pickNudgeUp");
  const nudgeDownLabel = t("header.pickNudgeDown");

  return (
    <Sheet open={open} onClose={onClose} maxHeight="50vh">
      <div className="px-4 pb-4 pt-0">
        <h2
          className="mb-1 text-center font-medium text-white/90"
          id={id + "-title"}
        >
          {t("header.pickMonthYear")}
        </h2>
        <p className="mb-3 text-center text-xs text-white/40">{t("header.pickMonthHint")}</p>

        <div
          className="relative mx-auto flex max-w-sm justify-center gap-0 overflow-hidden rounded-xl border border-white/10 bg-black/30"
          style={{ height: PICKER_H }}
        >
          {/*
            Con flechas (desktop) los degradés no pueden tapar 0–ARROW_H: oscurecían el triángulo.
            En móvil, degradé a toda la altura como antes.
          */}
          {desktop ? (
            <div
              className="pointer-events-none absolute inset-x-0 z-10"
              style={{ top: ARROW_H, bottom: ARROW_H }}
              aria-hidden
            >
              <div className="h-1/2 w-full bg-gradient-to-b from-[#100c09] to-transparent" />
              <div className="h-1/2 w-full bg-gradient-to-t from-[#100c09] to-transparent" />
            </div>
          ) : (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/2 bg-gradient-to-b from-[#100c09] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-[#100c09] to-transparent"
                aria-hidden
              />
            </>
          )}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -mt-[22px] h-[44px] border-y border-[color:rgb(var(--accent-500-rgb)/0.25)] bg-white/[0.02]"
            aria-hidden
          />

          <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
            {desktop && (
              <PickerNudgeButton
                dir="up"
                onClick={() => nudgeMonth(-1)}
                label={nudgeUpLabel}
              />
            )}
            <div
              ref={monthListRef}
              className="relative z-0 min-h-0 min-w-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ paddingTop: pad, paddingBottom: pad }}
              role="listbox"
              aria-labelledby={id + "-title"}
              tabIndex={0}
            >
              {months.map((m) => (
                <div
                  key={m}
                  className="flex h-11 snap-center snap-always items-center justify-center text-sm font-medium text-white/90"
                  style={{ height: ITEM_H }}
                  role="option"
                >
                  {format(new Date(2024, m, 1), "LLLL", { locale: locale as Locale })}
                </div>
              ))}
            </div>
            {desktop && (
              <PickerNudgeButton
                dir="down"
                onClick={() => nudgeMonth(1)}
                label={nudgeDownLabel}
              />
            )}
          </div>

          <div className="relative z-0 flex min-h-0 w-[28%] shrink-0 flex-col border-l border-white/[0.08]">
            {desktop && (
              <PickerNudgeButton
                dir="up"
                onClick={() => nudgeYear(-1)}
                label={nudgeUpLabel}
              />
            )}
            <div
              ref={yearListRef}
              className="relative z-0 min-h-0 w-full flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ paddingTop: pad, paddingBottom: pad }}
              role="listbox"
              tabIndex={0}
            >
              {years.map((y) => (
                <div
                  key={y}
                  className="flex h-11 snap-center snap-always items-center justify-center text-sm font-medium tabular-nums text-white/90"
                  style={{ height: ITEM_H }}
                  role="option"
                >
                  {y}
                </div>
              ))}
            </div>
            {desktop && (
              <PickerNudgeButton
                dir="down"
                onClick={() => nudgeYear(1)}
                label={nudgeDownLabel}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            className="btn-primary min-w-[120px] px-6"
            onClick={commit}
          >
            {t("header.pickMonthDone")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
