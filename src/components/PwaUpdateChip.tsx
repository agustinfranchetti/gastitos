import clsx from "clsx";
import { Icon } from "./Icons";
import { useI18n } from "../lib/i18n";

/** Aviso de nueva PWA, entre la barra superior y el mes (flujo, no fixed). */
export function PwaUpdateChip({ onUpdate }: { onUpdate: () => void }) {
  const { t } = useI18n();

  return (
    <div
      className="shrink-0 flex justify-center px-4 pb-2 pt-0.5"
      role="status"
    >
      <div
        className={clsx(
          "inline-flex max-w-full items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5",
          "border-[color:rgb(var(--accent-400-rgb)/0.3)]",
          "bg-[color:rgb(var(--accent-600-rgb)/0.16)]",
          "shadow-[0_2px_14px_rgba(0,0,0,0.25)]",
          "backdrop-blur-xl backdrop-saturate-150",
        )}
      >
        <span className="min-w-0 pl-0.5 text-sm font-medium leading-tight text-[#e8e2d6]/[0.93]">
          {t("app.updateAvailable")}
        </span>
        <button
          type="button"
          onClick={() => void onUpdate()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[color:rgb(var(--accent-500-rgb))] text-white shadow-sm transition-[filter] active:brightness-95"
          aria-label={t("app.update")}
        >
          <Icon.Refresh className="!h-4 !w-4" />
        </button>
      </div>
    </div>
  );
}
