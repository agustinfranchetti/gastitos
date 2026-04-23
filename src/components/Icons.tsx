import clsx from "clsx";
import type { SVGProps } from "react";

const base =
  "shrink-0 stroke-current [stroke-linecap:round] [stroke-linejoin:round] fill-none";

function mk(path: React.ReactNode) {
  return ({ className, ...p }: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      aria-hidden="true"
      className={clsx(base, "h-[18px] w-[18px]", className)}
      {...p}
    >
      {path}
    </svg>
  );
}

export const Icon = {
  Search: mk(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
  ),
  /** Metrics / spending overview — soft rounded columns */
  Chart: mk(
    <>
      <rect x="4.5" y="9" width="4" height="12" rx="1.5" fill="none" />
      <rect x="10" y="5" width="4" height="16" rx="1.5" fill="none" />
      <rect x="15.5" y="11" width="4" height="10" rx="1.5" fill="none" />
    </>,
  ),
  Gear: mk(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>,
  ),
  Plus: mk(<path d="M12 5v14M5 12h14" />),
  ChevronDown: mk(<path d="m6 9 6 6 6-6" />),
  ChevronLeft: mk(<path d="m15 6-6 6 6 6" />),
  ChevronRight: mk(<path d="m9 6 6 6-6 6" />),
  /** Month picker */
  Calendar: mk(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2.5" fill="none" />
      <path d="M3 10.5h18" fill="none" />
      <path d="M8.5 2.5v3M15.5 2.5v3" fill="none" />
    </>,
  ),
  Bell: mk(
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>,
  ),
  Tag: mk(
    <>
      <path d="M20.6 13.4 12 22l-9-9V3h10z" />
      <circle cx="8" cy="8" r="1.2" />
    </>,
  ),
  List: mk(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />),
  Rocket: mk(
    <>
      <path d="M14 4c4 0 6 2 6 6l-8 8-4-4 6-10Z" />
      <path d="M5 14 3 21l7-2" />
    </>,
  ),
  Trash: mk(
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  ),
  Check: mk(<path d="m5 12 5 5L20 7" />),
  X: mk(<path d="M6 6l12 12M18 6 6 18" />),
  User: mk(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 5-6 8-6s7 2 8 6" />
    </>,
  ),
  Cloud: mk(
    <path d="M7 18a5 5 0 0 1 0-10 7 7 0 0 1 13.5 2A4 4 0 0 1 19 18H7Z" />,
  ),
  LogOut: mk(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>,
  ),
};
