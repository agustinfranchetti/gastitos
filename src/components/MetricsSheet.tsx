import { useMemo } from "react";
import { Sheet } from "./Sheet";
import { useCategories, usePeople, useSettings, useSubscriptions } from "../lib/hooks";
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
  onClose,
}: {
  open: boolean;
  month: Date;
  displayCurrency?: Currency;
  onClose: () => void;
}) {
  const settings = useSettings();
  const subs = useSubscriptions();
  const people = usePeople();
  const cats = useCategories();

  const currency =
    displayCurrency ?? ((settings?.primaryCurrency ?? "ARS") as Currency);
  const fx = settings?.fx;

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
      out.push({ label: format(m, "MMM"), total });
    }
    return out;
  }, [subs, currency, fx, month]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (!s.active) continue;
      const t = monthTotal(s, month, currency, fx);
      if (t === 0) continue;
      const key = s.categoryId ?? "uncategorized";
      map.set(key, (map.get(key) ?? 0) + t);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs, currency, fx, month]);

  const byPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs ?? []) {
      if (!s.active) continue;
      const t = monthTotal(s, month, currency, fx);
      if (t === 0) continue;
      const key = s.personId ?? "—";
      map.set(key, (map.get(key) ?? 0) + t);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subs, currency, fx, month]);

  const max6 = Math.max(1, ...last6.map((x) => x.total));
  const maxCat = Math.max(1, ...byCategory.map(([, v]) => v));

  return (
    <Sheet open={open} onClose={onClose} maxHeight="92vh">
      <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">
        Overview · {format(month, "MMM yyyy")}
      </div>
      <div className="font-display text-3xl">The bigger picture</div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="This month" value={formatMoney(monthly, currency)} />
        <Stat label="Yearly pace" value={formatMoney(yearly, currency)} />
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
          Last 6 months
        </div>
        <div className="tile flex h-44 gap-2 p-4">
          {last6.map((m) => (
            <div
              key={m.label}
              className="flex flex-1 flex-col items-center"
            >
              <div className="relative w-full flex-1">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md bg-gradient-to-t from-ember-700 to-ember-300"
                  style={{
                    height: `${m.total > 0 ? Math.max(4, (m.total / max6) * 100) : 0}%`,
                  }}
                  title={formatMoney(m.total, currency)}
                />
              </div>
              <div className="mt-2 text-[10px] text-white/50">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
          By category
        </div>
        <div className="tile divide-y divide-white/5 overflow-hidden">
          {byCategory.length === 0 && (
            <div className="px-4 py-3 text-sm text-white/40">
              Nothing due this month.
            </div>
          )}
          {byCategory.map(([id, v]) => {
            const c = cats?.find((x) => x.id === id);
            return (
              <div key={id} className="px-4 py-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: c?.color ?? "#666" }}
                    />
                    {c?.name ?? "Uncategorized"}
                  </span>
                  <span className="text-white/80">
                    {formatMoney(v, currency)}
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
        <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
          By person
        </div>
        <div className="tile divide-y divide-white/5 overflow-hidden">
          {byPerson.length === 0 && (
            <div className="px-4 py-3 text-sm text-white/40">
              Nothing due this month.
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
                  {p?.name ?? "Unassigned"}
                </span>
                <span className="text-white/80">
                  {formatMoney(v, currency)}
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
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
        {label}
      </div>
      <div className="mt-1 font-display text-[28px] leading-none">{value}</div>
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
