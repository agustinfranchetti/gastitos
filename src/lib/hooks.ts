import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import {
  DEMO_CATEGORIES,
  DEMO_PEOPLE,
  DEMO_SETTINGS,
  DEMO_SUBSCRIPTIONS,
} from "./demoData";
import { useDemoMode } from "./demoMode";

export const useSettings = () => {
  const { isDemo, demoSettingsOverride } = useDemoMode();
  const live = useLiveQuery(
    async () => (isDemo ? null : (await db.settings.get("singleton")) ?? null),
    [isDemo],
  );
  if (isDemo) return { ...DEMO_SETTINGS, ...demoSettingsOverride };
  return live ?? null;
};

export const useSubscriptions = () => {
  const { isDemo } = useDemoMode();
  const live = useLiveQuery(
    async () => (isDemo ? [] : await db.subscriptions.toArray()),
    [isDemo],
  );
  if (isDemo) return DEMO_SUBSCRIPTIONS;
  return live ?? [];
};

export const usePeople = () => {
  const { isDemo } = useDemoMode();
  const live = useLiveQuery(
    async () => (isDemo ? [] : await db.people.toArray()),
    [isDemo],
  );
  if (isDemo) return DEMO_PEOPLE;
  return live ?? [];
};

export const useCategories = () => {
  const { isDemo } = useDemoMode();
  const live = useLiveQuery(
    async () => (isDemo ? [] : await db.categories.toArray()),
    [isDemo],
  );
  if (isDemo) return DEMO_CATEGORIES;
  return live ?? [];
};
