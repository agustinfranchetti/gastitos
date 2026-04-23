import { supabase } from "./supabase";
import { db } from "./db";
import type { Category, Person, Settings, Subscription } from "./types";

// Lazy import to avoid circular init; this module is imported by syncHooks.ts
let _withoutSync: (<T>(fn: () => Promise<T>) => Promise<T>) | null = null;
async function withoutSync<T>(fn: () => Promise<T>): Promise<T> {
  if (!_withoutSync) {
    _withoutSync = (await import("./syncHooks")).withoutSync;
  }
  return _withoutSync!(fn);
}

type Tbl = "subscriptions" | "people" | "categories";
const TABLES: Tbl[] = ["subscriptions", "people", "categories"];

type Row<T> = { id: string; user_id: string; data: T; updated_at: string };

function localTableFor(t: Tbl) {
  if (t === "subscriptions") return db.subscriptions;
  if (t === "people") return db.people;
  return db.categories;
}

/**
 * Pulls all remote rows into Dexie (remote wins by updated_at).
 * Then pushes any local rows missing remotely.
 */
export async function fullSync(userId: string) {
  if (!supabase) return;

  for (const t of TABLES) {
    const { data, error } = await supabase
      .from(t)
      .select("id, user_id, data, updated_at")
      .eq("user_id", userId);
    if (error) {
      console.warn("[sync] pull", t, error.message);
      continue;
    }
    const remote = (data ?? []) as Row<unknown>[];
    const local = (await localTableFor(t).toArray()) as { id: string; updatedAt?: string }[];
    const byId = new Map(local.map((r) => [r.id, r]));

    for (const r of remote) {
      const l = byId.get(r.id);
      const lu = l?.updatedAt ? new Date(l.updatedAt).getTime() : 0;
      const ru = new Date(r.updated_at).getTime();
      if (!l || ru >= lu) {
        await withoutSync(async () => {
          await (localTableFor(t) as unknown as {
            put: (v: unknown) => Promise<unknown>;
          }).put(r.data as Subscription | Person | Category);
        });
      }
      byId.delete(r.id);
    }

    // Local-only rows: push to remote.
    for (const [, l] of byId) {
      const full = (l as unknown) as Subscription | Person | Category;
      await pushRow(t, full);
    }
  }

  // Settings — single row per user.
  const { data: sData } = await supabase
    .from("settings")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const localSettings = await db.settings.get("singleton");
  if (sData) {
    const remote = sData.data as Settings;
    const ru = new Date(sData.updated_at).getTime();
    const lu = localSettings ? getLocalSettingsMtime(localSettings) : 0;
    if (ru >= lu) {
      await withoutSync(() => {
        const next: Settings = localSettings
          ? { ...localSettings, ...remote, id: "singleton" }
          : { ...remote, id: "singleton" };
        return db.settings.put(next);
      });
    } else if (localSettings) {
      await pushSettings(userId, localSettings);
    }
  } else if (localSettings) {
    await pushSettings(userId, localSettings);
  }
}

function getLocalSettingsMtime(_s: Settings) {
  // We don't track settings mtime locally; treat as "now - 1 min" to prefer
  // newer remote on first sync, then local thereafter.
  return Date.now() - 60_000;
}

export async function pushRow(
  t: Tbl,
  row: Subscription | Person | Category,
) {
  if (!supabase) return;
  const id = row.id;
  const updated_at =
    (row as Subscription).updatedAt ?? new Date().toISOString();
  const { error } = await supabase.from(t).upsert({
    id,
    data: row,
    updated_at,
  });
  if (error) console.warn("[sync] push", t, error.message);
}

export async function pushSettings(userId: string, settings: Settings) {
  if (!supabase) return;
  const { error } = await supabase.from("settings").upsert(
    {
      user_id: userId,
      data: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.warn("[sync] push settings", error.message);
}

export async function deleteRow(t: Tbl, id: string) {
  if (!supabase) return;
  const { error } = await supabase.from(t).delete().eq("id", id);
  if (error) console.warn("[sync] delete", t, error.message);
}

/**
 * Subscribes to realtime changes for the user and mirrors them into Dexie.
 * Returns a cleanup function.
 */
export function subscribeRealtime(userId: string): () => void {
  const sb = supabase;
  if (!sb) return () => {};
  const channels = TABLES.map((t) =>
    sb
      .channel(`rt:${t}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: t,
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const target = localTableFor(t);
          await withoutSync(async () => {
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id: string }).id;
              await (
                target as unknown as { delete: (id: string) => Promise<unknown> }
              ).delete(id);
            } else {
              const row = (payload.new as { data: unknown }).data;
              await (target as unknown as {
                put: (v: unknown) => Promise<unknown>;
              }).put(row as Subscription | Person | Category);
            }
          });
        },
      )
      .subscribe(),
  );

  const settingsChannel = sb
    .channel("rt:settings")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "settings",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        if (payload.eventType === "DELETE") return;
        const s = (payload.new as { data: Settings }).data;
        const cur = await db.settings.get("singleton");
        await withoutSync(() =>
          db.settings.put(
            (cur
              ? { ...cur, ...s, id: "singleton" }
              : { ...s, id: "singleton" }) as Settings,
          ),
        );
      },
    )
    .subscribe();

  return () => {
    for (const c of channels) sb.removeChannel(c);
    sb.removeChannel(settingsChannel);
  };
}
