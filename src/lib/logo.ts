/**
 * Helpers for the logo.dev API.
 * Free/self-serve keys ship as `pk_...`. Images are served from
 * https://img.logo.dev/{domain}?token=...
 */
export function logoUrl(
  domain: string | undefined,
  token: string | undefined,
  opts: { size?: number; format?: "png" | "jpg" | "webp" } = {},
): string | null {
  if (!domain) return null;
  const t = token?.trim();
  if (!t) return null;
  const size = opts.size ?? 128;
  const format = opts.format ?? "png";
  const d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://img.logo.dev/${encodeURIComponent(d)}?token=${encodeURIComponent(
    t,
  )}&size=${size}&format=${format}`;
}

/**
 * Guesses a .com domain from a brand name. Good enough as a starting point;
 * users can edit the domain in the subscription sheet.
 */
export function guessDomain(name: string): string {
  const clean = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");
  return clean ? `${clean}.com` : "";
}
