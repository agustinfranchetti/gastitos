import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/**
 * Fires when a new service worker has installed precache and the page should reload to pick it up.
 * With `registerType: "autoUpdate"`, the worker updates in the background; this hook exposes when to offer a reload.
 */
export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  );
  const regRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_url, reg) {
        regRef.current = reg ?? null;
        if (!import.meta.env.PROD) return;
        const onVis = () => {
          if (document.visibilityState === "visible") void reg?.update();
        };
        document.addEventListener("visibilitychange", onVis);
        void reg?.update();
      },
    });
    updateRef.current = update;
  }, []);

  /** Ask the service worker to fetch a new version (shows update chip if available). */
  const checkForUpdate = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setIsChecking(true);
    try {
      const reg =
        regRef.current ??
        (await navigator.serviceWorker.getRegistration());
      if (reg) await reg.update();
    } finally {
      setIsChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setNeedRefresh(false);
    await updateRef.current?.(true);
  }, []);

  const dismiss = useCallback(() => setNeedRefresh(false), []);

  return { needRefresh, applyUpdate, dismiss, checkForUpdate, isChecking };
}
