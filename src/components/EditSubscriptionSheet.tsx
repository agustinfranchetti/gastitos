import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Sheet } from "./Sheet";
import { Logo } from "./Logo";
import { Icon } from "./Icons";
import { db } from "../lib/db";
import { newId } from "../lib/id";
import { guessDomain } from "../lib/logo";
import type {
  BillingCycle,
  Currency,
  NotifyRule,
  Subscription,
} from "../lib/types";
import { CURRENCIES } from "../lib/types";
import { useCategories, usePeople, useSettings } from "../lib/hooks";
import { useI18n } from "../lib/i18n";

type Draft = Omit<Subscription, "createdAt" | "updatedAt">;

function blank(): Draft {
  return {
    id: newId(),
    name: "",
    domain: "",
    emoji: "",
    color: "",
    price: 0,
    currency: "ARS",
    cycle: "monthly",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: null,
    totalPayments: null,
    active: true,
    personId: "me",
    categoryId: null,
    notes: "",
    raises: [],
    notify: [
      { daysBefore: 0, enabled: false },
      { daysBefore: 10, enabled: false },
      { daysBefore: 30, enabled: false },
    ],
  };
}

export function EditSubscriptionSheet({
  open,
  initial,
  seedStartDate,
  onClose,
}: {
  open: boolean;
  initial: Subscription | null;
  seedStartDate?: string | null;
  onClose: () => void;
}) {
  const settings = useSettings();
  const people = usePeople();
  const cats = useCategories();
  const { t, cycle } = useI18n();
  const [draft, setDraft] = useState<Draft>(blank());

  useEffect(() => {
    if (open) {
      setDraft(
        initial
          ? { ...initial }
          : {
              ...blank(),
              currency: settings?.primaryCurrency ?? "ARS",
              startDate: seedStartDate ?? blank().startDate,
            },
      );
    }
  }, [open, initial, seedStartDate, settings?.primaryCurrency]);

  const token = settings?.logoDevKey;

  const cycles: BillingCycle[] = [
    "onetime",
    "weekly",
    "monthly",
    "quarterly",
    "yearly",
    "custom",
  ];

  async function save() {
    if (!draft.name.trim()) return;
    const now = new Date().toISOString();
    const domain =
      draft.domain?.trim() ||
      (draft.name ? guessDomain(draft.name) : "");
    const finalSub: Subscription = {
      ...draft,
      domain,
      totalPayments: draft.cycle === "onetime" ? 1 : draft.totalPayments,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    await db.subscriptions.put(finalSub);
    onClose();
  }

  const desiredDomain = draft.domain || guessDomain(draft.name || "");
  const [debouncedDomain, setDebouncedDomain] = useState(desiredDomain);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setDebouncedDomain(desiredDomain),
      500,
    );
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [desiredDomain]);

  const logoPreview = useMemo(
    () => ({
      name: draft.name || "New",
      domain: debouncedDomain,
      emoji: draft.emoji,
      color: draft.color,
    }),
    [draft.name, debouncedDomain, draft.emoji, draft.color],
  );

  function setNotify(i: number, patch: Partial<NotifyRule>) {
    const arr = [...draft.notify];
    arr[i] = { ...arr[i], ...patch };
    setDraft({ ...draft, notify: arr });
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div className="title-app text-2xl">
          {initial ? t("editSub.edit") : t("editSub.new")}
        </div>
        <button onClick={onClose} className="iconbtn">
          <Icon.X />
        </button>
      </div>

      <div className="mb-5 flex items-center gap-4">
        <Logo sub={logoPreview} token={token} size={64} rounded={18} />
        <div className="flex-1 space-y-2">
          <input
            className="field text-base"
            placeholder={t("editSub.namePh")}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            className="field text-sm"
            placeholder={t("editSub.domainPh")}
            value={draft.domain ?? ""}
            onChange={(e) => setDraft({ ...draft, domain: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("editSub.price")}>
          <input
            className="field"
            type="number"
            step="0.01"
            value={draft.price || ""}
            onChange={(e) =>
              setDraft({ ...draft, price: Number(e.target.value) })
            }
          />
        </Field>
        <Field label={t("editSub.currency")}>
          <Select
            value={draft.currency}
            onChange={(v) => setDraft({ ...draft, currency: v as Currency })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field label={t("editSub.cycle")}>
          <Select
            value={draft.cycle}
            onChange={(v) => {
              const next = v as BillingCycle;
              setDraft({
                ...draft,
                cycle: next,
                totalPayments: next === "onetime" ? 1 : draft.totalPayments,
              });
            }}
            options={cycles.map((c) => ({
              value: c,
              label: cycle(c),
            }))}
          />
        </Field>
        {draft.cycle === "custom" && (
          <Field label={t("editSub.everyN")}>
            <input
              className="field"
              type="number"
              min={1}
              value={draft.customEveryDays ?? 30}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  customEveryDays: Number(e.target.value),
                })
              }
            />
          </Field>
        )}
        <Field label={t("editSub.startDate")}>
          <input
            className="field"
            type="date"
            value={draft.startDate}
            onChange={(e) =>
              setDraft({ ...draft, startDate: e.target.value })
            }
          />
        </Field>
        <Field label={t("editSub.who")}>
          <Select
            value={draft.personId ?? ""}
            onChange={(v) => setDraft({ ...draft, personId: v || null })}
            options={[
              { value: "", label: t("editSub.none") },
              ...(people ?? []).map((p) => ({
                value: p.id,
                label: `${p.emoji ?? ""} ${p.name}`.trim(),
              })),
            ]}
          />
        </Field>
        <Field label={t("editSub.category")}>
          <Select
            value={draft.categoryId ?? ""}
            onChange={(v) => setDraft({ ...draft, categoryId: v || null })}
            options={[
              { value: "", label: t("editSub.none") },
              ...(cats ?? []).map((c) => ({
                value: c.id,
                label: (c.emoji?.trim() ? `${c.emoji.trim()} ` : "") + c.name,
              })),
            ]}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label={t("editSub.notes")}>
          <textarea
            className="field min-h-[5rem] w-full resize-y"
            placeholder={t("editSub.notesPh")}
            value={draft.notes ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, notes: e.target.value || undefined })
            }
            rows={3}
          />
        </Field>
      </div>

      {draft.cycle !== "onetime" && (
        <div className="mt-3">
          <Field label={t("editSub.endAfter")}>
            <input
              className="field"
              type="number"
              min={1}
              placeholder={t("editSub.endAfterPh")}
              value={draft.totalPayments ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  totalPayments: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Field>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-white/40">
          {t("editSub.remindTitle")}
        </div>
        <div className="tile divide-y divide-white/5 overflow-hidden rounded-2xl">
          {draft.notify.map((rule, i) => (
            <label
              key={i}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <div className="text-sm">
                  {rule.daysBefore === 0
                    ? t("editSub.daysBefore0")
                    : t("editSub.daysBeforeN", { n: rule.daysBefore })}
                </div>
                <div className="text-xs text-white/50">
                  {t("editSub.remindFires")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="field !w-16 !py-1 text-center"
                  type="number"
                  min={0}
                  value={rule.daysBefore}
                  onChange={(e) =>
                    setNotify(i, { daysBefore: Number(e.target.value) })
                  }
                />
                <Toggle
                  checked={rule.enabled}
                  onChange={(v) => setNotify(i, { enabled: v })}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={onClose} className="btn-ghost flex-1">
          {t("editSub.cancel")}
        </button>
        <button onClick={save} className="btn-primary flex-1">
          <Icon.Check /> {t("editSub.save")}
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

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        className="field appearance-none pr-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-900">
            {o.label}
          </option>
        ))}
      </select>
      <Icon.ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked
          ? "bg-[rgb(var(--accent-500-rgb))]"
          : "bg-white/10"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
