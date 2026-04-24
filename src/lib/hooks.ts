import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

export const useSettings = () => {
  const live = useLiveQuery(
    async () => (await db.settings.get("singleton")) ?? null,
  );
  return live ?? null;
};

export const useSubscriptions = () => {
  return useLiveQuery(async () => await db.subscriptions.toArray()) ?? [];
};

export const usePeople = () => {
  return useLiveQuery(async () => await db.people.toArray()) ?? [];
};

export const useCategories = () => {
  return useLiveQuery(async () => await db.categories.toArray()) ?? [];
};
