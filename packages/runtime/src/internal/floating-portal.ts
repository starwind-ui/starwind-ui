import {
  registerDialogOwnedPortal,
  requestDialogOwnedFloatingPortalClose,
  resumeDialogOwnedFloatingPortals,
  suspendDialogOwnedFloatingPortals,
  type DialogOwnedPortal,
} from "./dialog-portal-owner";
import {
  createPortalBinding,
  getReportedPortalPlacement,
  pendingPortalBindingSnapshot,
  readyPortalBindingSnapshot,
  reportPortalPlacement,
  subscribeToReportedPortalPlacement,
  type ReportPortalPlacementOptions,
  type PortalBinding,
  type PortalBindingSnapshot,
  type RuntimePartScope,
} from "./portal-binding";
import { createRuntimePortalPlacement } from "./portal-runtime-placement";
import {
  resolveFloatingPortalOwner,
  resolveFloatingPortalTarget,
  resolveFloatingPortalTargetOwner,
  type PortalPlacementFacts,
  type PortalPlacementMode,
  type ResolvePortalPlacementOptions,
} from "./portal-target-policy";

export {
  createPortalBinding,
  pendingPortalBindingSnapshot,
  readyPortalBindingSnapshot,
  reportPortalPlacement,
  type PortalBinding,
  type PortalBindingSnapshot,
  type RuntimePartScope,
  type ReportPortalPlacementOptions,
  type PortalPlacementFacts,
  type PortalPlacementMode,
  type ResolvePortalPlacementOptions,
};

