import { useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { Icon } from "./components/Icons";
import { Logo } from "./components/Logo";
import { TotalBanner } from "./components/TotalBanner";
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
import { useAuth } from "./lib/useAuth";
import { useI18n } from "./lib/i18n";
import { usePwaUpdate } from "./lib/usePwaUpdate";

export default function App() {
  useAuth();
  const { t, formatMonth, formatShortDay, dateLocale } = useI18n();
  const { needRefresh, applyUpdate, dismiss } = usePwaUpdate();

  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [picked, setPicked] = useState<Subscription | null>(null);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSeedDate, setEditSeedDate] = useState<string | null>(null);
  const [day, setDay] = useState<Date | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settings = useSettings();
  const subs = useSubscriptions();
  const [displayCurrency, setDisplayCurrency] = useState<Currency | null>(null);

  useEffect(() => {
    ensureSeed();
  }, []);

  // Auto-fetch FX on first load (and refresh if older than 6h).
  useEffect(() => {
    if (!settings) return;
    const stale =
      !settings.fx ||
      Date.now() - new Date(settings.fx.fetchedAt).getTime() >
        6 * 60 * 60 * 1000 ||
      settings.fx.base !== settings.primaryCurrency;
    if (!stale) return;
    fetchFxRates(settings.primaryCurrency)
      .then((fx) => db.settings.update("singleton", { fx }))
      .catch((e) => console.warn("[fx] fetch failed", e));
  }, [settings?.primaryCurrency, settings?.fx?.fetchedAt]);

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
  const currency = displayCurrency ?? primary;
  const fx = settings?.fx;
  const token = settings?.logoDevKey;

  const { total, highlight } = useMemo(() => {
    if (!subs) return { total: 0, highlight: undefined };
    let total = 0;
    let highest: { name: string; amount: number; currency: Currency } = {
      name: "",
      amount: 0,
      currency,
    };
    for (const s of subs) {
      if (!s.active) continue;
      const dates = paymentsInMonth(s, month);
      let subTotal = 0;
      for (const d of dates) {
        const p = priceOn(s, d);
        const inTarget = convert(p, s.currency, currency, fx);
        total += inTarget;
        subTotal += inTarget;
      }
      if (subTotal > highest.amount) {
        highest = { name: s.name, amount: subTotal, currency };
      }
    }
    return {
      total,
      highlight: highest.amount > 0 ? highest : undefined,
    };
  }, [subs, month, currency, fx]);

  function openNewFor(date?: Date | null) {
    setEditing(null);
    setEditSeedDate(date ? format(date, "yyyy-MM-dd") : null);
    setEditOpen(true);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col pb-28">
      <Header
        monthLabel={format(month, "MMM yyyy", { locale: dateLocale })}
        onPrev={() => setMonth(subMonths(month, 1))}
        onNext={() => setMonth(addMonths(month, 1))}
        onMetrics={() => setMetricsOpen(true)}
        onSettings={() => setSettingsOpen(true)}
        t={t}
      />

      <div className="flex min-h-0 flex-1 flex-col pt-5">
        {needRefresh && (
          <div className="mb-3 flex shrink-0 items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm">
            <span className="text-white/80">{t("app.updateAvailable")}</span>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full px-2.5 py-1.5 text-xs text-white/55 active:bg-white/10"
              >
                {t("app.updateLater")}
              </button>
              <button
                type="button"
                onClick={() => void applyUpdate()}
                className="btn-primary !py-1.5 !text-xs"
              >
                {t("app.update")}
              </button>
            </div>
          </div>
        )}

        <TotalBanner
          monthLabel={formatMonth(month)}
          total={total}
          currency={currency}
          onChangeCurrency={setDisplayCurrency}
          highlight={highlight}
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <CalendarGrid
            month={month}
            subs={subs ?? []}
            token={token}
            onPickDay={(d) => setDay(d)}
            onPrevMonth={() => setMonth(subMonths(month, 1))}
            onNextMonth={() => setMonth(addMonths(month, 1))}
          />

        <UpcomingList
          subs={subs ?? []}
          token={token}
          month={month}
          displayCurrency={currency}
          fx={fx}
          formatShortDay={formatShortDay}
          onPickSub={(s) => setPicked(s)}
        />
        </div>
      </div>

      <AddFab label={t("addFab.label")} onClick={() => openNewFor(null)} />

      <DaySheet
        date={day}
        subs={subs ?? []}
        token={token}
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
        onClose={() => setEditOpen(false)}
      />

      <MetricsSheet
        open={metricsOpen}
        month={month}
        displayCurrency={currency}
        onClose={() => setMetricsOpen(false)}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

function Header({
  monthLabel,
  onPrev,
  onNext,
  onMetrics,
  onSettings,
  t,
}: {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onMetrics: () => void;
  onSettings: () => void;
  t: (k: string) => string;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2 backdrop-blur-md">
      <div className="flex items-center gap-0.5 text-white/70">
        <button
          onClick={onPrev}
          className="iconbtn"
          aria-label={t("header.prevMonth")}
        >
          <Icon.ChevronLeft />
        </button>
        <div className="px-2 font-display italic text-[15px] text-white/80">
          {monthLabel}
        </div>
        <button
          onClick={onNext}
          className="iconbtn"
          aria-label={t("header.nextMonth")}
        >
          <Icon.ChevronRight />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          className="iconbtn"
          onClick={onMetrics}
          aria-label={t("header.metrics")}
        >
          <Icon.Chart />
        </button>
        <button
          className="iconbtn"
          onClick={onSettings}
          aria-label={t("header.settings")}
        >
          <Icon.Gear />
        </button>
      </div>
    </header>
  );
}

function AddFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),16px)] z-30 flex justify-center px-4">
      <button onClick={onClick} className="btn-primary !px-5 !py-3">
        <Icon.Plus /> {label}
      </button>
    </div>
  );
}

function UpcomingList({
  subs,
  month,
  token,
  displayCurrency,
  fx,
  formatShortDay,
  onPickSub,
}: {
  subs: Subscription[];
  month: Date;
  token?: string;
  displayCurrency: Currency;
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
      <div className="mt-10 px-6 text-center text-sm text-white/35">
        {t("upcoming.empty")}
      </div>
    );
  }

  return (
    <div className="mt-6 px-4">
      <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/30">
        {t("upcoming.title")}
      </div>
      <div className="divide-y divide-white/[0.04] rounded-xl border border-white/[0.05] bg-white/[0.02]">
        {items.map(({ sub, date }, i) => (
          <button
            key={i}
            onClick={() => onPickSub(sub)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-white/5"
          >
            <Logo sub={sub} token={token} size={32} rounded={10} />
            <div className="flex-1">
              <div className="text-sm">{sub.name}</div>
              <div className="text-[11px] text-white/40">
                {formatShortDay(date)}
                {sub.currency !== displayCurrency && (
                  <> · {formatShort(priceOn(sub, date), sub.currency)}</>
                )}
              </div>
            </div>
            <div className="text-[15px] text-white/85 tabular-nums">
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
