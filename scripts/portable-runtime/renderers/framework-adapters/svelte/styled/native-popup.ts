/** Native presentation keeps DOM-owned parts together while Runtime owns the popup lifecycle. */
export function printSvelteNativePopupPresentation(): string {
  return `function connectNativePopup(popup: HTMLElement, shouldPromote: () => boolean): () => void {
  const view = popup.ownerDocument.defaultView;
  if (!view || typeof popup.showPopover !== "function") return () => {};
  let releasePresentation: (() => void) | undefined;
  const hide = () => { if (popup.matches(":popover-open")) popup.hidePopover(); };
  const sync = () => {
    // Runtime sets hidden after its existing exit motion completes.
    if (popup.hidden) { hide(); return; }
    if (!popup.isConnected || popup.dataset.state !== "open" || !shouldPromote()) return;
    if (!releasePresentation) {
      const previous = popup.getAttribute("popover");
      const styles = ["right", "bottom"] as const;
      const original = styles.map((name) => [name, popup.style.getPropertyValue(name), popup.style.getPropertyPriority(name)] as const);
      popup.setAttribute("popover", "manual");
      // Keep Runtime's left/top coordinates; authored margins stay in the CSS cascade.
      popup.style.right = "auto";
      popup.style.bottom = "auto";
      releasePresentation = () => {
        hide();
        if (previous === null) popup.removeAttribute("popover"); else popup.setAttribute("popover", previous);
        for (const [name, value, priority] of original) {
          if (value) popup.style.setProperty(name, value, priority); else popup.style.removeProperty(name);
        }
      };
    }
    if (!popup.matches(":popover-open")) popup.showPopover();
  };
  sync();
  const observer = new view.MutationObserver(sync);
  observer.observe(popup, { attributes: true, attributeFilter: ["data-state", "hidden"] });
  return () => { observer.disconnect(); releasePresentation?.(); };
}`;
}
