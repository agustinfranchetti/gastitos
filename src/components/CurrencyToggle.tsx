import { CURRENCIES, type Currency } from "../lib/types";

export function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5 text-[11px]">
      {CURRENCIES.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`rounded-full px-2.5 py-1 font-medium tracking-wide transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/40"
            }`}
            aria-pressed={active}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
