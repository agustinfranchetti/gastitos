import { addDays, isAfter, isBefore, parseISO, startOfDay } from "date-fns";
import { db } from "./db";
import { nextPaymentAfter, priceOn } from "./billing";
import { formatMoney } from "./money";
import type { Subscription } from "./types";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/**
 * Scans all subscriptions and fires any notifications that are due since
 * the last scan. Call on app startup and on visibility change.
 *
 * Because a PWA cannot reliably schedule background notifications without a
 * server, this "best-effort" scan fires reminders the next time the app is
 * opened after a threshold is crossed.
 */
export async function scanAndNotify() {
  const settings = await db.settings.get("singleton");
  if (!settings?.notificationsEnabled) return;
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const today = startOfDay(now);
  const last = settings.lastNotificationScan
    ? parseISO(settings.lastNotificationScan)
    : addDays(today, -1);

  const subs = await db.subscriptions.where("active").equals(1 as never).toArray().catch(() => []);
  // Fallback: Dexie doesn't index booleans well — fetch all and filter.
  const all = subs.length ? subs : await db.subscriptions.toArray();
  const activeSubs = all.filter((s) => s.active);

  const reg = await navigator.serviceWorker?.getRegistration();

  for (const sub of activeSubs) {
    const next = nextPaymentAfter(sub, today);
    if (!next) continue;
    for (const rule of sub.notify ?? []) {
      if (!rule.enabled) continue;
      const fireOn = addDays(next, -rule.daysBefore);
      // Fire if threshold crossed between last scan (exclusive) and today (inclusive)
      if (
        !isBefore(today, fireOn) &&
        isAfter(fireOn, last)
      ) {
        await showReminder(reg, sub, next, rule.daysBefore);
      }
    }
  }

  await db.settings.update("singleton", {
    lastNotificationScan: new Date().toISOString(),
  });
}

async function showReminder(
  reg: ServiceWorkerRegistration | undefined,
  sub: Subscription,
  next: Date,
  daysBefore: number,
) {
  const price = priceOn(sub, next);
  const whenText =
    daysBefore === 0
      ? "today"
      : daysBefore === 1
        ? "tomorrow"
        : `in ${daysBefore} days`;
  const title = `${sub.name} charges ${whenText}`;
  const body = `${formatMoney(price, sub.currency)} on ${next.toLocaleDateString()}`;
  const opts: NotificationOptions = {
    body,
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: `${sub.id}:${next.toISOString()}:${daysBefore}`,
  };
  if (reg) {
    await reg.showNotification(title, opts);
  } else {
    new Notification(title, opts);
  }
}