export type FloatingPortalSession = {
  demote(): void;
  destroy(): void;
  isReady(): boolean;
  mount(): boolean;
  onReady(callback: () => void): () => void;
  onReadyChange(callback: (ready: boolean) => void): () => void;
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

export function resolvePortalPlacement(
  wrapper: HTMLElement,
  options: ResolvePortalPlacementOptions = {},
): PortalPlacementFacts {
  const disabled = options.disabled ?? wrapper.hasAttribute("data-disabled");
  const mode = options.mode ?? readPortalPlacementMode(wrapper);
  const reference = options.reference ?? wrapper;
  const attributeContainer = wrapper.getAttribute("data-container");
  const container = options.container ?? attributeContainer;
  const hasExplicitContainerIntent =
    options.container != null
      ? typeof options.container !== "string" || Boolean(options.container.trim())
      : Boolean(attributeContainer?.trim());
  const resolvedContainer = resolvePortalContainer(wrapper.ownerDocument, container);
  const explicitTarget =
    resolvedContainer && !wrapper.contains(resolvedContainer) ? resolvedContainer : null;
  const fallbackTarget = options.fallbackTarget ?? resolveFloatingPortalTarget(reference);
  const resolvedExplicitTarget = explicitTarget
    ? resolveFloatingPortalTarget(reference, { explicitTargets: [explicitTarget] })
    : null;
  const runtimeTarget =
    explicitTarget && resolvedExplicitTarget === explicitTarget
      ? resolvedExplicitTarget
      : fallbackTarget;
  const report = mode === "framework" ? getReportedPortalPlacement(wrapper) : undefined;
  const explicitContainerTarget = hasExplicitContainerIntent
    ? explicitTarget && resolvedExplicitTarget === explicitTarget
      ? resolvedExplicitTarget
      : null
    : undefined;
  const reportedTarget = Object.hasOwn(options, "container")
    ? null
    : resolveFrameworkReportedTarget(wrapper, report, reference, explicitContainerTarget);
  const target = reportedTarget ?? runtimeTarget;
  const ready =
    disabled ||
    mode === "runtime" ||
    Boolean(report?.ready && report.target === target && wrapper.parentElement === target);

  return { disabled, mode, ready, target, wrapper };
}

export function createFloatingPortalSession(
  options: FloatingPortalSessionOptions,
): FloatingPortalSession {
  let destroyed = false;
  let frameworkPlacementCleanup: (() => void) | null = null;
  let mounted = false;
  let owner: HTMLDialogElement | null = null;
  let ownerCleanup: (() => void) | null = null;
  let ownerPlacementReady = true;
  let physicalPlacementReady = false;
  let placementReady = false;
  let portalTarget: HTMLElement | null = null;
  let mountedPortalElement: HTMLElement | null = null;
  let pointerEvents: { element: HTMLElement; priority: string; value: string } | null = null;
  const readyCallbacks = new Set<() => void>();
  const readinessChangeCallbacks = new Set<(ready: boolean) => void>();
  const initialPortalElement = options.getPortalElement();
  const runtimePlacement = createRuntimePortalPlacement(
    readPortalPlacementMode(initialPortalElement) === "runtime" ? initialPortalElement : undefined,
  );

  const ownedPortal: DialogOwnedPortal = {
    requestOwnerClose() {
      if (options.canPromote?.() === false) return;
      options.onOwnerCloseRequest?.();
    },
    resumeOwnerPlacement() {
      if (ownerPlacementReady) return;
      ownerPlacementReady = true;
      physicalPlacementReady = false;
      syncPlacementReady(options.getPortalElement());
      mount();
    },
    suspendOwnerPlacement() {
      if (!ownerPlacementReady) return;
      ownerPlacementReady = false;
      syncPlacementReady(options.getPortalElement());
    },
  };

  const session: FloatingPortalSession = {
    demote: () => undefined,
    destroy,
    isReady: () => placementReady,
    mount,
    onReady(callback) {
      readyCallbacks.add(callback);
      if (placementReady) callback();
      return () => readyCallbacks.delete(callback);
    },
    onReadyChange(callback) {
      readinessChangeCallbacks.add(callback);
      return () => readinessChangeCallbacks.delete(callback);
    },
    promote: () => undefined,
    restore,
  };

  function mount(): boolean {
    if (destroyed) return false;

    const wasMounted = mounted;
    const portalElement = options.getPortalElement();
    const requestedTarget = options.getPortalTarget();
    const placement = resolvePortalPlacement(portalElement, {
      disabled: portalElement.hasAttribute("data-disabled"),
      fallbackTarget: resolveFloatingPortalTarget(options.root, {
        explicitTargets: [requestedTarget],
      }),
      mode: readPortalPlacementMode(portalElement),
      reference: options.root,
    });
    const nextOwner =
      resolveFloatingPortalTargetOwner(placement.target) ??
      resolveFloatingPortalOwner(placement.target) ??
      resolveFloatingPortalTargetOwner(portalElement);
    const changed =
      wasMounted &&
      (mountedPortalElement !== portalElement ||
        portalTarget !== placement.target ||
        owner !== nextOwner);
    if (changed) {
      runtimePlacement.restore();
      frameworkPlacementCleanup?.();
      frameworkPlacementCleanup = null;
      restorePointerEvents();
    }

    mountedPortalElement = portalElement;
    portalTarget = placement.target;
    mounted = true;
    if (!wasMounted || changed) setPhysicalPlacementReady(false, portalElement);
    registerOwner(nextOwner);
    if (destroyed || portalTarget !== placement.target || owner !== nextOwner) return false;

    if (placement.disabled) {
      setPhysicalPlacementReady(true, portalElement);
      return true;
    }

    if (placement.mode === "framework") {
      subscribeToFrameworkPlacement(portalElement);
      syncFrameworkPlacement(portalElement, placement.target);
      preservePointerEvents(portalElement);
      return placementReady;
    }

    runtimePlacement.move(portalElement, placement.target);
    preservePointerEvents(portalElement);
    setPhysicalPlacementReady(true, portalElement);
    return true;
  }

  function subscribeToFrameworkPlacement(portalElement: HTMLElement): void {
    if (frameworkPlacementCleanup) return;
    frameworkPlacementCleanup = subscribeToReportedPortalPlacement(portalElement, () => {
      if (mounted) mount();
    });
  }

  function syncFrameworkPlacement(portalElement: HTMLElement, expectedTarget: HTMLElement): void {
    const report = getReportedPortalPlacement(portalElement);
    setPhysicalPlacementReady(
      Boolean(
        report?.ready &&
        report.target === expectedTarget &&
        portalElement.parentElement === expectedTarget,
      ),
      portalElement,
    );
  }

  function setPhysicalPlacementReady(ready: boolean, portalElement: HTMLElement): void {
    physicalPlacementReady = ready;
    syncPlacementReady(portalElement);
  }

  function syncPlacementReady(portalElement: HTMLElement): void {
    const ready = physicalPlacementReady && ownerPlacementReady;
    portalElement.setAttribute("data-placement", ready ? "ready" : "pending");
    if (placementReady === ready) return;
    placementReady = ready;
    readinessChangeCallbacks.forEach((callback) => callback(ready));
    if (ready) readyCallbacks.forEach((callback) => callback());
  }

  function registerOwner(nextOwner: HTMLDialogElement | null): void {
    if (owner === nextOwner) return;
    ownerCleanup?.();
    ownerCleanup = null;
    owner = nextOwner;
    ownerPlacementReady = true;
    if (owner) ownerCleanup = registerDialogOwnedPortal(owner, ownedPortal);
    syncPlacementReady(options.getPortalElement());
  }

  function preservePointerEvents(portalElement: HTMLElement): void {
    if (!owner || pointerEvents) return;
    pointerEvents = {
      element: portalElement,
      priority: portalElement.style.getPropertyPriority("pointer-events"),
      value: portalElement.style.getPropertyValue("pointer-events"),
    };
    portalElement.style.setProperty("pointer-events", "auto");
  }

  function restorePointerEvents(): void {
    if (!pointerEvents) return;
    const { element: portalElement } = pointerEvents;
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

  function restore(): void {
    const portalElement = mountedPortalElement ?? options.getPortalElement();
    runtimePlacement.restore();
    portalTarget = null;
    mountedPortalElement = null;
    mounted = false;
    frameworkPlacementCleanup?.();
    frameworkPlacementCleanup = null;
    setPhysicalPlacementReady(false, portalElement);
    registerOwner(null);
    restorePointerEvents();
  }

  function destroy(): void {
    if (destroyed) return;
    restore();
    destroyed = true;
  }

  return session;
}

export function demoteDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  suspendDialogOwnedFloatingPortals(owner);
}

export function promoteDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  resumeDialogOwnedFloatingPortals(owner);
}

