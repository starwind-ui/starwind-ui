/** Target-owned overlay families that share capture discovery. */
export const SVELTE_OVERLAY_CAPTURE_COMPONENTS = [
  "alert-dialog",
  "drawer",
  "popover",
  "preview-card",
  "tooltip",
] as const;

export function printSvelteOverlayCapture(): string {
  return `type OverlayCapturePortal = { wrapper: HTMLElement };

export function discoverOverlayCaptures(
  root: HTMLElement,
  portals: Iterable<OverlayCapturePortal>,
  current: readonly HTMLElement[],
  selector: string,
  portalSelector: string,
  ownerSelector: string,
): HTMLElement[] | undefined {
  const logicalPortals = [...portals];
  const next = [
    ...new Set(
      [root, ...logicalPortals.map(({ wrapper }) => wrapper)].flatMap((surface) => [
        ...(surface.matches(selector) ? [surface] : []),
        ...surface.querySelectorAll<HTMLElement>(selector),
      ]),
    ),
  ].filter((element) => {
    const portal = element.closest<HTMLElement>(portalSelector);
    if (
      portal &&
      !portal.contains(root) &&
      !logicalPortals.some(({ wrapper }) => wrapper === portal)
    )
      return false;
    const owner = element.closest(ownerSelector);
    const logicalPortal = logicalPortals.find(({ wrapper }) => wrapper === portal);
    if (logicalPortal) return !owner || owner === root || !logicalPortal.wrapper.contains(owner);
    return owner === root;
  });
  return next.length !== current.length || next.some((part, index) => part !== current[index])
    ? next
    : undefined;
}
`;
}
