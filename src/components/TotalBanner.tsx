import { motion } from "framer-motion";
import { Icon } from "./Icons";
import type { Currency } from "../lib/types";
import { formatMoney, symbol } from "../lib/money";
import { useSettings } from "../lib/hooks";

export function TotalBanner({
  monthLabel,
  isViewingCurrentMonth,
  onGoToCurrentMonth,
  backToCurrentMonthLabel,
  total,
  currency,
  onPrevMonth,
  onNextMonth,
  prevLabel,
  nextLabel,
}: {
  monthLabel: string;
  isViewingCurrentMonth: boolean;
  onGoToCurrentMonth: () => void;
  backToCurrentMonthLabel: string;
  total: number;
  currency: Currency;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  prevLabel: string;
  nextLabel: string;
}) {
  const st = useSettings();
  const useCompact = st?.useCompactAmounts !== false;
  const fullStr = formatMoney(total, currency, { compact: useCompact });
  const sym = symbol(currency);
  const isCompactK =
    useCompact && (fullStr.includes("K") || fullStr.includes("M"));
  let main = "";
  let frac: string | undefined;
  if (!isCompactK) {
    const parts = formatMoney(total, currency, { compact: useCompact })
      .replace(sym, "")
      .split(/[.,]/);
    main = parts[0] ?? "";
    frac = parts[1];
  }
  const sep = formatMoney(1.1, currency, { compact: false }).includes(",")
    ? ","
    : ".";
  const compactBody = (() => {
    if (!isCompactK) return "";
    let s = fullStr;
    if (s.startsWith("−")) s = s.slice(1);
    if (s.startsWith(sym)) s = s.slice(sym.length);
    return s;
  })();

  return (
    <div className="relative px-4 pb-5 pt-1">
      <div className="text-center">
        <div className="mb-2 flex min-w-0 items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={onPrevMonth}
            className="iconbtn !h-10 !w-10 shrink-0"
            aria-label={prevLabel}
          >
            <Icon.ChevronLeft />
          </button>
          <div className="title-hero min-w-0 flex-1 text-balance text-[1.4rem] leading-tight sm:text-2xl">
            {monthLabel}
          </div>
          <button
            type="button"
            onClick={onNextMonth}
            className="iconbtn !h-10 !w-10 shrink-0"
            aria-label={nextLabel}
          >
            <Icon.ChevronRight />
          </button>
        </div>
        {!isViewingCurrentMonth && (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={onGoToCurrentMonth}
              className="rounded-full border border-[color:rgb(var(--accent-500-rgb)/0.35)] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-wide text-[color:rgb(var(--accent-300-rgb))] transition-colors active:bg-white/10"
            >
              {backToCurrentMonthLabel}
            </button>
          </div>
        )}
        <motion.div
          key={total.toFixed(2) + currency}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-sans text-[52px] leading-none font-medium tracking-tight"
        >
          {isCompactK ? (
            <>
              {fullStr.startsWith("−") && (
                <span className="text-zinc-900 dark:text-white">−</span>
              )}
              <span className="text-zinc-400 dark:text-white/40">{sym}</span>
              <span className="text-zinc-900 dark:text-white">
                {compactBody}
              </span>
            </>
          ) : (
            <>
              <span className="text-zinc-400 dark:text-white/40">{sym}</span>
              <span className="text-zinc-900 dark:text-white">{main}</span>
              {frac && (
                <span className="text-zinc-400 dark:text-white/40">
                  {sep}
                  {frac}
                </span>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
