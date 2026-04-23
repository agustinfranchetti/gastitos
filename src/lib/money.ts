import type { Currency, FxRates } from "./types";

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  ARS: "$",
};

export function symbol(c: Currency): string {
  return SYMBOLS[c];
}

function formatMoneyFull(
  amount: number,
  currency: Currency,
  showCode: boolean,
): string {
  const locale =
    currency === "EUR" ? "de-DE" : currency === "ARS" ? "es-AR" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const s = formatter.format(amount);
  const sym = SYMBOLS[currency];
  const pre = currency === "EUR" ? `${sym}` : `${sym}`;
  return showCode ? `${pre}${s} ${currency}` : `${pre}${s}`;
}

/** $154K / $1.2M when |amount| ≥ 10_000 (compact path). */
function formatMoneyCompact(
  amount: number,
  currency: Currency,
  showCode: boolean,
): string {
  const abs = Math.abs(amount);
  const sym = SYMBOLS[currency];
  const sign = amount < 0 ? "−" : "";
  const code = showCode ? ` ${currency}` : "";

  if (abs < 10_000) {
    return formatMoneyFull(amount, currency, showCode);
  }

  if (abs < 1_000_000) {
    const v = amount / 1000;
    const a = Math.abs(v);
    let n: string;
    if (a >= 100) n = a.toFixed(0);
    else if (Number.isInteger(a)) n = a.toFixed(0);
    else n = a.toFixed(1).replace(/\.0$/, "");
    return `${sign}${sym}${n}K${code}`;
  }

  const v = amount / 1_000_000;
  const a = Math.abs(v);
  const n = Number.isInteger(a) ? a.toFixed(0) : a.toFixed(1).replace(/\.0$/, "");
  return `${sign}${sym}${n}M${code}`;
}

export function formatMoney(
  amount: number,
  currency: Currency,
  opts: { compact?: boolean; showCode?: boolean } = {},
): string {
  const { compact = false, showCode = false } = opts;
  if (compact) {
    return formatMoneyCompact(amount, currency, showCode);
  }
  return formatMoneyFull(amount, currency, showCode);
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  fx?: FxRates,
): number {
  if (from === to) return amount;
  if (!fx) return amount;
  // rates are relative to fx.base: 1 base = rates[ccy] * ccy
  const rBase = fx.rates[fx.base] ?? 1;
  const rFrom = fx.rates[from];
  const rTo = fx.rates[to];
  if (!rFrom || !rTo) return amount;
  // amount (from) -> base -> to
  const inBase = amount * (rBase / rFrom);
  return inBase * (rTo / rBase);
}

/** How many `to` equal 1 `from`, or null if the triangle is incomplete. */
export function oneUnitInCurrency(
  from: Currency,
  to: Currency,
  fx: FxRates,
): number | null {
  if (from === to) return 1;
  if ((fx.rates[from] ?? 0) <= 0 || (fx.rates[to] ?? 0) <= 0) return null;
  const n = convert(1, from, to, fx);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Fetches rates via Fawaz Ahmed's free CDN-hosted currency API.
 * No key, no CORS issues, updated daily.
 * Docs: https://github.com/fawazahmed0/exchange-api
 * Default base is USD so stored triangles stay in one form (independent of primary currency).
 */
export async function fetchFxRates(base: Currency = "USD"): Promise<FxRates> {
  const b = base.toLowerCase();
  const primary = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${b}.json`;
  const fallback = `https://latest.currency-api.pages.dev/v1/currencies/${b}.json`;

  let data: Record<string, Record<string, number>> | null = null;
  try {
    const r = await fetch(primary);
    if (r.ok) data = await r.json();
  } catch {
    // try fallback
  }
  if (!data) {
    const r = await fetch(fallback);
    if (!r.ok) throw new Error("FX fetch failed");
    data = await r.json();
  }
  const row = data![b] ?? {};
  return {
    base,
    rates: {
      USD: base === "USD" ? 1 : row["usd"] ?? 0,
      EUR: base === "EUR" ? 1 : row["eur"] ?? 0,
      ARS: base === "ARS" ? 1 : row["ars"] ?? 0,
    },
    fetchedAt: new Date().toISOString(),
  };
}
