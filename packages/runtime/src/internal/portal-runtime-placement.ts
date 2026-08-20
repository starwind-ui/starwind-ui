export type RuntimePortalPlacement = {
  destroy(): void;
  move(wrapper: HTMLElement, target: HTMLElement): void;
  restore(): void;
};

export function createRuntimePortalPlacement(initialWrapper?: HTMLElement): RuntimePortalPlacement {
  let anchor: Comment | null = null;
  let wrapper: HTMLElement | null = initialWrapper ?? null;

  if (initialWrapper?.parentNode) {
    anchor = initialWrapper.ownerDocument.createComment("floating-portal-placeholder");
    initialWrapper.parentNode.insertBefore(anchor, initialWrapper);
  }

  return {
    destroy() {
      this.restore();
    },
    move(nextWrapper, target) {
      if (wrapper && wrapper !== nextWrapper) this.restore();
      wrapper = nextWrapper;
      if (!anchor && nextWrapper.parentNode) {
        anchor = nextWrapper.ownerDocument.createComment("floating-portal-placeholder");
        nextWrapper.parentNode.insertBefore(anchor, nextWrapper);
      }
      if (nextWrapper.parentElement !== target) target.append(nextWrapper);
    },
    restore() {
      if (wrapper && anchor?.parentNode) anchor.parentNode.insertBefore(wrapper, anchor);
      anchor?.remove();
      anchor = null;
      wrapper = null;
    },
  };
}
