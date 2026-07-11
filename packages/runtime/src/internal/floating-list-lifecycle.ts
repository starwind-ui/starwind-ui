import { type FloatingPositioner } from "./floating";
import { type OverlayDismissalHandle, registerOverlayDismissal } from "./overlay-dismissal";
import {
  type OverlayOpenChangeDetails,
  type OverlayOpenChangeRequest,
  type OverlayOpenChangeShellContext,
  type OverlayOpenChangeShellOptions,
  type OverlayOpenChangeShellResult,
  runOverlayOpenChangeShell,
} from "./overlay-open-change";
import { hideElementAfterAnimations } from "./presence";
import { type DocumentScrollLock } from "./scroll-lock";

export type FloatingListLifecycle<TRequest> = {
  applyOpenState(open: boolean, request: TRequest | undefined): void;
  destroy(): void;
  startAutoUpdate(): void;
  stopAutoUpdate(): void;
  syncScrollLock(request: TRequest | undefined): void;
  updatePosition(): void;
};

export type FloatingListLifecycleOptions<TRequest> = {
  dismissal?: FloatingListDismissalOptions;
  floating?: FloatingListFloatingOptions;
  hooks?: FloatingListLifecycleHooks<TRequest>;
  popup: HTMLElement;
  portal: FloatingListPortalOptions;
  root: HTMLElement;
  scrollLock?: FloatingListScrollLockOptions<TRequest>;
  state: FloatingListStateOptions;
};

export type FloatingListStateOptions = {
  getOpen: () => boolean;
  isDestroyed: () => boolean;
  render: (open: boolean, closeSignal?: AbortSignal) => void;
};

export type FloatingListPortalOptions = {
  clearFloatingStyles?: () => void;
  containsTarget: (target: Node) => boolean;
  getElement?: () => HTMLElement;
  getTarget: () => HTMLElement;
};

export type FloatingListDismissalOptions = {
  closeOnEscape?: () => boolean;
  closeOnOutsideInteract?: () => boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onOutsidePointerDown?: (event: PointerEvent) => void;
};

export type FloatingListFloatingOptions = {
  createPositioner: (reference: HTMLElement) => FloatingPositioner;
  getReference: () => HTMLElement | null;
  shouldUse?: () => boolean;
};

export type FloatingListScrollLockOptions<TRequest> = {
  lockDocumentScroll: (ownerDocument: Document) => DocumentScrollLock;
  shouldLock: (request: TRequest | undefined) => boolean;
};

export type FloatingListLifecycleHooks<TRequest> = {
  onAfterOpen?: (context: FloatingListLifecycleContext<TRequest>) => void;
  onBeforeClose?: (context: FloatingListLifecycleContext<TRequest>) => void;
  onBeforeOpen?: (context: FloatingListLifecycleContext<TRequest>) => void;
  onCloseComplete?: (context: FloatingListLifecycleContext<TRequest>) => void;
  onImmediateClose?: (context: FloatingListLifecycleContext<TRequest>) => void;
  onOpenFrame?: (context: FloatingListLifecycleContext<TRequest>) => void;
};

export type FloatingListLifecycleContext<TRequest> = {
  request: TRequest | undefined;
};

export type FloatingListOpenChangeShellOptions<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
  TDetails extends OverlayOpenChangeDetails<TReason> = OverlayOpenChangeDetails<TReason>,
> = Omit<
  OverlayOpenChangeShellOptions<TReason, TRequest, TDetails>,
  "onApplyControlledOpenState" | "onApplyUncontrolledOpenState"
> & {
  lifecycle: FloatingListLifecycle<TRequest>;
  onAfterApplyOpenState?: (
    context: OverlayOpenChangeShellContext<TReason, TRequest, TDetails>,
  ) => void;
  onBeforeApplyOpenState?: (
    context: OverlayOpenChangeShellContext<TReason, TRequest, TDetails>,
  ) => void;
  onCommitUncontrolledOpenState?: (
    context: OverlayOpenChangeShellContext<TReason, TRequest, TDetails>,
  ) => void;
};

export function runFloatingListOpenChangeShell<
  TReason extends string,
  TRequest extends OverlayOpenChangeRequest<TReason, unknown>,
  TDetails extends OverlayOpenChangeDetails<TReason> = OverlayOpenChangeDetails<TReason>,
>(
  options: FloatingListOpenChangeShellOptions<TReason, TRequest, TDetails>,
): OverlayOpenChangeShellResult<TDetails> {
  return runOverlayOpenChangeShell({
    ...options,
    onApplyControlledOpenState: (context) => {
      options.onBeforeApplyOpenState?.(context);
      options.lifecycle.applyOpenState(context.open, context.request);
      options.onAfterApplyOpenState?.(context);
    },
    onApplyUncontrolledOpenState: (context) => {
      options.onBeforeApplyOpenState?.(context);
      options.onCommitUncontrolledOpenState?.(context);
      options.lifecycle.applyOpenState(context.open, context.request);
      options.onAfterApplyOpenState?.(context);
    },
  });
}

