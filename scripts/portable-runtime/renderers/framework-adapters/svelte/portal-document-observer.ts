/** Only these target-owned families subscribe to shared document placement observation. */
export const SVELTE_PORTAL_OBSERVER_COMPONENTS = [
  "alert-dialog",
  "combobox",
  "drawer",
  "menu",
  "navigation-menu",
  "popover",
  "preview-card",
  "select",
  "tooltip",
] as const;

export function printSveltePortalDocumentObserver(): string {
  return `const portalDocumentObservers = new WeakMap<
  Document,
  { observer: MutationObserver; subscribers: Set<() => void> }
>();

export function observePortalDocument(ownerDocument: Document, refresh: () => void): () => void {
  let shared = portalDocumentObservers.get(ownerDocument);
  if (!shared) {
    const MutationObserverConstructor = ownerDocument.defaultView?.MutationObserver;
    if (!MutationObserverConstructor) return () => {};
    const subscribers = new Set<() => void>();
    const observer = new MutationObserverConstructor(() => {
      for (const subscriber of [...subscribers]) {
        if (!subscribers.has(subscriber)) continue;
        try {
          subscriber();
        } catch (error) {
          // A failed callback must leave the other document subscribers responsive.
          queueMicrotask(() => { throw error; });
        }
      }
    });
    observer.observe(ownerDocument, { childList: true, subtree: true });
    shared = { observer, subscribers };
    portalDocumentObservers.set(ownerDocument, shared);
  }

  // Each call owns a subscription even when callers supply the same callback.
  const subscription = () => refresh();
  shared.subscribers.add(subscription);
  const { observer, subscribers } = shared;
  return () => {
    if (!subscribers.delete(subscription) || subscribers.size > 0) return;
    observer.disconnect();
    portalDocumentObservers.delete(ownerDocument);
  };
}
`;
}
