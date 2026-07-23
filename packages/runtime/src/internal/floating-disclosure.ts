import { type FloatingPositioner } from "./floating";
import { createFloatingPortalSession } from "./floating-portal";
import { type OverlayDismissalHandle, registerOverlayDismissal } from "./overlay-dismissal";
import { hideElementAfterAnimations } from "./presence";
import { type DocumentScrollLock } from "./scroll-lock";

export type FloatingDisclosureLifecycle<TRequest> = {
  applyOpenState(
    open: boolean,
    request: TRequest | undefined,
    options?: FloatingDisclosureApplyOptions,
  ): void;
  destroy(): void;
};

export type FloatingDisclosureApplyOptions = {
  captureFocusFallback?: boolean;
};

export type FloatingDisclosurePositionOptions = {
  avoidCollisions?: boolean;
};

export type FloatingDisclosureLifecycleOptions<TRequest> = {
  backdrop?: HTMLElement | null;
  clearFloatingStyles?: () => void;
  closeOnEscape?: () => boolean;
  closeOnOutsideInteract?: () => boolean;
  containsTarget: (target: Node) => boolean;
  createFloatingPositioner: (
    reference: HTMLElement,
    options?: FloatingDisclosurePositionOptions,
  ) => FloatingPositioner;
  getFloatingReference: () => HTMLElement | null;
  getOpen: () => boolean;
  getPortalElement?: () => HTMLElement;
  getPortalTarget: () => HTMLElement;
  isOpenControlled?: () => boolean;
  isDestroyed: () => boolean;
  lockDocumentScroll?: (ownerDocument: Document) => DocumentScrollLock;
  onBeforeClose?: (context: FloatingDisclosureLifecycleContext<TRequest>) => void;
  onBeforeOpen?: (
    context: FloatingDisclosureLifecycleContext<TRequest> & FloatingDisclosureApplyOptions,
  ) => void;
  onCloseComplete?: (context: FloatingDisclosureLifecycleContext<TRequest>) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onImmediateClose?: (context: FloatingDisclosureLifecycleContext<TRequest>) => void;
  onOpenFrame?: (context: FloatingDisclosureLifecycleContext<TRequest>) => void;
  onOwnerCloseRequest?: () => void;
  onOutsidePointerDown?: (event: PointerEvent) => void;
  popup: HTMLElement;
  renderState: (open: boolean, closeSignal?: AbortSignal) => void;
  root: HTMLElement;
  shouldLockDocumentScroll?: (request: TRequest | undefined) => boolean;
  forceUncontrolledOwnerClose?: () => void;
};

export type FloatingDisclosureLifecycleContext<TRequest> = {
  request: TRequest | undefined;
};

export function createFloatingDisclosureLifecycle<TRequest>(
  options: FloatingDisclosureLifecycleOptions<TRequest>,
): FloatingDisclosureLifecycle<TRequest> {
  let bodyScrollLock: DocumentScrollLock | null = null;
  let closeAbortController: AbortController | null = null;
  let dismissalHandle: OverlayDismissalHandle | null = null;
  let floatingPositioner: FloatingPositioner | null = null;
  let floatingReference: HTMLElement | null = null;
  let rendered = false;

  const getPortalElement = () => options.getPortalElement?.() ?? options.popup;
  const portalSession = createFloatingPortalSession({
    canPromote: options.getOpen,
    getPortalElement,
    getPortalTarget: options.getPortalTarget,
    onOwnerCloseRequest: () => {
      options.onOwnerCloseRequest?.();
      if (options.isOpenControlled?.() === false && options.getOpen()) {
        options.forceUncontrolledOwnerClose?.();
      }
    },
    root: options.root,
  });

  const unregisterDismissal = () => {
    dismissalHandle?.destroy();
    dismissalHandle = null;
  };

  const releaseBodyScrollLock = () => {
    bodyScrollLock?.release();
    bodyScrollLock = null;
  };

  const clearFloatingStyles = () => {
    options.clearFloatingStyles?.();
  };

  const restorePortal = () => {
    portalSession.restore();
    clearFloatingStyles();
  };

  const getFloatingPositioner = (
    positionOptions: FloatingDisclosurePositionOptions = {},
  ): FloatingPositioner | null => {
    const reference = options.getFloatingReference();
    if (!reference) return null;

    if (floatingPositioner && floatingReference === reference) {
      return floatingPositioner;
    }

    floatingPositioner?.destroy();
    floatingReference = reference;
    floatingPositioner = options.createFloatingPositioner(reference, positionOptions);

    return floatingPositioner;
  };

  const position = (positionOptions: FloatingDisclosurePositionOptions = {}) => {
    if (!options.getOpen()) return;

    void getFloatingPositioner(positionOptions)?.update();
  };

  const setupAutoUpdate = () => {
    getFloatingPositioner()?.startAutoUpdate();
  };

  const registerDismissal = () => {
    if (dismissalHandle) return;
    if (!options.closeOnEscape?.() && !options.closeOnOutsideInteract?.()) return;

    dismissalHandle = registerOverlayDismissal({
      contains: options.containsTarget,
      floating: getPortalElement(),
      onEscapeKeyDown: options.closeOnEscape?.()
        ? (event) => {
            options.onEscapeKeyDown?.(event);
          }
        : undefined,
      onOutsidePointerDown: options.closeOnOutsideInteract?.()
        ? (event) => {
            options.onOutsidePointerDown?.(event);
          }
        : undefined,
      root: options.root,
    });
  };

  const acquireBodyScrollLock = (request: TRequest | undefined) => {
    if (
      !options.lockDocumentScroll ||
      !options.shouldLockDocumentScroll?.(request) ||
      bodyScrollLock
    ) {
      return;
    }

    bodyScrollLock = options.lockDocumentScroll(options.root.ownerDocument);
  };

  const abortPendingClose = () => {
    closeAbortController?.abort();
    closeAbortController = null;
  };

  return {
    applyOpenState(open, request, applyOptions = {}) {
      abortPendingClose();

      if (open) {
        acquireBodyScrollLock(request);
        options.onBeforeOpen?.({ request, ...applyOptions });
        options.renderState(true);
        portalSession.mount();
        registerDismissal();
        position();
        setupAutoUpdate();
        requestAnimationFrame(() => {
          if (!options.getOpen() || options.isDestroyed()) return;
          position();
          options.onOpenFrame?.({ request });
        });
      } else if (!rendered) {
        options.onBeforeClose?.({ request });
        unregisterDismissal();
        releaseBodyScrollLock();
        options.renderState(false);
        options.popup.hidden = true;
        options.backdrop?.setAttribute("hidden", "");
        options.onImmediateClose?.({ request });
      } else {
        options.onBeforeClose?.({ request });
        unregisterDismissal();
        releaseBodyScrollLock();
        const nextCloseAbortController = new AbortController();
        closeAbortController = nextCloseAbortController;
        options.renderState(false, nextCloseAbortController.signal);
        hideElementAfterAnimations(options.popup, {
          signal: nextCloseAbortController.signal,
          onHidden: () => {
            if (nextCloseAbortController.signal.aborted) return;
            floatingPositioner?.stopAutoUpdate();
            restorePortal();
            if (closeAbortController === nextCloseAbortController) {
              closeAbortController = null;
            }
            options.onCloseComplete?.({ request });
          },
        });
      }

      rendered = true;
    },
    destroy() {
      abortPendingClose();
      unregisterDismissal();
      releaseBodyScrollLock();
      floatingPositioner?.destroy();
      floatingPositioner = null;
      floatingReference = null;
      portalSession.destroy();
      clearFloatingStyles();
      rendered = false;
    },
  };
}