export function createFloatingListLifecycle<TRequest>(
  options: FloatingListLifecycleOptions<TRequest>,
): FloatingListLifecycle<TRequest> {
  let bodyScrollLock: DocumentScrollLock | null = null;
  let closeAbortController: AbortController | null = null;
  let destroyed = false;
  let dismissalHandle: OverlayDismissalHandle | null = null;
  let floatingPositioner: FloatingPositioner | null = null;
  let floatingReference: HTMLElement | null = null;
  let openedOnce = false;
  let placeholder: Comment | null = null;

  const getPortalElement = () => options.portal.getElement?.() ?? options.popup;

  const unregisterDismissal = () => {
    dismissalHandle?.destroy();
    dismissalHandle = null;
  };

  const releaseBodyScrollLock = () => {
    bodyScrollLock?.release();
    bodyScrollLock = null;
  };

  const abortPendingClose = () => {
    closeAbortController?.abort();
    closeAbortController = null;
  };

  const unportal = () => {
    if (!placeholder) return;

    placeholder.parentNode?.insertBefore(getPortalElement(), placeholder);
    placeholder.remove();
    placeholder = null;
    options.portal.clearFloatingStyles?.();
  };

  const portal = () => {
    const portalElement = getPortalElement();
    const portalTarget = options.portal.getTarget();

    if (portalElement.parentElement === portalTarget) return;

    if (!placeholder) {
      placeholder = options.root.ownerDocument.createComment("floating-list-placeholder");
      portalElement.parentNode?.insertBefore(placeholder, portalElement);
    }

    portalTarget.append(portalElement);
  };

  const getFloatingPositioner = (): FloatingPositioner | null => {
    const floating = options.floating;
    if (!floating) return null;
    if (floating.shouldUse?.() === false) return null;

    const reference = floating.getReference();
    if (!reference) return null;

    if (floatingPositioner && floatingReference === reference) {
      return floatingPositioner;
    }

    floatingPositioner?.destroy();
    floatingReference = reference;
    floatingPositioner = floating.createPositioner(reference);
    return floatingPositioner;
  };

  const updatePosition = () => {
    if (!options.state.getOpen()) return;

    void getFloatingPositioner()?.update();
  };

  const stopAutoUpdate = () => {
    floatingPositioner?.stopAutoUpdate();
  };

  const registerDismissal = () => {
    if (dismissalHandle) return;

    const dismissal = options.dismissal;
    const closeOnEscape = dismissal?.closeOnEscape?.() ?? false;
    const closeOnOutsideInteract = dismissal?.closeOnOutsideInteract?.() ?? false;
    if (!closeOnEscape && !closeOnOutsideInteract) return;

    dismissalHandle = registerOverlayDismissal({
      contains: options.portal.containsTarget,
      floating: getPortalElement(),
      onEscapeKeyDown: closeOnEscape
        ? (event) => {
            dismissal?.onEscapeKeyDown?.(event);
            return true;
          }
        : undefined,
      onOutsidePointerDown: closeOnOutsideInteract
        ? (event) => {
            dismissal?.onOutsidePointerDown?.(event);
          }
        : undefined,
      root: options.root,
    });
  };

  const acquireBodyScrollLock = (request: TRequest | undefined) => {
    const scrollLock = options.scrollLock;
    if (!scrollLock || bodyScrollLock || !scrollLock.shouldLock(request)) return;

    bodyScrollLock = scrollLock.lockDocumentScroll(options.root.ownerDocument);
  };

  const syncBodyScrollLock = (request: TRequest | undefined) => {
    const scrollLock = options.scrollLock;
    if (!scrollLock || !options.state.getOpen() || options.state.isDestroyed()) {
      releaseBodyScrollLock();
      return;
    }

    if (scrollLock.shouldLock(request)) {
      acquireBodyScrollLock(request);
      return;
    }

    releaseBodyScrollLock();
  };

  return {
    applyOpenState(open, request) {
      destroyed = false;
      abortPendingClose();

      if (open) {
        acquireBodyScrollLock(request);
        options.hooks?.onBeforeOpen?.({ request });
        options.state.render(true);
        portal();
        registerDismissal();
        options.hooks?.onAfterOpen?.({ request });
        updatePosition();
        getFloatingPositioner()?.startAutoUpdate();
        requestAnimationFrame(() => {
          if (destroyed || !options.state.getOpen() || options.state.isDestroyed()) return;

          updatePosition();
          options.hooks?.onOpenFrame?.({ request });
        });
        openedOnce = true;
        return;
      }

      options.hooks?.onBeforeClose?.({ request });
      unregisterDismissal();
      releaseBodyScrollLock();
      stopAutoUpdate();

      if (!openedOnce) {
        options.state.render(false);
        options.popup.hidden = true;
        options.hooks?.onImmediateClose?.({ request });
        return;
      }

      const nextCloseAbortController = new AbortController();
      closeAbortController = nextCloseAbortController;
      options.state.render(false, nextCloseAbortController.signal);
      hideElementAfterAnimations(options.popup, {
        signal: nextCloseAbortController.signal,
        onHidden: () => {
          if (nextCloseAbortController.signal.aborted) return;

          unportal();
          if (closeAbortController === nextCloseAbortController) {
            closeAbortController = null;
          }
          options.hooks?.onCloseComplete?.({ request });
        },
      });
    },
    destroy() {
      destroyed = true;
      abortPendingClose();
      unregisterDismissal();
      releaseBodyScrollLock();
      stopAutoUpdate();
      floatingPositioner?.destroy();
      floatingPositioner = null;
      floatingReference = null;
      unportal();
      openedOnce = false;
    },
    startAutoUpdate() {
      getFloatingPositioner()?.startAutoUpdate();
    },
    stopAutoUpdate,
    syncScrollLock(request) {
      syncBodyScrollLock(request);
    },
    updatePosition,
  };
}
