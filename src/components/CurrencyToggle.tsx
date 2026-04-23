import { CURRENCIES, type Currency } from "../lib/types";

export function CurrencyToggle({
  value,
  onChange,
  fullWidth = false,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
  /** Distribute ARS / USD / EUR across the full width (e.g. forms) */
  fullWidth?: boolean;
}) {
  if (fullWidth) {
    return (
      <div className="box-border flex h-[2.625rem] w-full min-w-0 items-stretch gap-0.5 rounded-lg border border-[var(--line)] bg-black/20 p-0.5">
        {CURRENCIES.map((c) => {
          const active = c === value;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`min-w-0 flex-1 rounded-md text-sm font-medium tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[rgb(var(--accent-400-rgb)/0.55)] ${
                active
                  ? "bg-white/[0.12] text-[#e8e2d6]"
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

  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5 text-[11px]">
      {CURRENCIES.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
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
