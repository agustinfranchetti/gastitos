import { db } from "./db";
import { deleteRow, pushRow, pushSettings } from "./sync";
import { supabase } from "./supabase";
import type { Category, Person, Settings, Subscription } from "./types";

let attached = false;
let suppress = false;
let currentUserId: string | null = null;

/**
 * Attach Dexie hooks that mirror local writes to Supabase.
 * Idempotent.
 */
export function attachSyncHooks() {
  if (attached) return;
  attached = true;

  const hook = <T extends { id: string }>(
    table: import("dexie").Table<T, string>,
    remote: "subscriptions" | "people" | "categories",
  ) => {
    table.hook("creating", (_pk, obj) => {
      if (!suppress && currentUserId) {
        queueMicrotask(() => pushRow(remote, obj as unknown as Subscription | Person | Category));
      }
    });
    table.hook("updating", (_mods, _pk, obj) => {
      if (!suppress && currentUserId) {
        queueMicrotask(() =>
          pushRow(remote, {
            ...(obj as unknown as Subscription | Person | Category),
            ..._mods,
          } as Subscription | Person | Category),
        );
      }
    });
    table.hook("deleting", (pk) => {
      if (!suppress && currentUserId) {
        queueMicrotask(() => deleteRow(remote, pk as string));
      }
    });
  };

  hook(db.subscriptions, "subscriptions");
  hook(db.people, "people");
  hook(db.categories, "categories");

  db.settings.hook("creating", (_pk, obj) => {
    if (!suppress && currentUserId) {
      queueMicrotask(() => pushSettings(currentUserId!, obj as Settings));
    }
  });
  db.settings.hook("updating", (mods, _pk, obj) => {
    if (!suppress && currentUserId) {
      queueMicrotask(() =>
        pushSettings(currentUserId!, {
          ...(obj as Settings),
          ...(mods as Partial<Settings>),
        } as Settings),
      );
    }
  });
}

export function setSyncUser(userId: string | null) {
  currentUserId = userId;
}

/**
 * Runs the given write without triggering remote push (used when
 * receiving realtime events so we don't echo back).
 */
export async function withoutSync<T>(fn: () => Promise<T>): Promise<T> {
  suppress = true;
  try {
    return await fn();
  } finally {
    suppress = false;
  }
}

export { supabase };
