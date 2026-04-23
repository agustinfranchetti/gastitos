import { useState, type ReactNode } from "react";
import { Sheet } from "./Sheet";
import { Icon } from "./Icons";
import { db } from "../lib/db";
import { supabase, supabaseEnabled } from "../lib/supabase";
import { useAuth } from "../lib/useAuth";
import { fetchFxRates } from "../lib/money";
import {
  ACCENT_PICKER_STYLE,
  ACCENT_PRESET_ORDER,
  syncDocumentAccentFromSettings,
} from "../lib/theme";
import type { Category, Currency, Person, Settings } from "../lib/types";
import { CURRENCIES } from "../lib/types";
import { useCategories, usePeople, useSettings } from "../lib/hooks";
import { newId } from "../lib/id";
import { useI18n } from "../lib/i18n";
import { requestNotificationPermission } from "../lib/notify";
import { Select, Toggle } from "./EditSubscriptionSheet";
import { DiscPickerModal } from "./DiscPickerModal";

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
    const s = await db.settings.get("singleton");
    syncDocumentAccentFromSettings(s);
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
    <Sheet open={open} onClose={onClose} maxHeight="85vh">
      <div className="w-full min-w-0 max-w-full overflow-x-hidden px-0.5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="title-app min-w-0 text-2xl">{t("settings.title")}</div>
          <button type="button" onClick={onClose} className="iconbtn shrink-0" aria-label="close">
            <Icon.X />
          </button>
        </div>
        <div className="flex flex-col gap-5" aria-label={t("settings.title")}>
          {supabaseEnabled && (
            <section>
              <SettingsCategoryLabel>{t("settings.categoryAccount")}</SettingsCategoryLabel>
              <div className="mt-1.5">
                <AccountContent />
              </div>
            </section>
          )}

          <section>
            <SettingsCategoryLabel>{t("settings.categoryGeneral")}</SettingsCategoryLabel>
            <div className="tile mt-1.5 space-y-3 p-4">
                  <Row label={t("settings.accent")}>
                    <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                      {ACCENT_PRESET_ORDER.map((id) => {
                        const active = (settings.accentPreset ?? "orange") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => void patch({ accentPreset: id })}
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
                      onChange={(v) => void patch({ useCompactAmounts: v })}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-white/50">
                    {t("settings.compactAmountsHelp")}
                  </p>
                  <hr className="border-zinc-200/80 dark:border-white/10" />
                  <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0 shrink-0 text-sm text-zinc-700 dark:text-white/80">
                      {t("settings.language")}
                    </div>
                    <div className="flex min-w-0 max-w-full flex-1 flex-wrap justify-end gap-2">
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
                            onClick={() => void patch({ language: code })}
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
                  <hr className="border-zinc-200/80 dark:border-white/10" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-sm text-zinc-700 dark:text-white/80">
                      {t("settings.enableReminders")}
                    </div>
                    <Toggle
                      checked={settings.notificationsEnabled}
                      onChange={(v) => void toggleNotifications(v)}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-white/50">
                    {t("settings.remindHelp")}
                  </p>
                </div>
              </section>

          <section>
            <SettingsCategoryLabel>{t("settings.categoryMoney")}</SettingsCategoryLabel>
            <div className="tile mt-1.5 space-y-3 p-4">
              <Row label={t("settings.primary")}>
                <Select
                  value={settings.primaryCurrency}
                  onChange={(v) => void patch({ primaryCurrency: v as Currency })}
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
                    type="button"
                    onClick={() => void refreshFx()}
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
          </section>

          <section>
            <SettingsCategoryLabel>{t("settings.people")}</SettingsCategoryLabel>
            <div className="tile mt-1.5 min-w-0 max-w-full overflow-x-hidden p-4">
              <PeopleEditor people={people ?? []} />
            </div>
          </section>

          <section>
            <SettingsCategoryLabel>{t("settings.categories")}</SettingsCategoryLabel>
            <div className="tile mt-1.5 min-w-0 max-w-full overflow-x-hidden p-4">
              <CategoriesEditor cats={cats ?? []} />
            </div>
          </section>

          <section>
            <SettingsCategoryLabel>{t("settings.categoryAdvanced")}</SettingsCategoryLabel>
            <div className="mt-1.5">
              <div className="tile p-4">
                <Row label={t("settings.apiKey")}>
                  <input
                    className="field min-w-0 max-w-full"
                    type="password"
                    placeholder={t("settings.keyPlaceholder")}
                    value={settings.logoDevKey ?? ""}
                    onChange={(e) => void patch({ logoDevKey: e.target.value })}
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
          </section>
        </div>

        <div className="h-2" />
      </div>
    </Sheet>
  );
}

function SettingsCategoryLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-white/40">
      {children}
    </p>
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

function discChar(emoji: string | undefined, name: string) {
  const e = emoji?.trim();
  if (e) return e;
  return name[0] || "·";
}

function DiscFieldTrigger({
  color,
  children,
  onClick,
  "aria-label": ariaLabel,
}: {
  color: string;
  children: ReactNode;
  onClick: () => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 text-center text-sm font-normal leading-none text-white shadow-inner"
      style={{ background: color }}
      onClick={onClick}
      title={color}
      aria-label={ariaLabel}
    >
      <span className="pointer-events-none select-none text-base leading-none drop-shadow-sm">
        {children}
      </span>
    </button>
  );
}

