import clsx from "clsx";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Icon } from "./components/Icons";
import { Logo } from "./components/Logo";
import { TotalBanner } from "./components/TotalBanner";
import { CurrencyToggle } from "./components/CurrencyToggle";
import { CalendarGrid } from "./components/CalendarGrid";
import { DaySheet } from "./components/DaySheet";
import { SubscriptionSheet } from "./components/SubscriptionSheet";
import { EditSubscriptionSheet } from "./components/EditSubscriptionSheet";
import { MetricsSheet } from "./components/MetricsSheet";
import { SettingsSheet } from "./components/SettingsSheet";
import { db, ensureSeed } from "./lib/db";
import { useSettings, useSubscriptions } from "./lib/hooks";
import type { Currency, Subscription } from "./lib/types";
import { paymentsInMonth, priceOn } from "./lib/billing";
import { convert, fetchFxRates } from "./lib/money";
import { scanAndNotify } from "./lib/notify";
import { useI18n } from "./lib/i18n";
import { PwaUpdateChip } from "./components/PwaUpdateChip";
import { usePwaUpdate } from "./lib/usePwaUpdate";
import { MonthYearPickerSheet } from "./components/MonthYearPickerSheet";
import { useDesktopFramed } from "./components/DesktopPhoneFrame";
import { syncDocumentAccentFromSettings } from "./lib/theme";

