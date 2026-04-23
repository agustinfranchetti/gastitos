import { isSameDay } from "date-fns";
import { Sheet } from "./Sheet";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import type { Subscription } from "../lib/types";
import { paymentsInMonth, priceOn } from "../lib/billing";
import { formatMoney } from "../lib/money";
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
  if (!date) return null;

  const items = subs.filter((s) =>
    paymentsInMonth(s, date).some((d) => isSameDay(d, date)),
  );

  return (
    <Sheet open={!!date} onClose={onClose} maxHeight="70vh">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {formatWeekday(date)}
          </div>
          <div className="font-display text-3xl leading-none">
            {formatDayAndMonth(date)}
          </div>
        </div>
        <div className="text-xs text-white/40">
          {items.length === 0
            ? t("daySheet.nothingDue")
            : items.length === 1
              ? t("daySheet.subscription_one")
              : t("daySheet.subscription_other", { n: items.length })}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-4 divide-y divide-white/5 rounded-2xl border border-white/5 bg-white/[0.02]">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => onPickSub(s)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-white/5"
            >
              <Logo sub={s} token={token} size={36} rounded={10} />
              <div className="flex-1">
                <div className="text-sm">{s.name}</div>
                <div className="text-[11px] text-white/40">
                  {cycle(s.cycle)}
                </div>
              </div>
              <div className="font-display text-[17px]">
                {formatMoney(priceOn(s, date), s.currency)}
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => onAddNew(date)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm active:bg-white/10"
      >
        <Icon.Plus /> {t("daySheet.addThisDay")}
      </button>
    </Sheet>
  );
}
