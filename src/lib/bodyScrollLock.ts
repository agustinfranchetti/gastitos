let lockCount = 0;
let savedScrollY = 0;

/**
 * Stops background page scroll (stacks: nested / multiple sheets).
 * Uses fixed body + iOS-friendly restore.
 */
export function lockBodyScroll() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  lockCount += 1;
}

export function unlockBodyScroll() {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount > 0) return;
  const html = document.documentElement;
  html.style.overflow = "";
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  window.scrollTo(0, savedScrollY);
}