export default function App() {
  const { t, formatMonth, formatShortDay } = useI18n();
  const { needRefresh, applyUpdate, dismiss, checkForUpdate, isChecking: pwaCheckBusy } =
    usePwaUpdate();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [picked, setPicked] = useState<Subscription | null>(null);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSeedDate, setEditSeedDate] = useState<string | null>(null);
  const [day, setDay] = useState<Date | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const settings = useSettings();
  const subs = useSubscriptions();
  const [listDisplayCurrency, setListDisplayCurrency] =
    useState<Currency | null>(null);
  const [metricsDisplayCurrency, setMetricsDisplayCurrency] =
    useState<Currency | null>(null);

  useEffect(() => {
    ensureSeed();
  }, []);

  useLayoutEffect(() => {
    let cancelled = false;
    void (async () => {
      const s = await db.settings.get("singleton");
      if (cancelled) return;
      syncDocumentAccentFromSettings(s ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [settings]);

  // Auto-fetch FX on first load (and refresh if older than 6h). Not tied to primary currency
  // (see settings reference table); fetches the canonical USD-based triangle.
  useEffect(() => {
    if (!settings) return;
    const stale =
      !settings.fx ||
      Date.now() - new Date(settings.fx.fetchedAt).getTime() >
        6 * 60 * 60 * 1000;
    if (!stale) return;
    fetchFxRates()
      .then((fx) => db.settings.update("singleton", { fx }))
      .catch((e) => console.warn("[fx] fetch failed", e));
  }, [settings, settings?.fx?.fetchedAt]);

  useEffect(() => {
    const run = () => scanAndNotify().catch(() => {});
    run();
    const onVis = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [settings?.notificationsEnabled]);

  const primary = (settings?.primaryCurrency ?? "ARS") as Currency;
  /** Home total + list under calendar; metrics use `metricsCurrency` */
  const listCurrency = listDisplayCurrency ?? primary;
  const metricsCurrency = metricsDisplayCurrency ?? primary;
  const fx = settings?.fx;
  const token = settings?.logoDevKey;
  const isViewingCurrentMonth = isSameMonth(month, new Date());

  const total = useMemo(() => {
    if (!subs) return 0;
    let sum = 0;
    for (const s of subs) {
      if (!s.active) continue;
      for (const d of paymentsInMonth(s, month)) {
        const p = priceOn(s, d);
        sum += convert(p, s.currency, listCurrency, fx);
      }
    }
    return sum;
  }, [subs, month, listCurrency, fx]);

  function openNewFor(date?: Date | null) {
    setEditing(null);
    setEditSeedDate(date ? format(date, "yyyy-MM-dd") : null);
    setEditOpen(true);
  }

  const desktopFramed = useDesktopFramed();

  const homeScroll = (
    <div className="flex w-full min-w-0 flex-col pt-5">
      {/*
        Do not use flex-1 on this block: it would cap height to the viewport and the calendar
        + list would share that space, collapsing the grid. Let height follow content so the
        scroll area (window or inner overflow) can grow (calendar on top, then expenses).
      */}
      <TotalBanner
        monthLabel={formatMonth(month)}
        isViewingCurrentMonth={isViewingCurrentMonth}
        onGoToCurrentMonth={() => setMonth(startOfMonth(new Date()))}
        backToCurrentMonthLabel={t("header.backToCurrentMonth")}
        total={total}
        currency={listCurrency}
        onPrevMonth={() => setMonth(subMonths(month, 1))}
        onNextMonth={() => setMonth(addMonths(month, 1))}
        prevLabel={t("header.prevMonth")}
        nextLabel={t("header.nextMonth")}
      />

      <div className="flex w-full min-w-0 flex-col">
        <div className="shrink-0">
          <CalendarGrid
            month={month}
            subs={subs ?? []}
            token={token}
            onPickDay={(d) => setDay(d)}
            onPrevMonth={() => setMonth(subMonths(month, 1))}
            onNextMonth={() => setMonth(addMonths(month, 1))}
          />
        </div>

        <UpcomingList
          subs={subs ?? []}
          token={token}
          month={month}
          displayCurrency={listCurrency}
          onChangeDisplayCurrency={setListDisplayCurrency}
          fx={fx}
          formatShortDay={formatShortDay}
          onPickSub={(s) => setPicked(s)}
        />
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        "mx-auto flex w-full flex-col bg-[#0a0806]",
        desktopFramed
          ? "h-full min-h-0 max-w-none"
          : "min-h-[100dvh] max-w-md pb-28",
      )}
    >
      {needRefresh && (
        <PwaUpdateChip
          onUpdate={() => void applyUpdate()}
          onDismiss={dismiss}
        />
      )}

      {desktopFramed ? (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
          <Header
            onOpenMonthPicker={() => setMonthPickerOpen(true)}
            onMetrics={() => setMetricsOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            t={t}
          />
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
            {homeScroll}
          </div>
          <AddFab
            label={t("addFab.label")}
            docked
            onClick={() => openNewFor(null)}
          />
        </div>
      ) : (
        <>
          <Header
            onOpenMonthPicker={() => setMonthPickerOpen(true)}
            onMetrics={() => setMetricsOpen(true)}
            onSettings={() => setSettingsOpen(true)}
            t={t}
          />
          {homeScroll}
          <AddFab label={t("addFab.label")} onClick={() => openNewFor(null)} />
        </>
      )}

      <DaySheet
        date={day}
        subs={subs ?? []}
        token={token}
        addDisabled={false}
        onClose={() => setDay(null)}
        onPickSub={(s) => {
          setDay(null);
          setPicked(s);
        }}
        onAddNew={(d) => {
          setDay(null);
          openNewFor(d);
        }}
      />

      <SubscriptionSheet
        sub={picked}
        token={token}
        onClose={() => setPicked(null)}
        onEdit={(s) => {
          setPicked(null);
          setEditing(s);
          setEditSeedDate(null);
          setEditOpen(true);
        }}
      />

      <EditSubscriptionSheet
        open={editOpen}
        initial={editing}
        seedStartDate={editSeedDate}
        readOnly={false}
        onClose={() => setEditOpen(false)}
      />

      <MetricsSheet
        open={metricsOpen}
        month={month}
        displayCurrency={metricsCurrency}
        onChangeCurrency={setMetricsDisplayCurrency}
        onClose={() => setMetricsOpen(false)}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCheckPwaUpdate={checkForUpdate}
        pwaUpdateChecking={pwaCheckBusy}
      />

      <MonthYearPickerSheet
        open={monthPickerOpen}
        onClose={() => setMonthPickerOpen(false)}
        value={month}
        onChange={(d) => setMonth(startOfMonth(d))}
      />
    </div>
  );
}

function Header({
  onOpenMonthPicker,
  onMetrics,
  onSettings,
  t,
}: {
  onOpenMonthPicker: () => void;
  onMetrics: () => void;
  onSettings: () => void;
  t: (k: string) => string;
}) {
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b border-transparent bg-black/20 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onOpenMonthPicker}
        className="iconbtn-header shrink-0"
        aria-label={t("header.pickMonth")}
      >
        <Icon.Calendar className="!h-6 !w-6" />
      </button>
      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          className="iconbtn-header"
          onClick={onMetrics}
          aria-label={t("header.metrics")}
        >
          <Icon.Chart className="!h-6 !w-6" />
        </button>
        <button
          type="button"
          className="iconbtn-header"
          onClick={onSettings}
          aria-label={t("header.settings")}
        >
          <Icon.Gear className="!h-6 !w-6" />
        </button>
      </div>
    </header>
  );
}

function AddFab({
  label,
  onClick,
  disabled,
  /** Outside the scroll view in the desktop phone frame so the button does not move with content */
  docked,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  docked?: boolean;
}) {
  const inner = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-primary !px-5 !py-3 disabled:pointer-events-none disabled:opacity-35"
      aria-disabled={disabled}
    >
      <Icon.Plus /> {label}
    </button>
  );

  if (docked) {
    return (
      <div className="shrink-0 border-t border-white/[0.04] bg-[#0a0806] px-4 pt-2 pb-[max(env(safe-area-inset-bottom),16px)]">
        <div className="flex justify-center">{inner}</div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-center px-4">
      <div className="pointer-events-auto">{inner}</div>
    </div>
  );
}

function UpcomingList({
  subs,
  month,
  token,
  displayCurrency,
  onChangeDisplayCurrency,
  fx,
  formatShortDay,
  onPickSub,
}: {
  subs: Subscription[];
  month: Date;
  token?: string;
  displayCurrency: Currency;
  onChangeDisplayCurrency: (c: Currency) => void;
  fx?: import("./lib/types").FxRates;
  formatShortDay: (d: Date) => string;
  onPickSub: (s: Subscription) => void;
}) {
  const { t } = useI18n();
  const items = useMemo(() => {
    const out: { sub: Subscription; date: Date }[] = [];
    for (const s of subs) {
      if (!s.active) continue;
      for (const d of paymentsInMonth(s, month)) {
        out.push({ sub: s, date: d });
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [subs, month]);

  if (items.length === 0) {
    return (
      <div className="mt-6 px-4">
        <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/30">
          {t("upcoming.title")}
        </div>
        <div className="mb-3 flex min-h-8 items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5 dark:border-white/[0.06]">
          <span className="shrink-0 text-[11px] text-zinc-500 dark:text-white/40">
            {t("upcoming.showIn")}
          </span>
          <CurrencyToggle
            value={displayCurrency}
            onChange={onChangeDisplayCurrency}
          />
        </div>
        <div className="px-2 text-center text-sm text-zinc-500 dark:text-white/35">
          {t("upcoming.empty")}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 px-4">
      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-zinc-500 dark:text-white/30">
        {t("upcoming.title")}
      </div>
      <div className="mb-3 flex min-h-8 items-center justify-between gap-2 border-b border-zinc-200/80 pb-2.5 dark:border-white/[0.06]">
        <span className="shrink-0 pr-1 text-[11px] text-zinc-500 dark:text-white/40">
          {t("upcoming.showIn")}
        </span>
        <CurrencyToggle
          value={displayCurrency}
          onChange={onChangeDisplayCurrency}
        />
      </div>
      <div className="divide-y divide-zinc-200/80 rounded-xl border border-zinc-200 bg-white/90 dark:divide-white/[0.04] dark:border-white/[0.05] dark:bg-white/[0.02]">
        {items.map(({ sub, date }, i) => (
          <button
            key={i}
            onClick={() => onPickSub(sub)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-zinc-100 dark:active:bg-white/5"
          >
            <Logo sub={sub} token={token} size={32} rounded={10} />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-zinc-800 dark:text-white">{sub.name}</div>
              {sub.notes?.trim() && (
                <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500 dark:text-white/45">
                  {sub.notes.trim()}
                </div>
              )}
              <div className="text-[11px] text-zinc-500 dark:text-white/40">
                {formatShortDay(date)}
                {sub.currency !== displayCurrency && (
                  <> · {formatShort(priceOn(sub, date), sub.currency)}</>
                )}
              </div>
            </div>
            <div className="text-[15px] text-zinc-800 tabular-nums dark:text-white/85">
              {formatShort(
                convert(priceOn(sub, date), sub.currency, displayCurrency, fx),
                displayCurrency,
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatShort(n: number, c: Currency) {
  const sym = c === "EUR" ? "€" : "$";
  return `${sym}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
