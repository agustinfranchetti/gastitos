import type { Currency, FxRates } from "./types";

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  ARS: "$",
};

export function symbol(c: Currency): string {
  return SYMBOLS[c];
}

export function formatMoney(
  amount: number,
  currency: Currency,
  opts: { compact?: boolean; showCode?: boolean } = {},
): string {
  const { compact = false, showCode = false } = opts;
  const abs = Math.abs(amount);
  const locale = currency === "EUR" ? "de-DE" : currency === "ARS" ? "es-AR" : "en-US";
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: abs >= 1000 && compact ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const s = formatter.format(amount);
  const sym = SYMBOLS[currency];
  const pre = currency === "EUR" ? `${sym}` : `${sym}`;
  return showCode ? `${pre}${s} ${currency}` : `${pre}${s}`;
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

/**
 * Fetches rates via Fawaz Ahmed's free CDN-hosted currency API.
 * No key, no CORS issues, updated daily.
 * Docs: https://github.com/fawazahmed0/exchange-api
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
