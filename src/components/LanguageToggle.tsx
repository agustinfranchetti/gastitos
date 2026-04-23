import type { AppLocale } from "../lib/types";

const ORDER: AppLocale[] = ["en", "es"];

const LOCALE_FLAG: Record<AppLocale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

export function LanguageToggle({
  value,
  onChange,
  fullWidth = false,
  labels,
}: {
  value: AppLocale;
  onChange: (l: AppLocale) => void;
  fullWidth?: boolean;
  labels: Record<AppLocale, string>;
}) {
  if (fullWidth) {
    return (
      <div className="box-border flex h-[2.625rem] w-full min-w-0 items-stretch gap-0.5 rounded-lg border border-[var(--line)] bg-black/20 p-0.5">
        {ORDER.map((code) => {
          const active = code === value;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={`min-w-0 flex-1 rounded-md text-sm font-medium tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[rgb(var(--accent-400-rgb)/0.55)] ${
                active
                  ? "bg-white/[0.12] text-[#e8e2d6]"
                  : "text-white/40"
              }`}
              aria-pressed={active}
            >
              <span className="inline-flex w-full min-w-0 items-center justify-center gap-1.5">
                <span className="text-base leading-none" aria-hidden>
                  {LOCALE_FLAG[code]}
                </span>
                <span className="min-w-0 truncate">{labels[code]}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] p-0.5 text-[11px]">
      {ORDER.map((code) => {
        const active = code === value;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(code)}
            className={`rounded-full px-2.5 py-1 font-medium tracking-wide transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/40"
            }`}
            aria-pressed={active}
          >
            <span className="inline-flex items-center gap-1">
              <span className="text-sm leading-none" aria-hidden>
                {LOCALE_FLAG[code]}
              </span>
              {labels[code]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