export { requestDialogOwnedFloatingPortalClose };

function resolveFrameworkReportedTarget(
  wrapper: HTMLElement,
  report: ReportPortalPlacementOptions | undefined,
  reference: Element | null,
  explicitContainerTarget: HTMLElement | null | undefined,
): HTMLElement | null {
  if (!report || wrapper.contains(report.target)) return null;
  if (explicitContainerTarget !== undefined && report.target !== explicitContainerTarget)
    return null;
  if (report.ready && wrapper.parentElement !== report.target) return null;

  const resolvedTarget = resolveFloatingPortalTarget(reference, {
    explicitTargets: [report.target],
  });
  if (resolvedTarget === report.target) return report.target;
  if (report.ready && report.target === wrapper.parentElement && resolvedTarget.contains(wrapper)) {
    return report.target;
  }
  return null;
}

function resolvePortalContainer(
  ownerDocument: Document,
  container: Element | string | null | undefined,
): Element | null {
  if (typeof container !== "string") {
    if (!container) return null;
    const ElementConstructor = ownerDocument.defaultView?.Element;
    if (ElementConstructor) return container instanceof ElementConstructor ? container : null;
    return container.ownerDocument === ownerDocument && container.nodeType === 1 ? container : null;
  }
  if (!container) return null;
  try {
    return ownerDocument.querySelector(container);
  } catch {
    return null;
  }
}

function readPortalPlacementMode(wrapper: HTMLElement): PortalPlacementMode {
  return wrapper.getAttribute("data-sw-portal-placement") === "framework" ? "framework" : "runtime";
}
