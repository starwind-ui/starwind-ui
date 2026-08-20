export async function assertPublicPortalTopology(locator, { portalSlot, targetSelector = "body" }) {
  const state = await locator.evaluate(
    (content, { portalSlot: expectedPortalSlot, targetSelector: expectedTargetSelector }) => {
      const portal = content.closest(`[data-slot="${expectedPortalSlot}"]`);
      const target = document.querySelector(expectedTargetSelector);
      return {
        contentInsidePortal: portal?.contains(content) ?? false,
        portalInsideTarget: target?.contains(portal) ?? false,
        portalSlot: portal?.getAttribute("data-slot") ?? null,
        portalTagName: portal?.tagName ?? null,
      };
    },
    { portalSlot, targetSelector },
  );

  if (
    state.contentInsidePortal !== true ||
    state.portalInsideTarget !== true ||
    state.portalSlot !== portalSlot ||
    state.portalTagName !== "DIV"
  ) {
    throw new Error(
      `Expected ${portalSlot} to keep its floating descendant inside one public wrapper under ${targetSelector}, got ${JSON.stringify(
        state,
      )}.`,
    );
  }
}
