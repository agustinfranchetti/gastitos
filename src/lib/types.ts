export type AppLocale = "en" | "es";

/** Main accent; default `orange` (pure UI orange) */
export type AccentPreset = "orange" | "amber" | "rose" | "emerald" | "violet";

export type Currency = "USD" | "EUR" | "ARS";

export const CURRENCIES: Currency[] = ["ARS", "USD", "EUR"];

export type BillingCycle =
  | "monthly"
  | "yearly"
  | "weekly"
  | "quarterly"
  | "custom";

export interface Person {
  id: string;
  name: string;
  color: string; // hex
  emoji?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

// A change in price effective from a given date (ISO).
// If percent is set, price is derived from previous price at the time
// of the raise. If newPrice is set, it replaces the price outright.
export interface Raise {
  id: string;
  date: string; // ISO yyyy-mm-dd
  percent?: number;
  newPrice?: number;
  note?: string;
}

export interface NotifyRule {
  daysBefore: number; // 0 = on payment day
  enabled: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  domain?: string; // for logo.dev, e.g. "spotify.com"
  emoji?: string;
  color?: string; // fallback tile color
  price: number; // current base price (in currency)
  currency: Currency;
  cycle: BillingCycle;
  customEveryDays?: number; // when cycle === "custom"
  startDate: string; // ISO yyyy-mm-dd — first payment anchor
  endDate?: string | null;
  totalPayments?: number | null; // e.g. 5 = stops after 5 charges
  active: boolean;
  personId?: string | null;
  categoryId?: string | null;
  notes?: string;
  raises: Raise[];
  notify: NotifyRule[]; // up to 3
  createdAt: string;
  updatedAt: string;
}

export interface FxRates {
  base: Currency;
  rates: Record<Currency, number>; // rate such that 1 base = rate * target
  fetchedAt: string; // ISO
}

export interface Settings {
  id: "singleton";
  /** UI language. Defaults to English if missing. */
  language?: AppLocale;
  /** Accent for titles, buttons, and focus. Default orange. */
  accentPreset?: AccentPreset;
  /** Shorten large money as $154K, $1.2M. Default on. */
  useCompactAmounts?: boolean;
  primaryCurrency: Currency;
  logoDevKey?: string;
  fx?: FxRates;
  notificationsEnabled: boolean;
  lastNotificationScan?: string;
}
