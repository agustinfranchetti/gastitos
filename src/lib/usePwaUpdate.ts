import { useCallback, useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/**
 * Fires when a new service worker has installed precache and the page should reload to pick it up.
 * With `registerType: "autoUpdate"`, the worker updates in the background; this hook exposes when to offer a reload.
 */
export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  );

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
    updateRef.current = update;
  }, []);

  const applyUpdate = useCallback(async () => {
    setNeedRefresh(false);
    await updateRef.current?.(true);
  }, []);

  const dismiss = useCallback(() => setNeedRefresh(false), []);

  return { needRefresh, applyUpdate, dismiss };
}
