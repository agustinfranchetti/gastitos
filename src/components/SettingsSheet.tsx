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
import { useI18n } from "../lib/i18n";
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
  const { t } = useI18n();

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
        <div className="font-display text-2xl">{t("settings.title")}</div>
        <button onClick={onClose} className="iconbtn" aria-label="close">
          <Icon.X />
        </button>
      </div>

      <Section title={t("settings.language")}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { code: "en" as const, flag: "🇬🇧", label: t("settings.languageEn") },
              { code: "es" as const, flag: "🇪🇸", label: t("settings.languageEs") },
            ] as const
          ).map(({ code, flag, label }) => {
            const active = (settings.language ?? "en") === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => patch({ language: code })}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
                  active
                    ? "border-ember-400/50 bg-ember-400/15 text-white"
                    : "border-white/10 bg-white/[0.02] text-white/70"
                }`}
                aria-pressed={active}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {flag}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </Section>

      {supabaseEnabled && <AccountSection />}

      <Section title={t("settings.currency")}>
        <div className="space-y-3">
          <Row label={t("settings.primary")}>
            <Select
              value={settings.primaryCurrency}
              onChange={(v) => patch({ primaryCurrency: v as Currency })}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </Row>
          <Row label={t("settings.fx")}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">
                {settings.fx?.fetchedAt
                  ? new Date(settings.fx.fetchedAt).toLocaleString()
                  : t("common.never")}
              </span>
              <button
                onClick={refreshFx}
                disabled={fxLoading}
                className="btn-ghost !py-1.5 text-xs"
              >
                {fxLoading ? t("settings.busy") : t("settings.refresh")}
              </button>
            </div>
          </Row>
          {fxError && (
            <div className="text-xs text-red-400">
              {t("settings.fxError")} {fxError}
            </div>
          )}
        </div>
      </Section>

      <Section title={t("settings.logoDev")}>
        <Row label={t("settings.apiKey")}>
          <input
            className="field"
            type="password"
            placeholder={t("settings.keyPlaceholder")}
            value={settings.logoDevKey ?? ""}
            onChange={(e) => patch({ logoDevKey: e.target.value })}
          />
        </Row>
        <p className="mt-2 text-xs text-white/50">
          {t("settings.logoKeyLine1")}{" "}
          <a
            className="underline"
            href="https://www.logo.dev/docs/platform/api-keys"
            target="_blank"
            rel="noreferrer"
          >
            logo.dev/docs/platform/api-keys
          </a>
          {t("settings.logoKeyLine2")}
        </p>
      </Section>

      <Section title={t("settings.notifications")}>
        <Row label={t("settings.enableReminders")}>
          <Toggle
            checked={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
        </Row>
        <p className="mt-2 text-xs text-white/50">
          {t("settings.remindHelp")}
        </p>
      </Section>

      <Section title={t("settings.people")}>
        <PeopleEditor people={people ?? []} />
      </Section>

      <Section title={t("settings.categories")}>
        <CategoriesEditor cats={cats ?? []} />
      </Section>

      <div className="h-6" />
    </Sheet>
  );
}

function AccountSection() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"email" | "otp">("email");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const otpDigits = otp.replace(/\D/g, "");
  const otpReady = otpDigits.length === 6 || otpDigits.length === 8;

  async function sendCode() {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
      },
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setPhase("otp");
    setOtp("");
  }

  async function verify() {
    if (!supabase || !email.trim()) return;
    const token = otpDigits.slice(0, 8);
    if (!otpReady) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    setBusy(false);
    if (error) setErr(error.message);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setPhase("email");
    setOtp("");
    setEmail("");
    setErr(null);
  }

  return (
    <Section title={t("settings.account")}>
      {user ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Icon.Cloud className="text-ember-300" />
            <div>
              <div className="text-white/90">{user.email}</div>
              <div className="text-[11px] text-white/40">
                {t("settings.synced")}
              </div>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost !py-1.5 text-xs">
            <Icon.LogOut /> {t("settings.signOut")}
          </button>
        </div>
      ) : phase === "otp" ? (
        <div className="space-y-3">
          <p className="text-sm text-white/70">
            {t("settings.otpHint", { email })}
          </p>
          <div>
            <div className="mb-1 text-[11px] text-white/40">
              {t("settings.enterCode")}
            </div>
            <input
              className="field tracking-[0.35em] placeholder:tracking-normal"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder={t("settings.otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy || !otpReady}
              className="btn-primary !py-2 text-xs"
            >
              {busy ? t("settings.busy") : t("settings.verify")}
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy}
              className="btn-ghost !py-2 text-xs"
            >
              {t("settings.resendCode")}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("email");
                setOtp("");
                setErr(null);
              }}
              className="ml-auto text-xs text-white/50 underline"
            >
              {t("settings.changeEmail")}
            </button>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[11px] text-white/40">
            {t("settings.signInHint")}
          </div>
          <div className="flex items-center gap-2">
            <input
              className="field flex-1"
              type="email"
              placeholder={t("settings.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendCode();
              }}
            />
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy}
              className="btn-primary !py-2 text-xs"
            >
              {busy ? t("settings.busy") : t("settings.sendCode")}
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
  const { t } = useI18n();
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
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          className="field flex-1"
          placeholder={t("settings.addPerson")}
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
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}

function CategoriesEditor({ cats }: { cats: Category[] }) {
  const { t } = useI18n();
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
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <input
          className="field flex-1"
          placeholder={t("settings.addCategory")}
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
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}
