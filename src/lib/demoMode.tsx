import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { applyAccentToDocument } from "./theme";
import type { Settings } from "./types";

/** Open `/demo` in the browser — there is no in-app link. */
export function isDemoPathname(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/demo";
}

/**
 * For non-React code (e.g. notification scan) — must run in the main window
 * (has no sense on `/` vs `/demo` when not mounted).
 */
export function getIsDemoFromWindowPath(): boolean {
  if (typeof window === "undefined") return false;
  return isDemoPathname(window.location.pathname);
}

type DemoContextValue = {
  isDemo: boolean;
  /** Navigates to `/` (leave the demo). */
  exitDemo: () => void;
  /** Merged on top of `DEMO_SETTINGS` in `/demo` (e.g. accent). */
  demoSettingsOverride: Partial<Settings>;
  /** Persists in session only; updates theme via `applyAccentToDocument` when accent changes. */
  patchDemoSettings: (p: Partial<Settings>) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

/**
 * Place **inside** `BrowserRouter`. `isDemo` is true only on the `/demo` URL.
 */
export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDemo = isDemoPathname(pathname);
  const [demoSettingsOverride, setDemoSettingsOverride] = useState<Partial<Settings>>({});

  const exitDemo = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!isDemo) setDemoSettingsOverride({});
  }, [isDemo]);

  const patchDemoSettings = useCallback((p: Partial<Settings>) => {
    setDemoSettingsOverride((s) => ({ ...s, ...p }));
    if (p.accentPreset) applyAccentToDocument(p.accentPreset);
  }, []);

  const value = useMemo(
    () => ({ isDemo, exitDemo, demoSettingsOverride, patchDemoSettings }),
    [isDemo, exitDemo, demoSettingsOverride, patchDemoSettings],
  );

  return (
    <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
  );
}

const noop = () => {};
const patchDemoNoop: (p: Partial<Settings>) => void = () => {};

const emptyOverride: Partial<Settings> = {};

export function useDemoMode(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    return {
      isDemo: false,
      exitDemo: noop,
      demoSettingsOverride: emptyOverride,
      patchDemoSettings: patchDemoNoop,
    };
  }
  return ctx;
}