function PeopleEditor({ people }: { people: Person[] }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🙂");
  const [color, setColor] = useState("#7c5cff");
  const [picker, setPicker] = useState<null | "new" | string>(null);

  async function add() {
    if (!name.trim()) return;
    await db.people.add({
      id: newId(),
      name: name.trim(),
      emoji: emoji.trim() || undefined,
      color,
    });
    setName("");
  }

  const pickerOpen = picker != null;
  const pickPerson = picker && picker !== "new" ? people.find((p) => p.id === picker) : undefined;
  const initialColor =
    picker === "new" ? color : (pickPerson?.color ?? "#7c5cff");
  const initialEmoji =
    picker === "new" ? emoji : (pickPerson?.emoji?.trim() ?? "");

  return (
    <div className="w-full min-w-0 space-y-2.5 overflow-x-hidden">
      <DiscPickerModal
        open={pickerOpen}
        onClose={() => setPicker(null)}
        initialColor={initialColor}
        initialEmoji={initialEmoji}
        title={t("settings.discPickerTitle")}
        colorLabel={t("settings.discColor")}
        iconLabel={t("settings.discIcon")}
        customHint={t("settings.customEmojiPh")}
        cancelLabel={t("common.cancel")}
        applyLabel={t("header.pickMonthDone")}
        onSave={({ color: hex, emoji: em }) => {
          const nextEmoji = em.trim() || undefined;
          if (picker === "new") {
            setColor(hex);
            setEmoji(nextEmoji ?? "");
            return;
          }
          if (picker) void db.people.update(picker, { color: hex, emoji: nextEmoji });
        }}
      />
      {people.map((p) => (
        <div
          key={p.id}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2"
        >
          <DiscFieldTrigger
            color={p.color}
            onClick={() => setPicker(p.id)}
            aria-label={t("settings.discPickerTitle")}
          >
            {discChar(p.emoji, p.name)}
          </DiscFieldTrigger>
          <input
            className="field min-w-0 w-full"
            value={p.name}
            onChange={(e) => db.people.update(p.id, { name: e.target.value })}
          />
          <button
            type="button"
            className="iconbtn shrink-0 justify-self-end"
            onClick={() => {
              if (confirm(t("settings.deletePersonConfirm", { name: p.name }))) {
                void db.people.delete(p.id);
              }
            }}
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 border-t border-white/10 pt-2.5">
        <DiscFieldTrigger
          color={color}
          onClick={() => setPicker("new")}
          aria-label={t("settings.discPickerTitle")}
        >
          {discChar(emoji, name)}
        </DiscFieldTrigger>
        <input
          className="field min-w-0 w-full"
          placeholder={t("settings.addPerson")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button
          type="button"
          className="iconbtn shrink-0 justify-self-end"
          onClick={() => void add()}
          disabled={!name.trim()}
          aria-label={t("common.add")}
        >
          <Icon.Check className="!h-5 !w-5" />
        </button>
      </div>
    </div>
  );
}

function CategoriesEditor({ cats }: { cats: Category[] }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2dd4bf");
  const [emoji, setEmoji] = useState("🏷️");
  const [picker, setPicker] = useState<null | "new" | string>(null);

  async function add() {
    if (!name.trim()) return;
    await db.categories.add({
      id: newId(),
      name: name.trim(),
      color,
      emoji: emoji.trim() || undefined,
    });
    setName("");
  }

  const pickerOpen = picker != null;
  const pickCat = picker && picker !== "new" ? cats.find((c) => c.id === picker) : undefined;
  const initialColor =
    picker === "new" ? color : (pickCat?.color ?? "#2dd4bf");
  const initialEmoji =
    picker === "new" ? emoji : (pickCat?.emoji?.trim() ?? "");

  return (
    <div className="w-full min-w-0 space-y-2.5 overflow-x-hidden">
      <DiscPickerModal
        open={pickerOpen}
        onClose={() => setPicker(null)}
        initialColor={initialColor}
        initialEmoji={initialEmoji}
        title={t("settings.discPickerTitle")}
        colorLabel={t("settings.discColor")}
        iconLabel={t("settings.discIcon")}
        customHint={t("settings.customEmojiPh")}
        cancelLabel={t("common.cancel")}
        applyLabel={t("header.pickMonthDone")}
        onSave={({ color: hex, emoji: em }) => {
          const nextEmoji = em.trim() || undefined;
          if (picker === "new") {
            setColor(hex);
            setEmoji(nextEmoji ?? "");
            return;
          }
          if (picker) {
            void db.categories.update(picker, { color: hex, emoji: nextEmoji });
          }
        }}
      />
      {cats.map((c) => (
        <div
          key={c.id}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2"
        >
          <DiscFieldTrigger
            color={c.color}
            onClick={() => setPicker(c.id)}
            aria-label={t("settings.discPickerTitle")}
          >
            {discChar(c.emoji, c.name)}
          </DiscFieldTrigger>
          <input
            className="field min-w-0 w-full"
            value={c.name}
            onChange={(e) =>
              db.categories.update(c.id, { name: e.target.value })
            }
          />
          <button
            type="button"
            className="iconbtn shrink-0 justify-self-end"
            onClick={() => {
              if (confirm(t("settings.deleteCategoryConfirm", { name: c.name }))) {
                void db.categories.delete(c.id);
              }
            }}
            aria-label={t("settings.delete")}
          >
            <Icon.Trash />
          </button>
        </div>
      ))}
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 border-t border-white/10 pt-2.5">
        <DiscFieldTrigger
          color={color}
          onClick={() => setPicker("new")}
          aria-label={t("settings.discPickerTitle")}
        >
          {discChar(emoji, name)}
        </DiscFieldTrigger>
        <input
          className="field min-w-0 w-full"
          placeholder={t("settings.addCategory")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
        />
        <button
          type="button"
          className="iconbtn shrink-0 justify-self-end"
          onClick={() => void add()}
          disabled={!name.trim()}
          aria-label={t("common.add")}
        >
          <Icon.Check className="!h-5 !w-5" />
        </button>
      </div>
    </div>
  );
}
