import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

export const useSettings = () =>
  useLiveQuery(async () => (await db.settings.get("singleton")) ?? null, []);

export const useSubscriptions = () =>
  useLiveQuery(async () => await db.subscriptions.toArray(), []);

export const usePeople = () =>
  useLiveQuery(async () => await db.people.toArray(), []);

export const useCategories = () =>
  useLiveQuery(async () => await db.categories.toArray(), []);
