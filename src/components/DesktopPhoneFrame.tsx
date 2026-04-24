import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const DesktopFramedContext = createContext(false);

export function useDesktopFramed() {
  return useContext(DesktopFramedContext);
}

function readFramed() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    !window.matchMedia("(display-mode: standalone)").matches
  );
}

const VB = { w: 606, h: 1252 } as const;
/** `frame.svg` #1D2129 (glass) path bbox — alinea el mockup con el activo. */
const GLASS = { x0: 24.4854, x1: 581.648, y0: 20.7897, y1: 1232.13 } as const;
const SCREEN = {
  top: GLASS.y0 / VB.h,
  left: GLASS.x0 / VB.w,
  right: 1 - GLASS.x1 / VB.w,
  bottom: (VB.h - GLASS.y1) / VB.h,
} as const;

/** iPhone 15/16 Pro logical 393×852 @3x; esquina de pantalla 55pt (55/393 del ancho). */
const R55_OVER_W393 = 55 / 393;

/**
 * On wide, non-standalone viewports, centers the app in `public/frame.svg` (orange iPhone).
 * The scroll layer uses `transform` so `position: fixed` (FAB, sheets) stays inside the “screen”.
 */
export function DesktopPhoneFrame({ children }: { children: ReactNode }) {
  const [framed, setFramed] = useState(readFramed);

  useEffect(() => {
    function sync() {
      setFramed(readFramed());
    }
    const mqW = window.matchMedia("(min-width: 768px)");
    const mqS = window.matchMedia("(display-mode: standalone)");
    mqW.addEventListener("change", sync);
    mqS.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mqW.removeEventListener("change", sync);
      mqS.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  if (!framed) {
    return (
      <DesktopFramedContext.Provider value={false}>
        {children}
      </DesktopFramedContext.Provider>
    );
  }

  return (
    <DesktopFramedContext.Provider value={true}>
      <div className="box-border flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#0e0e10] p-3 sm:p-4">
        {/*
          Width caps height: min(92vw, 450px, (100dvh - padding) * 606/1252) so the full device
          always fits without clipping the frame top/bottom.
        */}
        <div
          className="relative mx-auto w-[min(92vw,450px,calc((100dvh-2.5rem)*606/1252))] shrink-0 [aspect-ratio:606/1252] overflow-visible"
        >
          <img
            src="/frame.svg"
            alt=""
            className="absolute inset-0 h-full w-full select-none object-fill pointer-events-none"
            draggable={false}
            decoding="async"
          />
          <div
            className="absolute z-10 [container-type:inline-size] [transform:translate3d(0,0,0)]"
            style={{
              top: `${SCREEN.top * 100}%`,
              left: `${SCREEN.left * 100}%`,
              right: `${SCREEN.right * 100}%`,
              bottom: `${SCREEN.bottom * 100}%`,
            }}
          >
            {/*
              Radio iOS: 55pt a ancho 393pt → 55/393 = 14.02% del ancho; 14.02cqi escala con el
              ancho del “screen” (igual que en el iPhone al redimensionar el mockup).
            */}
            <div
              className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-col overflow-y-auto overflow-x-hidden bg-[#0a0806] [border-radius:var(--r)] [scrollbar-gutter:stable] [transform:translate3d(0,0,0)] overscroll-y-contain"
              style={{ ["--r" as const]: `min(3.4375rem,${R55_OVER_W393 * 100}cqi)` } as CSSProperties}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </DesktopFramedContext.Provider>
  );
}
