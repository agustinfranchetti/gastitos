import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  isAfter,
  isBefore,
  isEqual,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { Raise, Subscription } from "./types";

/** Max number of charge events; 0/undefined/negative = unlimited. */
export function maxPaymentCount(sub: Subscription): number {
  const n = sub.totalPayments;
  if (n == null || n <= 0) return Infinity;
  return n;
}

export function nextPaymentAfter(sub: Subscription, from: Date): Date | null {
  const start = parseISO(sub.startDate);
  const end = sub.endDate ? parseISO(sub.endDate) : null;
  const max = maxPaymentCount(sub);
  let d = start;
  let count = 0;
  const safety = 5000;
  for (let i = 0; i < safety; i++) {
    if (count >= max) return null;
    if (end && isAfter(d, end)) return null;
    if (!isBefore(d, from) || isEqual(d, from)) return d;
    d = advance(d, sub);
    count++;
  }
  return null;
}

export function paymentsRemaining(sub: Subscription, from: Date): number | null {
  if (!sub.totalPayments) return null;
  const start = parseISO(sub.startDate);
  let d = start;
  let count = 0;
  for (let i = 0; i < 5000 && count < sub.totalPayments; i++) {
    if (!isBefore(d, from) || isEqual(d, from)) break;
    d = advance(d, sub);
    count++;
  }
  return Math.max(0, sub.totalPayments - count);
}

export function advance(d: Date, sub: Subscription): Date {
  switch (sub.cycle) {
    case "weekly":
      return addWeeks(d, 1);
    case "monthly":
      return addMonths(d, 1);
    case "quarterly":
      return addMonths(d, 3);
    case "yearly":
      return addYears(d, 1);
    case "custom":
      return addDays(d, Math.max(1, sub.customEveryDays ?? 30));
  }
}

/**
 * Returns payment dates within [monthStart, monthEnd] for the sub,
 * honoring optional endDate and totalPayments.
 */
export function paymentsInMonth(sub: Subscription, month: Date): Date[] {
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  const start = parseISO(sub.startDate);
  const end = sub.endDate ? parseISO(sub.endDate) : null;
  if (isAfter(start, mEnd)) return [];
  if (end && isBefore(end, mStart)) return [];

  // Walk from the real start so we can count occurrences for totalPayments.
  let d = start;
  let count = 0;
  const max = maxPaymentCount(sub);
  const out: Date[] = [];
  let guard = 0;
  while (count < max && !isAfter(d, mEnd) && guard < 5000) {
    if (!end || !isAfter(d, end)) {
      if (!isBefore(d, mStart)) out.push(d);
      count++;
    }
    d = advance(d, sub);
    guard++;
  }
  return out;
}

/**
 * Resolves the effective price of the subscription on a given date,
 * applying any raises with `date <= on`.
 */
export function priceOn(sub: Subscription, on: Date): number {
  if (!sub.raises || sub.raises.length === 0) return sub.price;
  const raises = [...sub.raises]
    .filter((r) => !isAfter(parseISO(r.date), on))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  // Reconstruct price timeline. We treat sub.price as the base at sub.startDate.
  let price = sub.price;
  for (const r of raises) {
    price = applyRaise(price, r);
  }
  return price;
}

/**
 * Sum of all charge amounts from first payment through `asOf` (inclusive, local calendar day).
 * Uses the same walk as the calendar (advance/raises) and fixes date-only + UTC issues.
 */
export function totalSpentThroughDate(sub: Subscription, asOf: Date): number {
  const max = maxPaymentCount(sub);
  const asOfDay = startOfDay(asOf);
  const end = sub.endDate
    ? startOfDay(parse(sub.endDate, "yyyy-MM-dd", asOf))
    : null;
  let d = startOfDay(parse(sub.startDate, "yyyy-MM-dd", asOf));
  if (Number.isNaN(d.getTime())) return 0;

  let total = 0;
  let count = 0;
  let guard = 0;
  while (guard < 5000 && count < max) {
    if (end && isAfter(startOfDay(d), end)) break;
    if (isAfter(startOfDay(d), asOfDay)) break;
    total += priceOn(sub, d);
    d = advance(d, sub);
    count++;
    guard++;
  }
  return total;
}

export function applyRaise(prev: number, r: Raise): number {
  if (typeof r.newPrice === "number") return r.newPrice;
  if (typeof r.percent === "number") return prev * (1 + r.percent / 100);
  return prev;
}

export function daysUntil(from: Date, to: Date): number {
  return differenceInCalendarDays(startOfDay(to), startOfDay(from));
}
