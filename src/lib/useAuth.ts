import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import {
  attachSyncHooks,
  setSyncUser,
} from "./syncHooks";
import { fullSync, subscribeRealtime } from "./sync";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    attachSyncHooks();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const user = session?.user as User | undefined;
    setSyncUser(user?.id ?? null);
    if (!user) return;

    let cleanup: (() => void) | null = null;
    fullSync(user.id)
      .catch((e) => console.warn("[sync] full failed", e))
      .finally(() => {
        cleanup = subscribeRealtime(user.id);
      });

    return () => {
      cleanup?.();
    };
  }, [session?.user?.id]);

  return { session, user: session?.user ?? null, ready };
}
