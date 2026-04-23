import { db } from "./db";

type Status = "ok" | "fail";

const mem = new Map<string, Status>();
const hydrated = hydrate();

async function hydrate() {
  try {
    const rows = await db.logoCache.toArray();
    for (const r of rows) mem.set(r.key, r.status);
  } catch {
    // ignore
  }
}

function k(domain: string, size: number) {
  return `${domain.toLowerCase()}|${size}`;
}

export async function readyLogoCache() {
  await hydrated;
}

export function getStatus(domain: string, size: number): Status | undefined {
  return mem.get(k(domain, size));
}

export async function setStatus(
  domain: string,
  size: number,
  status: Status,
) {
  const key = k(domain, size);
  if (mem.get(key) === status) return;
  mem.set(key, status);
  try {
    await db.logoCache.put({
      key,
      status,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}
