import { motion } from "framer-motion";
import type { Currency } from "../lib/types";
import { formatMoney, symbol } from "../lib/money";
import { CurrencyToggle } from "./CurrencyToggle";

export function TotalBanner({
  monthLabel,
  total,
  currency,
  onChangeCurrency,
  highlight,
}: {
  monthLabel: string;
  total: number;
  currency: Currency;
  onChangeCurrency: (c: Currency) => void;
  highlight?: { name: string; amount: number; currency: Currency };
}) {
  const [main, frac] = formatMoney(total, currency)
    .replace(symbol(currency), "")
    .split(/[.,]/);
  const sep = formatMoney(1.1, currency).includes(",") ? "," : ".";

  return (
    <div className="relative px-4 pb-4 pt-3">
      <div className="text-center">
        <div className="mb-1 text-[12px] font-medium tracking-wide text-white/40">
          {monthLabel}
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
