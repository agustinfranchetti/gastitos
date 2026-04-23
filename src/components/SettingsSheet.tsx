import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icons";
import { db } from "../lib/db";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { fetchFxRates } from "../lib/money";
import { ACCENT_PICKER_STYLE, ACCENT_PRESET_ORDER } from "../lib/theme";
import type { Category, Currency, Person, Settings } from "../lib/types";
import { CURRENCIES } from "../lib/types";
import { useCategories, usePeople, useSettings } from "../lib/hooks";
import { newId } from "../lib/id";
import { useI18n } from "../lib/i18n";
import { requestNotificationPermission } from "../lib/notify";
import { Select, Toggle } from "./EditSubscriptionSheet";

type SettingsView =
  | "menu"
  | "account"
  | "appearance"
  | "language"
  | "currency"
  | "logo"
  | "notifications"
  | "people"
  | "categories";

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
  const [view, setView] = useState<SettingsView>("menu");
  const { t } = useI18n();

  useEffect(() => {
    if (open) setView("menu");
  }, [open]);

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

  const titleForView = (v: SettingsView) => {
    switch (v) {
      case "account":
        return t("settings.account");
      case "appearance":
        return t("settings.lookAndFeel");
      case "language":
        return t("settings.language");
      case "currency":
        return t("settings.currency");
      case "logo":
        return t("settings.logoDev");
      case "notifications":
        return t("settings.notifications");
      case "people":
        return t("settings.people");
      case "categories":
        return t("settings.categories");
      default:
        return t("settings.title");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} maxHeight="92vh">
      <div className="w-full min-w-0 max-w-full overflow-x-hidden px-0.5">
        {view === "menu" ? (
          <>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="title-app min-w-0 text-2xl">{t("settings.title")}</div>
              <button onClick={onClose} className="iconbtn shrink-0" aria-label="close">
                <Icon.X />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5" aria-label={t("settings.title")}>
              {supabaseEnabled && (
                <SettingsMenuButton
                  label={t("settings.account")}
                  onClick={() => setView("account")}
                />
              )}
              <SettingsMenuButton
                label={t("settings.lookAndFeel")}
                onClick={() => setView("appearance")}
              />
              <SettingsMenuButton
                label={t("settings.language")}
                onClick={() => setView("language")}
              />
              <SettingsMenuButton
                label={t("settings.currency")}
                onClick={() => setView("currency")}
              />
              <SettingsMenuButton
                label={t("settings.logoDev")}
                onClick={() => setView("logo")}
              />
              <SettingsMenuButton
                label={t("settings.notifications")}
                onClick={() => setView("notifications")}
              />
              <SettingsMenuButton
                label={t("settings.people")}
                onClick={() => setView("people")}
              />
              <SettingsMenuButton
                label={t("settings.categories")}
                onClick={() => setView("categories")}
              />
            </nav>
          </>
        ) : (
          <>
            <div className="mb-4 flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setView("menu")}
                className="iconbtn !h-9 !w-9 shrink-0"
                aria-label={t("settings.back")}
              >
                <Icon.ChevronLeft />
              </button>
              <div className="title-app min-w-0 flex-1 truncate text-xl leading-tight">
                {titleForView(view)}
              </div>
              <button
                onClick={onClose}
                className="iconbtn shrink-0"
                aria-label="close"
              >
                <Icon.X />
              </button>
            </div>

            {view === "account" && supabaseEnabled && <AccountContent />}

            {view === "appearance" && (
              <div className="space-y-3">
                <div className="tile space-y-4 p-4">
                  <Row label={t("settings.appearance")}>
                    <div className="flex max-w-full flex-wrap justify-end gap-2">
                      {(
                        [
                          { id: "dark" as const, label: t("settings.appearanceDark") },
                          { id: "light" as const, label: t("settings.appearanceLight") },
                          {
                            id: "system" as const,
                            label: t("settings.appearanceSystem"),
                          },
                        ] as const
                      ).map(({ id, label }) => {
                        const active = (settings.appearance ?? "dark") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => patch({ appearance: id })}
                            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                              active
                                ? "accent-segment-active"
                                : "border-zinc-200 bg-white/80 text-zinc-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/70"
                            }`}
                            aria-pressed={active}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </Row>
                  <Row label={t("settings.accent")}>
                    <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                      {ACCENT_PRESET_ORDER.map((id) => {
                        const active = (settings.accentPreset ?? "orange") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => patch({ accentPreset: id })}
                            className={`relative h-9 w-9 shrink-0 rounded-full border-2 border-transparent transition-transform active:scale-95 ${
                              active
                                ? "ring-2 ring-zinc-800 ring-offset-2 ring-offset-stone-100 dark:ring-white dark:ring-offset-[#0a0806]"
                                : ""
                            }`}
                            style={{ background: ACCENT_PICKER_STYLE[id] }}
                            title={id}
                            aria-label={id}
                            aria-pressed={active}
                          />
                        );
                      })}
                    </div>
                  </Row>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0 text-sm text-zinc-700 dark:text-white/80">
                      {t("settings.compactAmounts")}
                    </div>
                    <Toggle
                      checked={settings.useCompactAmounts !== false}
                      onChange={(v) => patch({ useCompactAmounts: v })}
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-white/50">
                  {t("settings.compactAmountsHelp")}
                </p>
              </div>
            )}

            {view === "language" && (
              <div className="tile p-4">
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
                            ? "accent-segment-active"
                            : "border-zinc-200 bg-white/80 text-zinc-600 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/70"
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
              </div>
            )}

            {view === "currency" && (
              <div className="space-y-3">
                <div className="tile space-y-3 p-4">
                  <Row label={t("settings.primary")}>
                    <Select
                      value={settings.primaryCurrency}
                      onChange={(v) => patch({ primaryCurrency: v as Currency })}
                      options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                    />
                  </Row>
                  <Row label={t("settings.fx")}>
                    <div className="flex min-w-0 max-w-full flex-1 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <span className="min-w-0 break-words text-right text-xs text-zinc-500 dark:text-white/50">
                        {settings.fx?.fetchedAt
                          ? new Date(settings.fx.fetchedAt).toLocaleString()
                          : t("common.never")}
                      </span>
                      <button
                        onClick={refreshFx}
                        disabled={fxLoading}
                        className="btn-ghost shrink-0 !py-1.5 text-xs"
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
              </div>
            )}

            {view === "logo" && (
              <div>
                <div className="tile p-4">
                  <Row label={t("settings.apiKey")}>
                    <input
                      className="field min-w-0 max-w-full"
                      type="password"
                      placeholder={t("settings.keyPlaceholder")}
                      value={settings.logoDevKey ?? ""}
                      onChange={(e) => patch({ logoDevKey: e.target.value })}
                    />
                  </Row>
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-white/50">
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
              </div>
            )}

            {view === "notifications" && (
              <div className="tile p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-sm text-zinc-700 dark:text-white/80">
                    {t("settings.enableReminders")}
                  </div>
                  <Toggle
                    checked={settings.notificationsEnabled}
                    onChange={toggleNotifications}
                  />
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-white/50">
                  {t("settings.remindHelp")}
                </p>
              </div>
            )}

            {view === "people" && (
              <div className="tile min-w-0 max-w-full overflow-x-hidden p-4">
                <PeopleEditor people={people ?? []} />
              </div>
            )}

            {view === "categories" && (
              <div className="tile min-w-0 max-w-full overflow-x-hidden p-4">
                <CategoriesEditor cats={cats ?? []} />
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </Sheet>
  );
}

function SettingsMenuButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full min-w-0 max-w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-zinc-200/90 bg-white/90 px-4 py-3.5 text-left text-sm text-zinc-800 shadow-sm active:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/90 dark:shadow-none dark:active:bg-white/8"
    >
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <Icon.ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-white/35" />
    </button>
  );
}

function AccountContent() {
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
    <div className="min-w-0 max-w-full overflow-x-hidden">
      {user ? (
        <div className="tile flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-2 text-sm">
            <Icon.Cloud className="shrink-0 text-[color:rgb(var(--accent-500-rgb))] dark:text-[color:rgb(var(--accent-300-rgb))]" />
            <div className="min-w-0">
              <div className="truncate text-zinc-800 dark:text-white/90">
                {user.email}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-white/40">
                {t("settings.synced")}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="btn-ghost w-full shrink-0 !py-1.5 text-xs sm:w-auto"
          >
            <Icon.LogOut /> {t("settings.signOut")}
          </button>
        </div>
      ) : phase === "otp" ? (
        <div className="tile space-y-3 p-4">
          <p className="text-sm text-zinc-600 dark:text-white/70">
            {t("settings.otpHint", { email })}
          </p>
          <div>
            <div className="mb-1 text-[11px] text-zinc-500 dark:text-white/40">
              {t("settings.enterCode")}
            </div>
            <input
              className="field w-full min-w-0 max-w-full tracking-[0.35em] placeholder:tracking-normal"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder={t("settings.otpPlaceholder")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => void verify()}
              disabled={busy || !otpReady}
              className="btn-primary w-full !py-2 text-xs sm:w-auto"
            >
              {busy ? t("settings.busy") : t("settings.verify")}
            </button>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={busy}
              className="btn-ghost w-full !py-2 text-xs sm:w-auto"
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
              className="w-full text-center text-xs text-zinc-500 underline dark:text-white/50 sm:ml-auto sm:w-auto"
            >
              {t("settings.changeEmail")}
            </button>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
        </div>
      ) : (
        <div className="tile space-y-2 p-4">
          <div className="text-[11px] text-zinc-500 dark:text-white/40">
            {t("settings.signInHint")}
          </div>
          <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              className="field min-w-0 w-full max-w-full flex-1 sm:min-w-0"
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
              className="btn-primary w-full shrink-0 !py-2 text-xs sm:w-auto"
            >
              {busy ? t("settings.busy") : t("settings.sendCode")}
            </button>
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
        </div>
      )}
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
    <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 shrink-0 text-sm text-zinc-700 dark:text-white/80">
        {label}
      </div>
      <div className="min-w-0 max-w-full flex-1 sm:flex sm:justify-end">
        {children}
      </div>
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
    <div className="w-full min-w-0 space-y-2 overflow-x-hidden">
      {people.map((p) => (
        <div
          key={p.id}
          className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
            style={{ background: p.color }}
          >
            {p.emoji ?? p.name[0]}
          </span>
          <input
            className="field min-w-0 w-[min(12rem,100%)] flex-1"
            value={p.name}
            onChange={(e) => db.people.update(p.id, { name: e.target.value })}
          />
          <input
            className="field w-12 shrink-0 text-center"
            value={p.emoji ?? ""}
            onChange={(e) => db.people.update(p.id, { emoji: e.target.value })}
          />
          <input
            type="color"
            className="h-8 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 bg-stone-50 dark:border-white/10 dark:bg-black/30"
            value={p.color}
            onChange={(e) => db.people.update(p.id, { color: e.target.value })}
          />
          <button
            className="iconbtn shrink-0"
            onClick={() => db.people.delete(p.id)}
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 pt-1">
        <input
          className="field min-w-0 w-[min(12rem,100%)] flex-1"
          placeholder={t("settings.addPerson")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="field w-12 shrink-0 text-center"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <input
          type="color"
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 bg-stone-50 dark:border-white/10 dark:bg-black/30"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={add} className="btn-primary shrink-0 !py-2 text-xs">
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
    <div className="w-full min-w-0 space-y-2 overflow-x-hidden">
      {cats.map((c) => (
        <div
          key={c.id}
          className="flex min-w-0 max-w-full flex-wrap items-center gap-2"
        >
          <span
            className="h-6 w-6 shrink-0 rounded-full"
            style={{ background: c.color }}
          />
          <input
            className="field min-w-0 w-[min(12rem,100%)] flex-1"
            value={c.name}
            onChange={(e) =>
              db.categories.update(c.id, { name: e.target.value })
            }
          />
          <input
            type="color"
            className="h-8 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 bg-stone-50 dark:border-white/10 dark:bg-black/30"
            value={c.color}
            onChange={(e) =>
              db.categories.update(c.id, { color: e.target.value })
            }
          />
          <button
            className="iconbtn shrink-0"
            onClick={() => db.categories.delete(c.id)}
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 pt-1">
        <input
          className="field min-w-0 w-[min(12rem,100%)] flex-1"
          placeholder={t("settings.addCategory")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="color"
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-zinc-200 bg-stone-50 dark:border-white/10 dark:bg-black/30"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={add} className="btn-primary shrink-0 !py-2 text-xs">
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}
