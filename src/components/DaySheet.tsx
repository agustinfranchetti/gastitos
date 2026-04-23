import { isSameDay } from "date-fns";
import { Sheet } from "./Sheet";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import type { Subscription } from "../lib/types";
import { paymentsInMonth, priceOn } from "../lib/billing";
import { formatMoney } from "../lib/money";
import { useSettings } from "../lib/hooks";
import { useI18n } from "../lib/i18n";

export function DaySheet({
  date,
  subs,
  token,
  onClose,
  onPickSub,
  onAddNew,
}: {
  date: Date | null;
  subs: Subscription[];
  token?: string;
  onClose: () => void;
  onPickSub: (s: Subscription) => void;
  onAddNew: (date: Date) => void;
}) {
  const { t, formatWeekday, formatDayAndMonth, cycle } = useI18n();
  const st = useSettings();
  const mopts = { compact: st?.useCompactAmounts !== false } as const;
  if (!date) return null;

  const items = subs.filter((s) =>
    paymentsInMonth(s, date).some((d) => isSameDay(d, date)),
  );

  return (
    <Sheet open={!!date} onClose={onClose}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[color:rgb(var(--accent-500-rgb)/0.5)] dark:text-[color:rgb(var(--accent-400-rgb)/0.5)]">
            {formatWeekday(date)}
          </div>
          <div className="title-hero text-3xl leading-none">
            {formatDayAndMonth(date)}
          </div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-white/40">
          {items.length === 0
            ? t("daySheet.nothingDue")
            : items.length === 1
              ? t("daySheet.subscription_one")
              : t("daySheet.subscription_other", { n: items.length })}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4 divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200 bg-stone-50/90 dark:divide-white/5 dark:border-white/5 dark:bg-white/[0.02]">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => onPickSub(s)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-zinc-100 dark:active:bg-white/5"
            >
              <Logo sub={s} token={token} size={36} rounded={10} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-800 dark:text-white">{s.name}</div>
                {s.notes?.trim() && (
                  <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-white/45">
                    {s.notes.trim()}
                  </div>
                )}
                <div className="text-[11px] text-zinc-500 dark:text-white/40">
                  {cycle(s.cycle)}
                </div>
              </div>
              <div className="text-right text-[17px] font-medium tabular-nums text-zinc-800 dark:text-white/90">
                {formatMoney(priceOn(s, date), s.currency, mopts)}
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onAddNew(date)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-4 py-3 text-sm text-zinc-800 active:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:active:bg-white/10"
      >
        <Icon.Plus /> {t("daySheet.addThisDay")}
      </button>
    </Sheet>
  );
}
