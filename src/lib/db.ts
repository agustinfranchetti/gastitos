import Dexie, { type Table } from "dexie";
import type {
  Category,
  Person,
  Settings,
  Subscription,
} from "./types";
import { DEFAULT_ACCENT_PRESET } from "./theme";

export interface LogoCacheRow {
  key: string; // `${domain}|${size}` — token-agnostic so rotating the key doesn't wipe it
  status: "ok" | "fail";
  checkedAt: string;
}

class GastitosDB extends Dexie {
  subscriptions!: Table<Subscription, string>;
  people!: Table<Person, string>;
  categories!: Table<Category, string>;
  settings!: Table<Settings, string>;
  logoCache!: Table<LogoCacheRow, string>;

  constructor() {
    super("gastitos");
    this.version(1).stores({
      subscriptions: "id, name, active, personId, categoryId, currency",
      people: "id, name",
      categories: "id, name",
      settings: "id",
    });
    this.version(2).stores({
      subscriptions: "id, name, active, personId, categoryId, currency",
      people: "id, name",
      categories: "id, name",
      settings: "id",
      logoCache: "key, status",
    });
  }
}

export const db = new GastitosDB();

export async function ensureSeed() {
  const s = await db.settings.get("singleton");
  if (!s) {
    await db.settings.put({
      id: "singleton",
      language: "en",
      primaryCurrency: "ARS",
      notificationsEnabled: false,
      accentPreset: DEFAULT_ACCENT_PRESET,
    });
  } else if (!s.language) {
    await db.settings.update("singleton", { language: "en" });
  }
  const peopleCount = await db.people.count();
  if (peopleCount === 0) {
    await db.people.bulkAdd([
      { id: "me", name: "Me", color: "#ffaa1f", emoji: "🙂" },
    ]);
  }
  const catCount = await db.categories.count();
  if (catCount === 0) {
    await db.categories.bulkAdd([
      { id: "entertainment", name: "Entertainment", color: "#7c5cff", emoji: "🎬" },
      { id: "productivity", name: "Productivity", color: "#2dd4bf", emoji: "💼" },
      { id: "lifestyle", name: "Lifestyle", color: "#f59e0b", emoji: "🌴" },
      { id: "utilities", name: "Utilities", color: "#60a5fa", emoji: "🔌" },
    ]);
  }
}
