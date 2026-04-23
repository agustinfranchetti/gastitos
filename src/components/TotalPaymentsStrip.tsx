import clsx from "clsx";
import { motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const ITEM = 48;
const MAX = 60;

type Props = {
  value: number | null;
  onChange: (n: number | null) => void;
  /** Aria for ∞ (ongoing) */
  ariaOngoing: string;
  /** Aria for a numeric index i where i ≥ 1 */
  ariaCount: (i: number) => string;
};

function indexForValue(v: number | null) {
  if (v == null) return 0;
  if (v < 1) return 0;
  return Math.min(v, MAX);
}

function valueForIndex(i: number): number | null {
  if (i <= 0) return null;
  return Math.min(i, MAX);
}

/** Horizontal iOS-style strip: center window, edge fades, snap scroll. */
export function TotalPaymentsStrip({
  value,
  onChange,
  ariaOngoing,
  ariaCount,
}: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pad, setPad] = useState(0);
  const scrollEnd = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focus = indexForValue(value);

  const relayout = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setPad((el.clientWidth - ITEM) / 2);
  }, []);

  useLayoutEffect(() => {
    relayout();
  }, [relayout]);

  useEffect(() => {
    const onResize = () => relayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [relayout]);

  const commitFromScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.min(
      Math.max(0, Math.round(el.scrollLeft / ITEM)),
      MAX,
    );
    onChange(valueForIndex(i));
  }, [onChange]);

  useLayoutEffect(() => {
    const i = indexForValue(value);
    const el = scroller.current;
    if (!el) return;
    if (el.scrollWidth === 0) return;
    if (Math.round(el.scrollLeft / ITEM) === i) return;
    el.scrollTo({ left: i * ITEM, behavior: "auto" });
  }, [value]);

  function pickIndex(i: number) {
    onChange(valueForIndex(i));
    requestAnimationFrame(() => {
      scroller.current?.scrollTo({ left: i * ITEM, behavior: "smooth" });
    });
  }

  function handleScroll() {
    if (scrollEnd.current) clearTimeout(scrollEnd.current);
    scrollEnd.current = setTimeout(() => {
      scrollEnd.current = null;
      commitFromScroll();
    }, 100);
  }

  return (
    <div className="relative -mx-1">
      <div
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-2xl"
        aria-hidden
      >
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#100c09] from-25% to-transparent" />
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#100c09] from-25% to-transparent" />
        <div className="absolute inset-y-1.5 left-1/2 z-20 w-12 -translate-x-1/2 rounded-md border border-[color:rgb(var(--accent-500-rgb)/0.38)] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]" />
      </div>

      <div
        ref={scroller}
        role="listbox"
        tabIndex={0}
        className="relative z-0 h-[3.15rem] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent-400-rgb)/0.4)] sm:h-[3.25rem] [&::-webkit-scrollbar]:hidden"
        style={{ paddingLeft: pad, paddingRight: pad, scrollBehavior: "auto" }}
        onScroll={handleScroll}
        onPointerUp={commitFromScroll}
        onKeyDown={(e) => {
          const i = indexForValue(value);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            pickIndex(Math.min(i + 1, MAX));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            pickIndex(Math.max(i - 1, 0));
          }
        }}
        aria-activedescendant={"tp-opt-" + focus}
      >
        <div className="flex h-full" role="none">
          {Array.from({ length: MAX + 1 }, (_, i) => {
            const selected = i === focus;
            const isInf = i === 0;
            return (
              <motion.button
                key={i}
                id={"tp-opt-" + i}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={isInf ? ariaOngoing : ariaCount(i)}
                style={{ width: ITEM, minWidth: ITEM }}
                className={clsx(
                  "relative z-0 flex snap-center snap-always items-center justify-center self-stretch",
                  isInf ? "font-mono" : "tabular-nums",
                )}
                onClick={() => pickIndex(i)}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
              >
                <span
                  className={clsx(
                    "relative z-[1] text-sm font-semibold transition-colors",
                    selected ? "text-white" : "text-white/32",
                    isInf &&
                      "text-2xl font-light leading-none tracking-[-0.02em] sm:text-3xl",
                    isInf && "scale-x-110",
                  )}
                >
                  {isInf ? "∞" : i}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
