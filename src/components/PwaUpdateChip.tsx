import { Icon } from "./Icons";
import { useI18n } from "../lib/i18n";

/** Fixed top chip when a new service worker is ready — doesn’t shift layout. */
export function PwaUpdateChip({
  onUpdate,
  onDismiss,
}: {
  onUpdate: () => void;
  onDismiss: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+3.25rem)] z-[45] flex justify-center px-3"
      role="status"
    >
      <div className="pointer-events-auto flex w-full max-w-[min(100%-1.5rem,28rem)] items-center gap-1.5 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-1 py-1 pl-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <span className="min-w-0 flex-1 text-[11px] font-semibold leading-snug text-[#1a0f00] sm:text-[12px]">
          {t("app.updateAvailable")}
        </span>
        <button
          type="button"
          onClick={() => void onUpdate()}
          className="shrink-0 rounded-full bg-[#1a0f00] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-amber-100 shadow-sm active:bg-black"
        >
          {t("app.update")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1a0f00]/70 active:bg-black/10"
          aria-label={t("app.updateLater")}
        >
          <Icon.X className="!h-[15px] !w-[15px]" />
        </button>
      </div>
    </div>
  );
}
