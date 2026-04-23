import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import { enUS, es as esDateLocale } from "date-fns/locale";
import { en } from "../locales/en";
import { es } from "../locales/es";
import type { AppLocale } from "./types";
import { useSettings } from "./hooks";

const PACKS: Record<AppLocale, typeof en> = { en, es };

const DATE_FNS: Record<AppLocale, typeof enUS> = {
  en: enUS,
  es: esDateLocale,
};

function getString(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`,
  );
}

type TParams = Record<string, string | number> | undefined;

type I18nValue = {
  locale: AppLocale;
  t: (path: string, params?: TParams) => string;
  /** date-fns locale for `format` */
  dateLocale: typeof enUS;
  formatMonth: (d: Date) => string;
  formatShortDay: (d: Date) => string;
  formatWeekday: (d: Date) => string;
  formatDayAndMonth: (d: Date) => string;
  cycle: (c: string) => string;
  weekdayRow: () => readonly string[];
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const locale: AppLocale = settings?.language === "es" ? "es" : "en";
  const pack = PACKS[locale];
  const dateLocale = DATE_FNS[locale];

  const value = useMemo((): I18nValue => {
    function t(path: string, params?: TParams): string {
      const raw = getString(pack, path) ?? getString(PACKS.en, path) ?? path;
      return interpolate(raw, params);
    }

    return {
      locale,
      t,
      dateLocale,
      formatMonth: (d: Date) => format(d, "MMMM yyyy", { locale: dateLocale }),
      formatShortDay: (d: Date) => format(d, "d MMM", { locale: dateLocale }),
      formatWeekday: (d: Date) => format(d, "EEEE", { locale: dateLocale }),
      formatDayAndMonth: (d: Date) => format(d, "d MMM", { locale: dateLocale }),
      cycle: (c: string) => {
        const v = t(`cycle.${c}`);
        if (v === `cycle.${c}`) return c[0]!.toUpperCase() + c.slice(1);
        return v;
      },
      weekdayRow: () => [...pack.calendar.weekdayShort] as string[],
    };
  }, [locale, pack, dateLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback (e.g. Storybook) — default English
    const pack = en;
    const dateLocale = enUS;
    return {
      locale: "en",
      t: (path: string, params?: TParams) => {
        const raw = getString(pack, path) ?? path;
        return interpolate(raw, params);
      },
      dateLocale,
      formatMonth: (d: Date) => format(d, "MMMM yyyy", { locale: dateLocale }),
      formatShortDay: (d: Date) => format(d, "d MMM", { locale: dateLocale }),
      formatWeekday: (d: Date) => format(d, "EEEE", { locale: dateLocale }),
      formatDayAndMonth: (d: Date) => format(d, "d MMM", { locale: dateLocale }),
      cycle: (c: string) => c[0]!.toUpperCase() + c.slice(1),
      weekdayRow: () => [...en.calendar.weekdayShort],
    };
  }
  return ctx;
}
