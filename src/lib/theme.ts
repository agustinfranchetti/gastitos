import type { AccentPreset, Settings } from "./types";

/** Dots in settings accent row */
export const ACCENT_PICKER_STYLE: Record<AccentPreset, string> = {
  orange: "#f97316",
  amber: "#f59e0b",
  rose: "#f43f5e",
  emerald: "#10b981",
  violet: "#8b5cf6",
};

export const ACCENT_PRESET_ORDER: readonly AccentPreset[] = [
  "rose",
  "orange",
  "amber",
  "emerald",
  "violet",
] as const;

/** Default for new sessions / unset `Settings.accentPreset` */
export const DEFAULT_ACCENT_PRESET: AccentPreset = "rose";

/** R,G,B triplets 0-255 for rgb(var(--x) / a) in CSS */
const ACCENT_PRESET_VARS: Record<
  AccentPreset,
  {
    "accent-50": [number, number, number];
    "accent-100": [number, number, number];
    "accent-200": [number, number, number];
    "accent-300": [number, number, number];
    "accent-400": [number, number, number];
    "accent-500": [number, number, number];
    "accent-600": [number, number, number];
    "accent-700": [number, number, number];
  }
> = {
  orange: {
    "accent-50": [255, 247, 237],
    "accent-100": [255, 237, 213],
    "accent-200": [254, 215, 170],
    "accent-300": [253, 186, 116],
    "accent-400": [251, 146, 60],
    "accent-500": [249, 115, 22],
    "accent-600": [234, 88, 12],
    "accent-700": [194, 65, 12],
  },
  amber: {
    "accent-50": [255, 251, 235],
    "accent-100": [254, 243, 199],
    "accent-200": [253, 230, 138],
    "accent-300": [252, 211, 77],
    "accent-400": [251, 191, 36],
    "accent-500": [245, 158, 11],
    "accent-600": [217, 119, 6],
    "accent-700": [180, 83, 9],
  },
  rose: {
    "accent-50": [255, 241, 242],
    "accent-100": [255, 228, 230],
    "accent-200": [254, 205, 211],
    "accent-300": [253, 164, 175],
    "accent-400": [251, 113, 133],
    "accent-500": [244, 63, 94],
    "accent-600": [225, 29, 72],
    "accent-700": [190, 18, 60],
  },
  emerald: {
    "accent-50": [236, 253, 245],
    "accent-100": [209, 250, 229],
    "accent-200": [167, 243, 208],
    "accent-300": [110, 231, 183],
    "accent-400": [52, 211, 153],
    "accent-500": [16, 185, 129],
    "accent-600": [5, 150, 105],
    "accent-700": [4, 120, 87],
  },
  violet: {
    "accent-50": [245, 243, 255],
    "accent-100": [237, 233, 254],
    "accent-200": [221, 214, 254],
    "accent-300": [196, 181, 253],
    "accent-400": [167, 139, 250],
    "accent-500": [139, 92, 246],
    "accent-600": [124, 58, 237],
    "accent-700": [109, 40, 217],
  },
};

function rgbTuple([r, g, b]: [number, number, number]) {
  return `${r} ${g} ${b}`;
}

/** App is always dark; `dark:` Tailwind + CSS vars for accent. */
export function applyDarkToDocument() {
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.classList.add("dark");
  root.style.colorScheme = "dark";
}

export function applyAccentToDocument(preset: AccentPreset) {
  const v = ACCENT_PRESET_VARS[preset];
  const root = document.documentElement;
  (Object.keys(v) as (keyof typeof v)[]).forEach((name) => {
    root.style.setProperty(`--${name}-rgb`, rgbTuple(v[name]));
  });
  root.setAttribute("data-accent", preset);
}

export function syncDocumentAccentFromSettings(s: Settings | null | undefined) {
  applyDarkToDocument();
  if (!s) {
    applyAccentToDocument(DEFAULT_ACCENT_PRESET);
    return;
  }
  applyAccentToDocument(s.accentPreset ?? DEFAULT_ACCENT_PRESET);
}
