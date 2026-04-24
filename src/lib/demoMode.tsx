import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
};

const DemoContext = createContext<DemoContextValue | null>(null);

/**
 * Place **inside** `BrowserRouter`. `isDemo` is true only on the `/demo` URL.
 */
export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDemo = isDemoPathname(pathname);
  const exitDemo = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ isDemo, exitDemo }),
    [isDemo, exitDemo],
  );

  return (
    <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
  );
}

const noop = () => {};

export function useDemoMode(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    return { isDemo: false, exitDemo: noop };
  }
  return ctx;
}
