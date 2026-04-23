import { useMemo, useState } from "react";
import { addYears, format, parseISO } from "date-fns";
import { Sheet } from "./Sheet";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { db } from "../lib/db";
import {
  advance,
  applyRaise,
  nextPaymentAfter,
  paymentsRemaining,
  priceOn,
} from "../lib/billing";
import { formatMoney } from "../lib/money";
import type { Subscription } from "../lib/types";
import { useCategories, usePeople } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { newId } from "../lib/id";

export function SubscriptionSheet({
  sub,
  token,
  onClose,
  onEdit,
}: {
  sub: Subscription | null;
  token?: string;
  onClose: () => void;
  onEdit: (s: Subscription) => void;
}) {
  const { t, cycle, dateLocale } = useI18n();
  const people = usePeople();
  const cats = useCategories();
  const [raiseOpen, setRaiseOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const next = useMemo(
    () => (sub ? nextPaymentAfter(sub, today) : null),
    [sub, today],
  );
  const remaining = useMemo(
    () => (sub ? paymentsRemaining(sub, today) : null),
    [sub, today],
  );
  const curPrice = useMemo(
    () => (sub ? priceOn(sub, today) : 0),
    [sub, today],
  );
  const yearly = useMemo(() => {
    if (!sub) return 0;
    const perYear: Record<string, number> = {
      weekly: 52,
      monthly: 12,
      quarterly: 4,
      yearly: 1,
      custom: 365 / Math.max(1, sub.customEveryDays ?? 30),
    };
    return curPrice * perYear[sub.cycle];
  }, [sub, curPrice]);

  if (!sub) return null;

  const money = (n: number) => formatMoney(n, sub.currency, { showCode: true });
  const person = people?.find((p) => p.id === sub.personId);
  const cat = cats?.find((c) => c.id === sub.categoryId);

  async function toggleActive() {
    if (!sub) return;
    await db.subscriptions.update(sub.id, {
      active: !sub.active,
      updatedAt: new Date().toISOString(),
    });
  }

  async function remove() {
    if (!sub) return;
    if (!confirm(t("subscription.deleteConfirm", { name: sub.name }))) return;
    await db.subscriptions.delete(sub.id);
    onClose();
  }

  return (
    <Sheet open={!!sub} onClose={onClose}>
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="mb-3 flex w-full items-center justify-between">
          <button
            onClick={toggleActive}
            className="chip !py-1 !px-2.5 !text-[11px]"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                sub.active ? "bg-emerald-400" : "bg-white/30"
              }`}
            />
            {sub.active ? t("subscription.active") : t("subscription.paused")}
          </button>
          <button
            onClick={() => onEdit(sub)}
            className="text-xs text-white/60 active:text-white"
          >
            {t("subscription.edit")}
          </button>
        </div>
        <Logo sub={sub} token={token} size={64} rounded={16} />
        <div className="title-hero text-[28px] leading-tight">
          {sub.name}
        </div>
        <div className="text-[13px] text-white/50">
          {t("subscription.planLine", {
            cycle: cycle(sub.cycle),
            amount: money(curPrice),
          })}
        </div>
      </div>

      <div className="divide-y divide-white/[0.04] overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.02]">
        <Row
          label={t("subscription.amount")}
          value={money(curPrice)}
          rightBadge={
            sub.raises?.length
              ? t("subscription.raisesBadge", { n: sub.raises.length })
              : undefined
          }
          onClick={() => setRaiseOpen(true)}
          tappable
        />
        <Row
          label={t("subscription.nextPayment")}
          value={
            next
              ? format(next, "d MMM yyyy", { locale: dateLocale })
              : t("subscription.ended")
          }
        />
        {remaining !== null && (
          <Row
            label={t("subscription.paymentsLeft")}
            value={t("subscription.paymentsLeftValue", {
              n: remaining,
              m: sub.totalPayments ?? 0,
            })}
          />
        )}
        <Row
          label={t("subscription.totalSpent")}
          value={estimateSpent(sub, today, (n) => money(n))}
        />
        <Row
          label={t("subscription.yearlyEq")}
          value={money(yearly)}
        />
        <Row
          label={t("subscription.category")}
          value={
            cat
              ? (cat.emoji?.trim() ? `${cat.emoji.trim()} ` : "") + cat.name
              : t("metrics.uncategorized")
          }
          rightColor={cat?.color}
        />
        <Row
          label={t("subscription.person")}
          value={person ? `${person.emoji ?? "•"} ${person.name}` : "—"}
        />
        <Row
          label={t("subscription.notifications")}
          value={
            sub.notify?.filter((n) => n.enabled).length
              ? t("subscription.notifyCount", {
                  n: sub.notify.filter((n) => n.enabled).length,
                })
              : t("subscription.notifyOff")
          }
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={remove} className="btn-ghost flex-1">
          <Icon.Trash /> {t("subscription.delete")}
        </button>
        <button
          onClick={() => setRaiseOpen(true)}
          className="btn-primary flex-1"
        >
          <Icon.Rocket /> {t("subscription.addRaise")}
        </button>
      </div>

      <RaiseSheet
        open={raiseOpen}
        sub={sub}
        formatMoneyWithCode={money}
        onClose={() => setRaiseOpen(false)}
      />
    </Sheet>
  );
}

function Row({
  label,
  value,
  rightColor,
  rightBadge,
  onClick,
  tappable,
}: {
  label: string;
  value: string;
  rightColor?: string;
  rightBadge?: string;
  onClick?: () => void;
  tappable?: boolean;
}) {
  const C = onClick ? "button" : "div";
  return (
    <C
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-3 text-left ${
        tappable ? "active:bg-white/5" : ""
      }`}
    >
      <span className="text-sm text-white/60">{label}</span>
      <span className="flex items-center gap-2 text-sm">
        {rightBadge && (
          <span className="rounded-full border border-[color:rgb(var(--accent-500-rgb)/0.35)] bg-[color:rgb(var(--accent-500-rgb)/0.1)] px-2 py-0.5 text-[10px] text-[color:rgb(var(--accent-200-rgb))]">
            {rightBadge}
          </span>
        )}
        {rightColor && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: rightColor }}
          />
        )}
        <span className="text-white/90">{value}</span>
      </span>
    </C>
  );
}

