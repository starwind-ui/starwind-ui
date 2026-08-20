export type PortalBindingPendingSnapshot = Readonly<{
  status: "pending";
}>;

export type PortalBindingReadySnapshot = Readonly<{
  parts: RuntimePartScope;
  status: "ready";
}>;

export type PortalBindingSnapshot = PortalBindingPendingSnapshot | PortalBindingReadySnapshot;

export type PortalBinding = {
  destroy(): void;
  getSnapshot(): PortalBindingSnapshot;
  publish(snapshot: PortalBindingSnapshot): void;
  subscribe(callback: (snapshot: PortalBindingSnapshot) => void): () => void;
};

export type RuntimePartScope = Readonly<{
  portals: readonly RuntimePortalPart[];
  root: HTMLElement;
  wrappers: readonly HTMLElement[];
}>;

export type RuntimePortalPart = Readonly<{
  authoredParent: HTMLElement;
  wrapper: HTMLElement;
}>;

export type ReportPortalPlacementOptions = {
  ready: boolean;
  target: HTMLElement;
};

const PENDING_SNAPSHOT: PortalBindingPendingSnapshot = Object.freeze({ status: "pending" });
const bindings = new WeakMap<HTMLElement, PortalBinding>();
const logicalBindings = new WeakMap<HTMLElement, PortalBinding>();
const frameworkPlacements = new WeakMap<HTMLElement, ReportPortalPlacementOptions>();
const frameworkPlacementListeners = new WeakMap<HTMLElement, Set<() => void>>();

export function createPortalBinding(root: HTMLElement): PortalBinding {
  const existing = bindings.get(root);
  if (existing) return existing;

  let destroyed = false;
  let snapshot: PortalBindingSnapshot = PENDING_SNAPSHOT;
  const logicalParts = new Set<HTMLElement>();
  const listeners = new Set<(snapshot: PortalBindingSnapshot) => void>();

  const binding: PortalBinding = {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      listeners.clear();
      clearLogicalParts();
      if (bindings.get(root) === binding) bindings.delete(root);
    },
    getSnapshot: () => snapshot,
    publish(nextSnapshot) {
      if (destroyed) return;
      clearLogicalParts();
      snapshot = freezePortalBindingSnapshot(root, nextSnapshot);
      if (snapshot.status === "ready") {
        for (const { authoredParent, wrapper } of snapshot.parts.portals) {
          logicalBindings.set(authoredParent, binding);
          logicalBindings.set(wrapper, binding);
          logicalParts.add(authoredParent);
          logicalParts.add(wrapper);
        }
      }
      listeners.forEach((listener) => listener(snapshot));
    },
    subscribe(callback) {
      if (destroyed) return () => undefined;
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
  function clearLogicalParts(): void {
    for (const part of logicalParts) {
      if (logicalBindings.get(part) === binding) logicalBindings.delete(part);
    }
    logicalParts.clear();
  }
  bindings.set(root, binding);
  return binding;
}

export function getPortalBinding(root: HTMLElement): PortalBinding | null {
  return bindings.get(root) ?? null;
}

export function pendingPortalBindingSnapshot(): PortalBindingPendingSnapshot {
  return PENDING_SNAPSHOT;
}

export function readyPortalBindingSnapshot(
  root: HTMLElement,
  portals: readonly RuntimePortalPart[],
): PortalBindingReadySnapshot {
  return freezePortalBindingSnapshot(root, {
    parts: { portals, root, wrappers: portals.map((portal) => portal.wrapper) },
    status: "ready",
  }) as PortalBindingReadySnapshot;
}

export function queryRuntimePartElements<T extends HTMLElement = HTMLElement>(
  root: HTMLElement,
  selector: string,
): T[] {
  const bindingSnapshot = resolveBinding(root)?.getSnapshot();
  const scope =
    bindingSnapshot?.status === "ready"
      ? bindingSnapshot.parts
      : ({ portals: [], root, wrappers: [] } satisfies RuntimePartScope);
  const matches: T[] = Array.from(root.querySelectorAll<T>(selector));

  for (const { authoredParent, wrapper } of scope.portals) {
    if (authoredParent !== root && !root.contains(authoredParent)) continue;
    if (wrapper.matches(selector)) matches.push(wrapper as T);
    matches.push(...wrapper.querySelectorAll<T>(selector));
  }

  return [...new Set(matches)];
}

export function isRuntimePartOwned(
  root: HTMLElement,
  element: HTMLElement,
  rootSelector: string,
): boolean {
  const domOwner = element.closest<HTMLElement>(rootSelector);
  if (domOwner) return domOwner === root;

  const snapshot = resolveBinding(root)?.getSnapshot();
  if (snapshot?.status !== "ready") return false;
  return snapshot.parts.portals.some(
    ({ authoredParent, wrapper }) =>
      (authoredParent === root || root.contains(authoredParent)) &&
      (wrapper === element || wrapper.contains(element)),
  );
}

export function reportPortalPlacement(
  wrapper: HTMLElement,
  placement: ReportPortalPlacementOptions | null,
): void {
  if (placement) {
    const frozenPlacement = Object.freeze({ ...placement });
    frameworkPlacements.set(wrapper, frozenPlacement);
    wrapper.setAttribute("data-sw-portal-placement", "framework");
    wrapper.setAttribute("data-placement", placement.ready ? "ready" : "pending");
  } else {
    frameworkPlacements.delete(wrapper);
  }

  frameworkPlacementListeners.get(wrapper)?.forEach((listener) => listener());
}

export function getReportedPortalPlacement(
  wrapper: HTMLElement,
): ReportPortalPlacementOptions | undefined {
  return frameworkPlacements.get(wrapper);
}

export function subscribeToReportedPortalPlacement(
  wrapper: HTMLElement,
  listener: () => void,
): () => void {
  let listeners = frameworkPlacementListeners.get(wrapper);
  if (!listeners) {
    listeners = new Set();
    frameworkPlacementListeners.set(wrapper, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) frameworkPlacementListeners.delete(wrapper);
  };
}

function freezePortalBindingSnapshot(
  root: HTMLElement,
  snapshot: PortalBindingSnapshot,
): PortalBindingSnapshot {
  if (snapshot.status === "pending") return PENDING_SNAPSHOT;

  const portals = Object.freeze(
    snapshot.parts.portals
      .filter(
        ({ authoredParent, wrapper }) =>
          wrapper.ownerDocument === root.ownerDocument &&
          authoredParent.ownerDocument === root.ownerDocument,
      )
      .map((portal) => Object.freeze({ ...portal })),
  );
  const wrappers = Object.freeze(portals.map((portal) => portal.wrapper));
  const parts = Object.freeze({ portals, root, wrappers });
  return Object.freeze({ parts, status: "ready" });
}

function resolveBinding(root: HTMLElement): PortalBinding | null {
  let current: HTMLElement | null = root;
  while (current) {
    const binding = bindings.get(current);
    if (binding) return binding;
    const logicalBinding = logicalBindings.get(current);
    if (logicalBinding) return logicalBinding;
    current = current.parentElement;
  }
  return null;
}
