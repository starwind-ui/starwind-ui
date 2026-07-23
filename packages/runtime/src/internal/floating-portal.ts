import { resolveFloatingPortalTargetOwner } from "./floating";

export type FloatingPortalSession = {
  demote(): void;
  destroy(): void;
  mount(): void;
  promote(): void;
  restore(): void;
};

export type FloatingPortalSessionOptions = {
  canPromote?: () => boolean;
  getPortalElement: () => HTMLElement;
  getPortalTarget: () => HTMLElement;
  onOwnerCloseRequest?: () => void;
  root: HTMLElement;
};

type RegisteredFloatingPortalSession = FloatingPortalSession & {
  requestOwnerClose(): void;
};

type DialogOwnedFloatingPortalSessions = {
  closing: boolean;
  requested: WeakSet<RegisteredFloatingPortalSession>;
  sessions: Set<RegisteredFloatingPortalSession>;
};

type SavedInlineProperty = {
  priority: string;
  value: string;
};

const dialogOwnedSessions = new WeakMap<HTMLDialogElement, DialogOwnedFloatingPortalSessions>();

export function createFloatingPortalSession(
  options: FloatingPortalSessionOptions,
): FloatingPortalSession {
  let destroyed = false;
  let owner: HTMLDialogElement | null = null;
  let placeholder: Comment | null = null;
  let portalTarget: HTMLElement | null = null;
  let pointerEvents: SavedInlineProperty | null = null;
  let wrapper: HTMLElement | null = null;

  const session: RegisteredFloatingPortalSession = {
    demote,
    destroy,
    mount,
    promote,
    requestOwnerClose() {
      if (options.canPromote?.() === false) return;
      options.onOwnerCloseRequest?.();
    },
    restore,
  };

  function mount(): void {
    if (destroyed) return;

    const nextPortalElement = options.getPortalElement();
    const nextPortalTarget = options.getPortalTarget();
    if (portalTarget && portalTarget !== nextPortalTarget) {
      restore();
    }

    portalTarget = nextPortalTarget;
    const nextOwner = resolveFloatingPortalTargetOwner(nextPortalTarget);
    registerOwner(nextOwner);
    if (destroyed || portalTarget !== nextPortalTarget || owner !== nextOwner) return;

    if (!placeholder && nextPortalElement.parentNode) {
      placeholder = options.root.ownerDocument.createComment("floating-portal-placeholder");
      nextPortalElement.parentNode.insertBefore(placeholder, nextPortalElement);
    }

    if (nextPortalElement.parentElement !== nextPortalTarget && !wrapper) {
      nextPortalTarget.append(nextPortalElement);
    }

    promote();
  }

  function promote(): void {
    if (
      destroyed ||
      wrapper ||
      !portalTarget ||
      options.canPromote?.() === false ||
      !owner?.open ||
      dialogOwnedSessions.get(owner)?.closing
    ) {
      return;
    }

    const portalElement = options.getPortalElement();
    if (!supportsPopover(portalElement)) return;

    const nextWrapper = createPopoverWrapper(portalElement.ownerDocument);
    wrapper = nextWrapper;
    saveAndPreservePointerEvents(portalElement);
    portalTarget.append(nextWrapper);
    nextWrapper.append(portalElement);

    try {
      nextWrapper.showPopover();
    } catch {
      // The same cleanup below handles native failures and synchronous beforetoggle re-entry.
    }

    if (destroyed || wrapper !== nextWrapper || !nextWrapper.matches(":popover-open")) {
      if (wrapper === nextWrapper) wrapper = null;
      cleanupWrapper(nextWrapper, portalElement);
    }
  }

  function demote(): void {
    if (!wrapper) return;

    const currentWrapper = wrapper;
    const portalElement = options.getPortalElement();
    wrapper = null;

    try {
      currentWrapper.hidePopover();
    } catch {
      // Removing the wrapper below also removes any stale native top-layer entry.
    }

    cleanupWrapper(currentWrapper, portalElement);
  }

  function cleanupWrapper(currentWrapper: HTMLElement, portalElement: HTMLElement): void {
    if (currentWrapper.matches(":popover-open")) {
      try {
        currentWrapper.hidePopover();
      } catch {
        // Removing the wrapper below also removes any stale native top-layer entry.
      }
    }

    if (portalElement.parentElement === currentWrapper) {
      if (portalTarget?.isConnected) {
        portalTarget.append(portalElement);
      } else if (placeholder?.parentNode) {
        placeholder.parentNode.insertBefore(portalElement, placeholder.nextSibling);
      }
    }
    currentWrapper.remove();

    if (!wrapper) {
      restorePointerEvents(portalElement);
    }
  }

  function restore(): void {
    demote();

    const portalElement = options.getPortalElement();
    if (placeholder?.parentNode) {
      placeholder.parentNode.insertBefore(portalElement, placeholder);
    }
    placeholder?.remove();
    placeholder = null;
    portalTarget = null;
    registerOwner(null);
    restorePointerEvents(portalElement);
  }

  function destroy(): void {
    if (destroyed) return;

    restore();
    destroyed = true;
  }

  function registerOwner(nextOwner: HTMLDialogElement | null): void {
    if (owner === nextOwner) return;

    if (owner) {
      const ownerSessions = dialogOwnedSessions.get(owner);
      ownerSessions?.sessions.delete(session);
      if (ownerSessions?.sessions.size === 0 && !ownerSessions.closing) {
        dialogOwnedSessions.delete(owner);
      }
    }

    owner = nextOwner;
    if (!owner) return;

    const ownerSessions = getDialogOwnedSessions(owner);
    ownerSessions.sessions.add(session);
    if (ownerSessions.closing) requestSessionOwnerClose(ownerSessions, session);
  }

  function saveAndPreservePointerEvents(portalElement: HTMLElement): void {
    if (pointerEvents) return;

    pointerEvents = {
      priority: portalElement.style.getPropertyPriority("pointer-events"),
      value: portalElement.style.getPropertyValue("pointer-events"),
    };
    if (
      portalElement.ownerDocument.defaultView?.getComputedStyle(portalElement).pointerEvents ===
      "auto"
    ) {
      portalElement.style.setProperty("pointer-events", "auto");
    }
  }

  function restorePointerEvents(portalElement: HTMLElement): void {
    if (!pointerEvents) return;

    if (pointerEvents.value) {
      portalElement.style.setProperty(
        "pointer-events",
        pointerEvents.value,
        pointerEvents.priority,
      );
    } else {
      portalElement.style.removeProperty("pointer-events");
    }
    pointerEvents = null;
  }

  return session;
}

