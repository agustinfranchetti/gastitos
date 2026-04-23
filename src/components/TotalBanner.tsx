import { motion } from "framer-motion";
import { Icon } from "./Icons";
import type { Currency } from "../lib/types";
import { formatMoney, symbol } from "../lib/money";
import { useSettings } from "../lib/hooks";
import { CurrencyToggle } from "./CurrencyToggle";

export function TotalBanner({
  monthLabel,
  total,
  currency,
  onChangeCurrency,
  onPrevMonth,
  onNextMonth,
  prevLabel,
  nextLabel,
  highlight,
}: {
  monthLabel: string;
  total: number;
  currency: Currency;
  onChangeCurrency: (c: Currency) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  prevLabel: string;
  nextLabel: string;
  highlight?: { name: string; amount: number; currency: Currency };
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
        <div className="mt-3 flex flex-col items-center gap-2">
          <CurrencyToggle value={currency} onChange={onChangeCurrency} />
          {highlight && (
            <div className="inline-flex items-center gap-2 text-[12px] text-zinc-500 dark:text-white/50">
              <span className="h-1 w-1 rounded-full bg-[rgb(var(--accent-400-rgb))]" />
              <span className="text-zinc-800 dark:text-white/80">
                {highlight.name}
              </span>
              <span className="text-zinc-400 dark:text-white/30">·</span>
              <span>
                {formatMoney(highlight.amount, highlight.currency, {
                  compact: useCompact,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
