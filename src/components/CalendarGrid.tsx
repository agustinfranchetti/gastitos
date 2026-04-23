import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
} from "date-fns";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Logo } from "./Logo";
import type { Subscription } from "../lib/types";
import { paymentsInMonth } from "../lib/billing";
import { useI18n } from "../lib/i18n";

type DayCell = { date: Date; subs: Subscription[] };

export function CalendarGrid({
  month,
  subs,
  token,
  onPickDay,
  onPrevMonth,
  onNextMonth,
}: {
  month: Date;
  subs: Subscription[];
  token?: string;
  onPickDay: (d: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingBlank = (getDay(start) + 6) % 7;

  const cellsByDate = new Map<string, Subscription[]>();
  for (const sub of subs) {
    if (!sub.active) continue;
    for (const d of paymentsInMonth(sub, month)) {
      const key = format(d, "yyyy-MM-dd");
      const arr = cellsByDate.get(key) ?? [];
      arr.push(sub);
      cellsByDate.set(key, arr);
    }
  }

  const cells: DayCell[] = days.map((d) => ({
    date: d,
    subs: cellsByDate.get(format(d, "yyyy-MM-dd")) ?? [],
  }));

  const { weekdayRow } = useI18n();
  const labels = weekdayRow();
  const monthKey = format(month, "yyyy-MM");

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    const threshold = 60;
    const fast = Math.abs(velocity.x) > 400;
    if (Math.abs(offset.x) < threshold && !fast) return;
    if (Math.abs(offset.y) > Math.abs(offset.x)) return;
    if (offset.x < 0) onNextMonth?.();
    else onPrevMonth?.();
  }

  return (
    <div className="overflow-hidden px-4">
      <div className="grid grid-cols-7 gap-1.5 pb-2 text-center text-[10px] uppercase tracking-[0.25em] text-white/25">
        {labels.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={monthKey}
          className="grid touch-pan-y grid-cols-7 gap-1.5"
          drag="x"
          dragSnapToOrigin
          dragElastic={0.18}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {Array.from({ length: leadingBlank }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {cells.map((c) => (
            <Cell
              key={c.date.toISOString()}
              cell={c}
              token={token}
              onPick={() => onPickDay(c.date)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const MAX_LOGOS = 2;

function Cell({
  cell,
  token,
  onPick,
}: {
  cell: DayCell;
  token?: string;
  onPick: () => void;
}) {
  const today = isToday(cell.date);
  const dayNum = format(cell.date, "d");
  const shown = cell.subs.slice(0, MAX_LOGOS);
  const overflow = cell.subs.length - shown.length;
  const empty = cell.subs.length === 0;

  return (
    <button
      onClick={onPick}
      className={`relative aspect-square rounded-[12px] border p-1 text-left transition-colors ${
        today
          ? "border-ember-400/40"
          : empty
            ? "border-white/5 hover:border-white/10"
            : "border-white/[0.06] bg-white/[0.02]"
      } active:bg-white/5`}
    >
      <span
        className={`absolute left-1.5 top-1 text-[10px] ${
          empty
            ? today
              ? "text-ember-200/90"
              : "text-white/25"
            : "text-white/60"
        }`}
      >
        {dayNum}
      </span>

      {!empty && (
        <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5 px-1">
          {shown.map((s) => (
            <Logo key={s.id} sub={s} token={token} size={16} rounded={4} />
          ))}
          {overflow > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-white/10 px-1 text-[9px] font-medium text-white/80">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
