import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { format, startOfMonth } from "date-fns";
import type { Locale } from "date-fns";
import { Sheet } from "./Sheet";
import { useI18n } from "../lib/i18n";

const ITEM_H = 44;
const PICKER_H = 220;

const PAD = (PICKER_H - ITEM_H) / 2;

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

  const scrollToValue = useCallback(() => {
    const m = value.getMonth();
    const y = value.getFullYear();
    const yi = clamp(years.indexOf(y), 0, yearCount - 1);
    requestAnimationFrame(() => {
      monthListRef.current?.scrollTo({ top: m * ITEM_H, behavior: "auto" });
      yearListRef.current?.scrollTo({ top: yi * ITEM_H, behavior: "auto" });
    });
  }, [value, years, yStart, yearCount]);

  useEffect(() => {
    if (!open) return;
    scrollToValue();
  }, [open, scrollToValue]);

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
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1/2 bg-gradient-to-b from-[#100c09] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-[#100c09] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -mt-[22px] h-[44px] border-y border-[color:rgb(var(--accent-500-rgb)/0.25)] bg-white/[0.02]"
            aria-hidden
          />

          <div
            ref={monthListRef}
            className="relative z-0 min-w-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain py-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ paddingTop: PAD, paddingBottom: PAD }}
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

          <div
            ref={yearListRef}
            className="relative z-0 w-[28%] shrink-0 snap-y snap-mandatory overflow-y-auto overscroll-contain border-l border-white/[0.08] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ paddingTop: PAD, paddingBottom: PAD }}
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
