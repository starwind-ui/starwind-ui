export const themeToggleNativePolicy = { type: "button", slot: "theme-toggle" } as const;

/** Existing Vue attribute-fallback exception; other targets keep their native spread contract. */
export function themeControlSlotFallback(input: string): string {
  return `${input} || '${themeToggleNativePolicy.slot}'`;
}

/**
 * The idempotent document owner discovers and synchronizes mounted controls.
 * A control requests initialization without owning the document controller's disposal.
 */
export function initializeThemeControl(documentExpression = ""): string {
  return `initThemeController(${documentExpression});`;
}