export function requestDialogOwnedFloatingPortalClose(owner: HTMLDialogElement): void {
  const ownerSessions = getDialogOwnedSessions(owner);
  ownerSessions.closing = true;
  for (const session of [...ownerSessions.sessions]) {
    requestSessionOwnerClose(ownerSessions, session);
  }
}

export function demoteDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  for (const session of [...(dialogOwnedSessions.get(owner)?.sessions ?? [])]) {
    session.demote();
  }
}

export function promoteDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  const ownerSessions = dialogOwnedSessions.get(owner);
  if (!ownerSessions) return;

  ownerSessions.closing = false;
  ownerSessions.requested = new WeakSet<RegisteredFloatingPortalSession>();
  for (const session of [...ownerSessions.sessions]) {
    session.promote();
  }
  if (ownerSessions.sessions.size === 0) dialogOwnedSessions.delete(owner);
}

function getDialogOwnedSessions(owner: HTMLDialogElement): DialogOwnedFloatingPortalSessions {
  const existing = dialogOwnedSessions.get(owner);
  if (existing) return existing;

  const ownerSessions: DialogOwnedFloatingPortalSessions = {
    closing: false,
    requested: new WeakSet<RegisteredFloatingPortalSession>(),
    sessions: new Set<RegisteredFloatingPortalSession>(),
  };
  dialogOwnedSessions.set(owner, ownerSessions);
  return ownerSessions;
}

function requestSessionOwnerClose(
  ownerSessions: DialogOwnedFloatingPortalSessions,
  session: RegisteredFloatingPortalSession,
): void {
  if (ownerSessions.requested.has(session)) return;

  ownerSessions.requested.add(session);
  session.requestOwnerClose();
}

function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === "function" && typeof element.hidePopover === "function";
}

function createPopoverWrapper(ownerDocument: Document): HTMLElement {
  const wrapper = ownerDocument.createElement("div");
  wrapper.setAttribute("data-sw-floating-portal", "");
  wrapper.setAttribute("popover", "manual");
  wrapper.style.cssText = [
    "position: fixed",
    "inset: 0",
    "width: 100vw",
    "height: 100vh",
    "max-width: none",
    "max-height: none",
    "margin: 0",
    "padding: 0",
    "border: 0",
    "overflow: visible",
    "background: transparent",
    "pointer-events: none",
  ].join(";");
  return wrapper;
}
