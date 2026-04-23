import { useMemo } from "react";
import { Sheet } from "./Sheet";
import { CurrencyToggle } from "./CurrencyToggle";
import { useCategories, usePeople, useSettings, useSubscriptions } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { convert, formatMoney } from "../lib/money";
import { paymentsInMonth, priceOn } from "../lib/billing";
import type { Currency, FxRates, Subscription } from "../lib/types";
import { format, subMonths } from "date-fns";

const PER_YEAR: Record<string, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export function MetricsSheet({
  open,
  month,
  displayCurrency,
  onChangeCurrency,
  onClose,
}: {
  open: boolean;
  month: Date;
  displayCurrency?: Currency;
  /** Independent from home + calendar: ARS / USD / EUR for this sheet only. */
  onChangeCurrency?: (c: Currency) => void;
  onClose: () => void;
}) {
  const settings = useSettings();
  const subs = useSubscriptions();
  const people = usePeople();
  const cats = useCategories();
  const { t, dateLocale } = useI18n();

  const currency =
    displayCurrency ?? ((settings?.primaryCurrency ?? "ARS") as Currency);
  const fx = settings?.fx;
  const moneyOpts = { compact: settings?.useCompactAmounts !== false } as const;

  const monthly = useMemo(() => {
    if (!subs) return 0;
    return subs
      .filter((s) => s.active)
      .reduce((acc, s) => acc + monthTotal(s, month, currency, fx), 0);
  }, [subs, currency, fx, month]);

  const yearly = useMemo(() => {
    if (!subs) return 0;
    const ref = month;
    return subs
      .filter((s) => s.active)
      .reduce((acc, s) => {
        const perYear =
          s.cycle === "custom"
            ? 365 / Math.max(1, s.customEveryDays ?? 30)
            : s.cycle === "onetime"
              ? 0
              : PER_YEAR[s.cycle];
        const price = priceOn(s, ref);
        return acc + convert(price * perYear, s.currency, currency, fx);
      }, 0);
  }, [subs, currency, fx, month]);

  const last6 = useMemo(() => {
    if (!subs) return [] as { label: string; total: number }[];
    const out: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(month, i);
      const total = subs
        .filter((s) => s.active)
        .reduce((acc, s) => acc + monthTotal(s, m, currency, fx), 0);
      out.push({
        label: format(m, "MMM", { locale: dateLocale }),
        total,
      });
    }
    return out;
  }, [subs, currency, fx, month, dateLocale]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (!s.active) continue;
      const tot = monthTotal(s, month, currency, fx);
      if (tot === 0) continue;
      const key = s.categoryId ?? "uncategorized";
      map.set(key, (map.get(key) ?? 0) + tot);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs, currency, fx, month]);

  const byPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (!s.active) continue;
      const tot = monthTotal(s, month, currency, fx);
      if (tot === 0) continue;
      const key = s.personId ?? "—";
      map.set(key, (map.get(key) ?? 0) + tot);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs, currency, fx, month]);

  const max6 = Math.max(1, ...last6.map((x) => x.total));
  const maxCat = Math.max(1, ...byCategory.map(([, v]) => v));

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-1 text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40">
        {t("metrics.overview", {
          month: format(month, "MMM yyyy", { locale: dateLocale }),
        })}
      </div>
      <div className="title-app text-3xl">{t("metrics.title")}</div>
      {onChangeCurrency && (
        <div className="mt-3 flex justify-center">
          <CurrencyToggle value={currency} onChange={onChangeCurrency} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat
          label={t("metrics.thisMonth")}
          value={formatMoney(monthly, currency, moneyOpts)}
        />
        <Stat
          label={t("metrics.yearlyPace")}
          value={formatMoney(yearly, currency, moneyOpts)}
        />
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/40">
          {t("metrics.last6")}
        </div>
        <div className="tile flex h-44 gap-2 p-4">
          {last6.map((m, i) => (
            <div
              key={`${i}-${m.label}`}
              className="flex flex-1 flex-col items-center"
            >
              <div className="relative w-full flex-1">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-[rgb(var(--accent-700-rgb))] to-[rgb(var(--accent-300-rgb))]"
                  style={{
                    height: `${m.total > 0 ? Math.max(4, (m.total / max6) * 100) : 0}%`,
                  }}
                  title={formatMoney(m.total, currency, moneyOpts)}
                />
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 dark:text-white/50">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/40">
          {t("metrics.byCategory")}
        </div>
        <div className="tile divide-y divide-white/5 overflow-hidden">
          {byCategory.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-white/40">
              {t("metrics.nothingDue")}
            </div>
          )}
          {byCategory.map(([id, v]) => {
            const c = cats?.find((x) => x.id === id);
            return (
              <div key={id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c?.color ?? "#666" }}
                    />
                    {c?.emoji?.trim() && (
                      <span className="shrink-0 text-base leading-none" aria-hidden>
                        {c.emoji.trim()}
                      </span>
                    )}
                    <span className="min-w-0 truncate">
                      {c?.name ?? t("metrics.uncategorized")}
                    </span>
                  </span>
                  <span className="text-zinc-800 dark:text-white/80">
                    {formatMoney(v, currency, moneyOpts)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(v / maxCat) * 100}%`,
                      background: c?.color ?? "#888",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-10 mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/40">
          {t("metrics.byPerson")}
        </div>
        <div className="tile divide-y divide-white/5 overflow-hidden">
          {byPerson.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500 dark:text-white/40">
              {t("metrics.nothingDue")}
            </div>
          )}
          {byPerson.map(([id, v]) => {
            const p = people?.find((x) => x.id === id);
            return (
              <div
                key={id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                    style={{ background: p?.color ?? "#444" }}
                  >
                    {p?.emoji ?? p?.name?.[0] ?? "·"}
                  </span>
                  {p?.name ?? t("metrics.unassigned")}
                </span>
                <span className="text-zinc-800 dark:text-white/80">
                  {formatMoney(v, currency, moneyOpts)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/40">
        {label}
      </div>
      <div className="mt-1 font-display text-[28px] font-semibold leading-none tabular-nums tracking-tight text-[color:rgb(var(--accent-700-rgb))] dark:text-[color:rgb(var(--accent-200-rgb))]">
        {value}
      </div>
    </div>
  );
}

function monthTotal(
  sub: Subscription,
  month: Date,
  target: Currency,
  fx?: FxRates,
): number {
  let total = 0;
  for (const d of paymentsInMonth(sub, month)) {
    total += priceOn(sub, d);
  }
  return convert(total, sub.currency, target, fx);
}
