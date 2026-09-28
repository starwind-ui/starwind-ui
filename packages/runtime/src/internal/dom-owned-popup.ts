/** Keep DOM-owned editor controls inside their form while painting above a native dialog. */
export function presentDomOwnedPopup(popup: HTMLElement): (() => void) | undefined {
  if (
    !popup.closest("[data-sw-color-picker]") ||
    !popup.closest("dialog[open]") ||
    typeof popup.showPopover !== "function"
  )
    return;
  const previous = popup.getAttribute("popover");
  const styles = ["right", "bottom"].map((name) => ({
    name,
    value: popup.style.getPropertyValue(name),
    priority: popup.style.getPropertyPriority(name),
  }));
  popup.setAttribute("popover", "manual");
  // Preserve authored margins and the positioner's left/top coordinates.
  popup.style.right = "auto";
  popup.style.bottom = "auto";
  popup.showPopover();
  return () => {
    if (popup.matches(":popover-open")) popup.hidePopover();
    if (previous === null) popup.removeAttribute("popover");
    else popup.setAttribute("popover", previous);
    for (const { name, value, priority } of styles) {
      if (value) popup.style.setProperty(name, value, priority);
      else popup.style.removeProperty(name);
    }
  };
}