function estimateSpent(
  sub: Subscription,
  today: Date,
  formatAmount: (n: number) => string,
): string {
  // Roughly: iterate from startDate to today, add priceOn each period.
  const perYear: Record<string, number> = {
    weekly: 52,
    monthly: 12,
    quarterly: 4,
    yearly: 1,
    custom: 365 / Math.max(1, sub.customEveryDays ?? 30),
  };
  const start = parseISO(sub.startDate);
  const max = sub.totalPayments ?? Infinity;
  let total = 0;
  let d = start;
  let guard = 0;
  let count = 0;
  while (d <= today && guard < 5000 && count < max) {
    total += priceOn(sub, d);
    d = advance(d, sub);
    guard++;
    count++;
  }
  if (guard === 0) total = priceOn(sub, today) * perYear[sub.cycle];
  return formatAmount(total);
}

function RaiseSheet({
  open,
  sub,
  formatMoneyWithCode,
  onClose,
}: {
  open: boolean;
  sub: Subscription;
  formatMoneyWithCode: (n: number) => string;
  onClose: () => void;
}) {
  const { t, dateLocale } = useI18n();
  const [mode, setMode] = useState<"percent" | "fixed">("percent");
  const [percent, setPercent] = useState<string>("10");
  const [newPrice, setNewPrice] = useState<string>("");
  const [date, setDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [note, setNote] = useState<string>("");

  const today = new Date();
  const currentPrice = priceOn(sub, today);
  const preview = (() => {
    if (mode === "fixed") return Number(newPrice || 0);
    return applyRaise(currentPrice, {
      id: "",
      date,
      percent: Number(percent || 0),
    });
  })();

  async function save() {
    const raise = {
      id: newId(),
      date,
      note: note || undefined,
      ...(mode === "percent"
        ? { percent: Number(percent) }
        : { newPrice: Number(newPrice) }),
    };
    await db.subscriptions.update(sub.id, {
      raises: [...(sub.raises ?? []), raise],
      updatedAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="title-app text-2xl">{t("raise.title")}</div>
      <p className="mb-4 text-sm text-white/60">
        {t("raise.forLine", {
          name: sub.name,
          amount: formatMoneyWithCode(currentPrice),
        })}
      </p>

      <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/30 p-1 text-xs">
        {(["percent", "fixed"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1.5 ${
              mode === m
                ? "bg-[rgb(var(--accent-500-rgb))] text-black"
                : "text-white/70"
            }`}
          >
            {m === "percent" ? t("raise.byPercent") : t("raise.newPrice")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mode === "percent" ? (
          <Field label={t("raise.percent")}>
            <div className="flex items-center">
              <input
                className="field"
                type="number"
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
              <span className="ml-2 text-white/50">%</span>
            </div>
          </Field>
        ) : (
          <Field label={t("raise.newPriceField", { ccy: sub.currency })}>
            <input
              className="field"
              type="number"
              step="0.01"
              value={newPrice}
              placeholder={currentPrice.toFixed(2)}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </Field>
        )}
        <Field label={t("raise.effective")}>
          <input
            className="field"
            type="date"
            value={date}
            max={format(addYears(new Date(), 5), "yyyy-MM-dd")}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label={t("raise.note")}>
          <input
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("raise.notePh")}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-[color:rgb(var(--accent-500-rgb)/0.35)] bg-[color:rgb(var(--accent-500-rgb)/0.1)] px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:rgb(var(--accent-300-rgb)/0.85)]">
            {t("raise.newPriceStat")}
          </div>
          <div className="font-display text-2xl font-semibold tabular-nums text-[color:rgb(var(--accent-50-rgb))]">
            {formatMoneyWithCode(preview || 0)}
          </div>
        </div>
        <div className="text-right text-xs text-white/60">
          {t("raise.fromLine", {
            date: format(parseISO(date), "d MMM yyyy", { locale: dateLocale }),
          })}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1">
          {t("raise.cancel")}
        </button>
        <button onClick={save} className="btn-primary flex-1">
          <Icon.Check /> {t("raise.save")}
        </button>
      </div>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wider text-white/50">
        {label}
      </div>
      {children}
    </label>
  );
}
