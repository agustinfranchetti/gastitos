import { useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icons";
import { db } from "../lib/db";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { fetchFxRates } from "../lib/money";
import type {
  Category,
  Currency,
  Person,
  Settings,
} from "../lib/types";
import { CURRENCIES } from "../lib/types";
import { useCategories, usePeople, useSettings } from "../lib/hooks";
import { newId } from "../lib/id";
import { requestNotificationPermission } from "../lib/notify";
import { Select, Toggle } from "./EditSubscriptionSheet";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const settings = useSettings();
  const people = usePeople();
  const cats = useCategories();
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);

  if (!settings) return null;

  async function patch(p: Partial<Settings>) {
    await db.settings.update("singleton", p);
  }

  async function refreshFx() {
    setFxLoading(true);
    setFxError(null);
    try {
      const fx = await fetchFxRates(settings!.primaryCurrency);
      await patch({ fx });
    } catch (e) {
      setFxError((e as Error).message);
    } finally {
      setFxLoading(false);
    }
  }

  async function toggleNotifications(v: boolean) {
    if (v) {
      const perm = await requestNotificationPermission();
      await patch({ notificationsEnabled: perm === "granted" });
    } else {
      await patch({ notificationsEnabled: false });
    }
  }

  return (
    <Sheet open={open} onClose={onClose} maxHeight="92vh">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-display text-2xl">Settings</div>
        <button onClick={onClose} className="iconbtn">
          <Icon.X />
        </button>
      </div>

      {supabaseEnabled && <AccountSection />}

      <Section title="Currency">
        <div className="space-y-3">
          <Row label="Primary">
            <Select
              value={settings.primaryCurrency}
              onChange={(v) => patch({ primaryCurrency: v as Currency })}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </Row>
          <Row label="FX rates">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">
                {settings.fx?.fetchedAt
                  ? new Date(settings.fx.fetchedAt).toLocaleString()
                  : "never"}
              </span>
              <button
                onClick={refreshFx}
                disabled={fxLoading}
                className="btn-ghost !py-1.5 text-xs"
              >
                {fxLoading ? "…" : "Refresh"}
              </button>
            </div>
          </Row>
          {fxError && (
            <div className="text-xs text-red-400">FX error: {fxError}</div>
          )}
        </div>
      </Section>

      <Section title="Logo.dev">
        <Row label="API key">
          <input
            className="field"
            type="password"
            placeholder="pk_..."
            value={settings.logoDevKey ?? ""}
            onChange={(e) => patch({ logoDevKey: e.target.value })}
          />
        </Row>
        <p className="mt-2 text-xs text-white/50">
          Get a free key at{" "}
          <a
            className="underline"
            href="https://www.logo.dev/docs/platform/api-keys"
            target="_blank"
            rel="noreferrer"
          >
            logo.dev/docs/platform/api-keys
          </a>
          . Your key stays on this device.
        </p>
      </Section>

      <Section title="Notifications">
        <Row label="Enable reminders">
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
        </Row>
        <p className="mt-2 text-xs text-white/50">
          Reminders fire the next time you open the app after a threshold is
          crossed. Up to 3 per subscription.
        </p>
      </Section>

      <Section title="People">
        <PeopleEditor people={people ?? []} />
      </Section>

      <Section title="Categories">
        <CategoriesEditor cats={cats ?? []} />
      </Section>

      <div className="h-6" />
    </Sheet>
  );
}

function AccountSection() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signIn() {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSent(false);
    setEmail("");
  }

  return (
    <Section title="Account">
      {user ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Icon.Cloud className="text-ember-300" />
            <div>
              <div className="text-white/90">{user.email}</div>
              <div className="text-[11px] text-white/40">Synced</div>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost !py-1.5 text-xs">
            <Icon.LogOut /> Sign out
          </button>
        </div>
      ) : sent ? (
        <div className="text-sm text-white/70">
          Check <span className="text-white">{email}</span> for a magic link.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[11px] text-white/40">
            Sign in to sync across devices.
          </div>
          <div className="flex items-center gap-2">
            <input
              className="field flex-1"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={signIn}
              disabled={busy}
              className="btn-primary !py-2 text-xs"
            >
              {busy ? "…" : "Send link"}
            </button>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
        </div>
      )}
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs uppercase tracking-wider text-white/50">
        {title}
      </div>
      <div className="tile p-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-white/80">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function PeopleEditor({ people }: { people: Person[] }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🙂");
  const [color, setColor] = useState("#7c5cff");

  async function add() {
    if (!name.trim()) return;
    await db.people.add({ id: newId(), name: name.trim(), emoji, color });
    setName("");
  }

  return (
    <div className="space-y-2">
      {people.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
            style={{ background: p.color }}
          >
            {p.emoji ?? p.name[0]}
          </span>
          <input
            className="field flex-1"
            value={p.name}
            onChange={(e) => db.people.update(p.id, { name: e.target.value })}
          />
          <input
            className="field !w-14 text-center"
            value={p.emoji ?? ""}
            onChange={(e) => db.people.update(p.id, { emoji: e.target.value })}
          />
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-black/30"
            value={p.color}
            onChange={(e) => db.people.update(p.id, { color: e.target.value })}
          />
          <button
            className="iconbtn"
            onClick={() => db.people.delete(p.id)}
            aria-label="delete"
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          className="field flex-1"
          placeholder="Add person…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="field !w-14 text-center"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <input
          type="color"
          className="h-9 w-10 cursor-pointer rounded border border-white/10 bg-black/30"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={add} className="btn-primary !py-2 text-xs">
          Add
        </button>
      </div>
    </div>
  );
}

function CategoriesEditor({ cats }: { cats: Category[] }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2dd4bf");

  async function add() {
    if (!name.trim()) return;
    await db.categories.add({ id: newId(), name: name.trim(), color });
    setName("");
  }

  return (
    <div className="space-y-2">
      {cats.map((c) => (
        <div key={c.id} className="flex items-center gap-2">
          <span
            className="h-6 w-6 rounded-full"
            style={{ background: c.color }}
          />
          <input
            className="field flex-1"
            value={c.name}
            onChange={(e) =>
              db.categories.update(c.id, { name: e.target.value })
            }
          />
          <input
            type="color"
            className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-black/30"
            value={c.color}
            onChange={(e) =>
              db.categories.update(c.id, { color: e.target.value })
            }
          />
          <button
            className="iconbtn"
            onClick={() => db.categories.delete(c.id)}
            aria-label="delete"
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          className="field flex-1"
          placeholder="Add category…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="color"
          className="h-9 w-10 cursor-pointer rounded border border-white/10 bg-black/30"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={add} className="btn-primary !py-2 text-xs">
          Add
        </button>
      </div>
    </div>
  );
}
