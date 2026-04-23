import { useEffect, useState } from "react";
import { logoUrl } from "../lib/logo";
import { getStatus, readyLogoCache, setStatus } from "../lib/logoCache";
import type { Subscription } from "../lib/types";

export function Logo({
  sub,
  token,
  size = 44,
  rounded = 12,
}: {
  sub: Pick<Subscription, "name" | "domain" | "color" | "emoji">;
  token?: string;
  size?: number;
  rounded?: number;
}) {
  const domain = sub.domain?.trim().toLowerCase() ?? "";
  const url = logoUrl(domain, token, { size: size * 2 });

  // Tri-state: unknown (render <img> optimistically) | ok | fail
  const [state, setState] = useState<"unknown" | "ok" | "fail">(() => {
    if (!url) return "fail";
    return getStatus(domain, size) ?? "unknown";
  });

  useEffect(() => {
    let alive = true;
    if (!url) {
      setState("fail");
      return;
    }
    setState(getStatus(domain, size) ?? "unknown");
    readyLogoCache().then(() => {
      if (!alive) return;
      const s = getStatus(domain, size);
      if (s) setState(s);
    });
    return () => {
      alive = false;
    };
  }, [domain, size, url]);

  const bg = sub.color ?? "#221812";
  const initial = sub.name?.trim()?.[0]?.toUpperCase() ?? "·";

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: bg,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4)",
      }}
    >
      {url && state !== "fail" && (
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-cover"
          onLoad={() => {
            setState("ok");
            void setStatus(domain, size, "ok");
          }}
          onError={() => {
            setState("fail");
            void setStatus(domain, size, "fail");
          }}
        />
      )}
      {state === "fail" && (
        sub.emoji ? (
          <span style={{ fontSize: size * 0.58 }}>{sub.emoji}</span>
        ) : (
          <span
            className="font-display font-semibold"
            style={{ fontSize: size * 0.55, color: "#fff7e6" }}
          >
            {initial}
          </span>
        )
      )}
    </div>
  );
}
