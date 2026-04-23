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
        <div className="font-display text-2xl">
          {initial ? "Edit subscription" : "New subscription"}
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
            placeholder="Name (e.g. Spotify)"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            className="field text-sm"
            placeholder="Brand domain (e.g. spotify.com)"
            value={draft.domain ?? ""}
            onChange={(e) => setDraft({ ...draft, domain: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Price">
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
        <Field label="Currency">
          <Select
            value={draft.currency}
            onChange={(v) => setDraft({ ...draft, currency: v as Currency })}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <Field label="Cycle">
          <Select
            value={draft.cycle}
            onChange={(v) =>
              setDraft({ ...draft, cycle: v as BillingCycle })
            }
            options={cycles.map((c) => ({
              value: c,
              label: c[0].toUpperCase() + c.slice(1),
            }))}
          />
        </Field>
        {draft.cycle === "custom" && (
          <Field label="Every N days">
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
        <Field label="Starts on">
          <input
            className="field"
            type="date"
            value={draft.startDate}
            onChange={(e) =>
              setDraft({ ...draft, startDate: e.target.value })
            }
          />
        </Field>
        <Field label="Person">
          <Select
            value={draft.personId ?? ""}
            onChange={(v) => setDraft({ ...draft, personId: v || null })}
            options={[
              { value: "", label: "—" },
              ...(people ?? []).map((p) => ({
                value: p.id,
                label: `${p.emoji ?? ""} ${p.name}`.trim(),
              })),
            ]}
          />
        </Field>
        <Field label="Category">
          <Select
            value={draft.categoryId ?? ""}
            onChange={(v) => setDraft({ ...draft, categoryId: v || null })}
            options={[
              { value: "", label: "—" },
              ...(cats ?? []).map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Ends after N payments (blank = ongoing)">
          <input
            className="field"
            type="number"
            min={1}
            placeholder="e.g. 5"
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

      <div className="mt-5">
        <div className="mb-2 text-xs uppercase tracking-wider text-white/40">
          Reminders
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
                    ? "Payment day"
                    : `${rule.daysBefore} day${rule.daysBefore === 1 ? "" : "s"} before`}
                </div>
                <div className="text-xs text-white/50">
                  Fires next time you open the app after crossing the
                  threshold.
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
          Cancel
        </button>
        <button onClick={save} className="btn-primary flex-1">
          <Icon.Check /> Save
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
        checked ? "bg-ember-500" : "bg-white/10"
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
