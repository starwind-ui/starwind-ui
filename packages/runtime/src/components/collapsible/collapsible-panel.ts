import { hideElementAfterAnimations, showElement } from "../../internal/presence";

export type RenderCollapsiblePanelOptions = {
  heightProperty?: string;
  hiddenUntilFound?: boolean;
  initialAnimation?: string | null;
  open: boolean;
  rendered: boolean;
  signal?: AbortSignal;
};

export const DEFAULT_COLLAPSIBLE_PANEL_HEIGHT_PROPERTY = "--starwind-collapsible-panel-height";
export const DEFAULT_INITIAL_COLLAPSIBLE_PANEL_ANIMATION = "none";
export const COLLAPSIBLE_PANEL_HIDDEN_UNTIL_FOUND_ATTRIBUTE = "data-hidden-until-found";

export function renderCollapsiblePanel(
  panel: HTMLElement,
  {
    heightProperty = DEFAULT_COLLAPSIBLE_PANEL_HEIGHT_PROPERTY,
    hiddenUntilFound = false,
    initialAnimation = DEFAULT_INITIAL_COLLAPSIBLE_PANEL_ANIMATION,
    open,
    rendered,
    signal,
  }: RenderCollapsiblePanelOptions,
): void {
  if (rendered || !initialAnimation) {
    panel.style.removeProperty("animation");
  } else {
    panel.style.setProperty("animation", initialAnimation);
  }

  if (open) {
    showElement(panel);
  }

  panel.style.setProperty(heightProperty, `${panel.scrollHeight}px`);
  panel.setAttribute("data-state", open ? "open" : "closed");

  if (!open && rendered) {
    hideElementAfterAnimations(panel, {
      signal,
      onHidden: () => hideClosedCollapsiblePanel(panel, hiddenUntilFound),
    });
  } else if (!open) {
    hideClosedCollapsiblePanel(panel, hiddenUntilFound);
  }
}

export function hideClosedCollapsiblePanel(panel: HTMLElement, hiddenUntilFound: boolean): void {
  if (hiddenUntilFound) {
    panel.setAttribute("hidden", "until-found");
    panel.classList.remove("hidden");
    return;
  }

  panel.hidden = true;
}
