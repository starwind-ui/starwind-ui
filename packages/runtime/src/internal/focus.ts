const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "details > summary:first-of-type",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
  );
}

export function focusFirstElement(container: HTMLElement, options?: FocusOptions): void {
  const focusable = getFocusableElements(container);
  const target = focusable[0] ?? container;

  if (target === container && !container.hasAttribute("tabindex")) {
    container.setAttribute("tabindex", "-1");
  }

  if (options) {
    target.focus(options);
  } else {
    target.focus();
  }
}

/**
 * A close can finish long after it starts. Focus goes back to the trigger only when it is still in
 * the closing surfaces, or nothing holds it. Otherwise the user has moved on, and that focus stays.
 */
export function canReturnFocus(
  ownerDocument: Document,
  closingSurfaces: Iterable<HTMLElement | null>,
): boolean {
  let active = ownerDocument.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  if (!active || active === ownerDocument.body || active === ownerDocument.documentElement) {
    return true;
  }

  for (const surface of closingSurfaces) {
    if (surface?.contains(active)) return true;
  }

  return false;
}

export function trapTabKey(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
