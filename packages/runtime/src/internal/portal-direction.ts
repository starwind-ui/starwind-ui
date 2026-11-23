import { type Direction, onDirectionChange, readDirection } from "./direction";
import { isDocumentHTMLElement } from "./portal-target-policy";

export type PortalDirectionSession = {
  destroy(): void;
  sync(): boolean;
};

type Lease = { owner: HTMLElement; onChange?: (direction: Direction) => void };
type Controller = { owner: HTMLElement | null; sync(): boolean };

const activeControllers = new Set<Controller>();
const controllers = new WeakMap<
  HTMLElement,
  (owner: HTMLElement, onChange?: (direction: Direction) => void) => PortalDirectionSession
>();
const frameworkSessions = new WeakMap<
  HTMLElement,
  { owner: HTMLElement; session: PortalDirectionSession }
>();

export function prepareFrameworkPortalDirection(
  wrapper: HTMLElement,
  reference: Element | null,
): void {
  const prior = frameworkSessions.get(wrapper);
  const owner =
    isDocumentHTMLElement(reference, wrapper.ownerDocument) &&
    reference.isConnected &&
    reference !== wrapper
      ? reference
      : prior?.owner?.isConnected && prior.owner.ownerDocument === wrapper.ownerDocument
        ? prior.owner
        : wrapper.parentElement;
  if (!owner) return;
  if (prior?.owner === owner) {
    prior.session.sync();
    return;
  }
  prior?.session.destroy();
  frameworkSessions.set(wrapper, {
    owner,
    session: createPortalDirectionSession(owner, wrapper),
  });
}

export function releaseFrameworkPortalDirection(wrapper: HTMLElement): void {
  frameworkSessions.get(wrapper)?.session.destroy();
  frameworkSessions.delete(wrapper);
}

/** Keep the logical owner's direction on a moved wrapper without owning authored dir. */
export function createPortalDirectionSession(
  owner: HTMLElement,
  wrapper: HTMLElement,
  onChange?: (direction: Direction) => void,
): PortalDirectionSession {
  let acquire = controllers.get(wrapper);
  if (!acquire) {
    acquire = createController(wrapper);
    controllers.set(wrapper, acquire);
  }
  return acquire(owner, onChange);
}

function createController(
  wrapper: HTMLElement,
): (owner: HTMLElement, onChange?: (direction: Direction) => void) => PortalDirectionSession {
  const leases: Lease[] = [];
  let authoredDirection = wrapper.getAttribute("dir");
  let projectedDirection: Direction | null = null;
  let effectiveDirection: Direction | null = null;
  let syncing = false;
  const controller: Controller = { owner: null, sync };
  let document = wrapper.ownerDocument;
  let stopListening = onDirectionChange(document, sync, true);
  activeControllers.add(controller);

  return (owner, onChange) => {
    const lease: Lease = { owner, onChange };
    leases.push(lease);
    controller.owner = owner;
    sync();
    let released = false;
    return {
      sync,
      destroy() {
        if (released) return;
        released = true;
        readAuthoredWrite();
        leases.splice(leases.indexOf(lease), 1);
        controller.owner = leases.at(-1)?.owner ?? null;
        if (controller.owner) {
          sync();
          return;
        }
        stopListening();
        activeControllers.delete(controller);
        controllers.delete(wrapper);
        if (projectedDirection !== null && authoredDirection === null)
          wrapper.removeAttribute("dir");
      },
    };
  };

  // With no observer, a value other than the last projection is an authored write. A same-value
  // authored write reads as a projection.
  function readAuthoredWrite(): void {
    const attribute = wrapper.getAttribute("dir");
    if (attribute === (projectedDirection ?? authoredDirection)) return;
    authoredDirection = attribute;
    projectedDirection = null;
  }

  /** Copy the owner's direction to the wrapper. Returns true when it wrote `dir`. */
  function sync(): boolean {
    if (syncing || !controller.owner) return false;
    if (wrapper.ownerDocument !== document) {
      stopListening();
      document = wrapper.ownerDocument;
      stopListening = onDirectionChange(document, sync, true);
    }
    syncing = true;
    let wrote = false;
    try {
      readAuthoredWrite();
      if (authoredDirection === null) {
        const nextDirection = readDirection(controller.owner);
        if (wrapper.getAttribute("dir") !== nextDirection) {
          wrapper.setAttribute("dir", nextDirection);
          wrote = true;
        }
        projectedDirection = nextDirection;
      }
      const nextEffectiveDirection = readDirection(wrapper);
      if (effectiveDirection !== null && nextEffectiveDirection !== effectiveDirection) {
        for (const lease of leases) lease.onChange?.(nextEffectiveDirection);
      }
      effectiveDirection = nextEffectiveDirection;
      for (const nested of activeControllers) {
        if (
          nested !== controller &&
          nested.owner &&
          wrapper.contains(nested.owner) &&
          nested.sync()
        )
          wrote = true;
      }
    } finally {
      syncing = false;
    }
    return wrote;
  }
}
