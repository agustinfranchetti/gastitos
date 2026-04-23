import { motion } from "framer-motion";
import { Icon } from "./Icons";
import type { Currency } from "../lib/types";
import { formatMoney, symbol } from "../lib/money";
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
  const [main, frac] = formatMoney(total, currency)
    .replace(symbol(currency), "")
    .split(/[.,]/);
  const sep = formatMoney(1.1, currency).includes(",") ? "," : ".";

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
          <div className="min-w-0 flex-1 font-display text-[1.4rem] italic leading-tight text-white/90 sm:text-2xl">
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
          <span className="text-white/40">{symbol(currency)}</span>
          <span className="text-white">{main}</span>
          {frac && <span className="text-white/40">{sep}{frac}</span>}
        </motion.div>
        <div className="mt-3 flex flex-col items-center gap-2">
          <CurrencyToggle value={currency} onChange={onChangeCurrency} />
          {highlight && (
            <div className="inline-flex items-center gap-2 text-[12px] text-white/50">
              <span className="h-1 w-1 rounded-full bg-ember-400" />
              <span className="text-white/80">{highlight.name}</span>
              <span className="text-white/30">·</span>
              <span>{formatMoney(highlight.amount, highlight.currency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
