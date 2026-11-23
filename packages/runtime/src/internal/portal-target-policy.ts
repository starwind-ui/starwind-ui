export type PortalPlacementMode = "framework" | "runtime";

export type PortalPlacementFacts = {
  disabled: boolean;
  mode: PortalPlacementMode;
  ready: boolean;
  target: HTMLElement;
  wrapper: HTMLElement;
};

export type ResolvePortalPlacementOptions = {
  container?: Element | string | null;
  disabled?: boolean;
  fallbackTarget?: HTMLElement;
  mode?: PortalPlacementMode;
  reference?: Element | null;
};

export type ResolveFloatingPortalTargetOptions = {
  dialogFloatingHostSelector?: string;
  explicitReferences?: readonly (Element | null)[];
  explicitTargets?: readonly (Element | null)[];
  floatingRootSelector?: string;
};

const DEFAULT_FLOATING_ROOT_SELECTOR = "[data-floating-root]";
const DEFAULT_DIALOG_FLOATING_HOST_SELECTOR =
  'dialog[data-slot="dialog-content"], dialog[data-slot="sheet-content"], dialog[data-slot="drawer-content"], dialog[data-sw-dialog-content]';
const dialogTopLayerFloatingRoots = new WeakMap<HTMLDialogElement, HTMLElement>();

function acceptsNativeGetter(
  element: Element | null | undefined,
  ownerDocument: Document,
  kind: "html" | "dialog",
): boolean {
  if (!element) return false;
  try {
    if (element.ownerDocument !== ownerDocument) return false;
    const Constructor =
      kind === "dialog"
        ? (ownerDocument.defaultView?.HTMLDialogElement ?? HTMLDialogElement)
        : (ownerDocument.defaultView?.HTMLElement ?? HTMLElement);
    const getter = Object.getOwnPropertyDescriptor(
      Constructor.prototype,
      kind === "dialog" ? "open" : "dir",
    )?.get;
    if (!getter) return false;
    getter.call(element);
    return true;
  } catch {
    return false;
  }
}

export function isDocumentHTMLElement(
  element: Element | null | undefined,
  ownerDocument: Document,
): element is HTMLElement {
  return acceptsNativeGetter(element, ownerDocument, "html");
}

function isHTMLElement(element: Element | null | undefined): element is HTMLElement {
  return Boolean(element && isDocumentHTMLElement(element, element.ownerDocument));
}

function isHTMLDialogElement(element: Element | null | undefined): element is HTMLDialogElement {
  return Boolean(element && acceptsNativeGetter(element, element.ownerDocument, "dialog"));
}

export function registerDialogTopLayerFloatingRoot(
  owner: HTMLDialogElement,
  floatingRoot: HTMLElement,
): () => void {
  dialogTopLayerFloatingRoots.set(owner, floatingRoot);
  return () => {
    if (dialogTopLayerFloatingRoots.get(owner) === floatingRoot) {
      dialogTopLayerFloatingRoots.delete(owner);
    }
  };
}

export function resolveFloatingPortalTarget(
  reference: Element | null,
  options: ResolveFloatingPortalTargetOptions = {},
): HTMLElement {
  const {
    dialogFloatingHostSelector = DEFAULT_DIALOG_FLOATING_HOST_SELECTOR,
    explicitReferences = [],
    explicitTargets = [],
    floatingRootSelector = DEFAULT_FLOATING_ROOT_SELECTOR,
  } = options;

  const dialogOwner = resolveFloatingPortalOwner(reference, { dialogFloatingHostSelector });
  const dialogHost = dialogOwner ? dialogTopLayerFloatingRoots.get(dialogOwner) : null;
  if (dialogHost) return dialogHost;

  const explicitTarget = [
    ...explicitTargets.map((target) => resolveExplicitPortalTarget(target, reference)),
    ...explicitReferences.map((explicitReference) =>
      resolveExplicitFloatingPortalTarget(explicitReference, reference, floatingRootSelector),
    ),
  ].find(
    (target): target is HTMLElement =>
      target !== null &&
      (!dialogOwner ||
        resolveFloatingPortalOwner(target, { dialogFloatingHostSelector }) === dialogOwner),
  );
  if (explicitTarget) return explicitTarget;

  if (dialogOwner) {
    const authoredFloatingRoot = Array.from(dialogOwner.children).find(
      (child): child is HTMLElement =>
        isHTMLElement(child) &&
        child.matches(floatingRootSelector) &&
        !child.hasAttribute("data-sw-floating-root"),
    );
    if (authoredFloatingRoot) return authoredFloatingRoot;

    return dialogOwner;
  }

  const currentFloatingRoot = reference?.closest(floatingRootSelector);
  if (isHTMLElement(currentFloatingRoot)) return currentFloatingRoot;

  return reference?.ownerDocument.body ?? document.body;
}

export function resolveFloatingPortalOwner(
  reference: Element | null,
  options: Pick<ResolveFloatingPortalTargetOptions, "dialogFloatingHostSelector"> = {},
): HTMLDialogElement | null {
  const { dialogFloatingHostSelector = DEFAULT_DIALOG_FLOATING_HOST_SELECTOR } = options;
  const dialogOwner = reference?.closest(dialogFloatingHostSelector);

  return isHTMLDialogElement(dialogOwner) ? dialogOwner : null;
}

export function resolveFloatingPortalTargetOwner(
  portalTarget: HTMLElement,
  options: ResolveFloatingPortalTargetOptions = {},
): HTMLDialogElement | null {
  const {
    dialogFloatingHostSelector = DEFAULT_DIALOG_FLOATING_HOST_SELECTOR,
    floatingRootSelector = DEFAULT_FLOATING_ROOT_SELECTOR,
  } = options;
  if (!portalTarget.matches(floatingRootSelector)) return null;

  const dialogOwner = portalTarget.closest(dialogFloatingHostSelector);
  return isHTMLDialogElement(dialogOwner) ? dialogOwner : null;
}

function resolveExplicitPortalTarget(
  target: Element | null,
  reference: Element | null,
): HTMLElement | null {
  if (!isHTMLElement(target) || !target.isConnected) return null;
  if (reference && target.ownerDocument !== reference.ownerDocument) return null;
  return target;
}

function resolveExplicitFloatingPortalTarget(
  explicitReference: Element | null,
  reference: Element | null,
  floatingRootSelector: string,
): HTMLElement | null {
  if (
    !explicitReference?.isConnected ||
    (reference && explicitReference.ownerDocument !== reference.ownerDocument)
  )
    return null;

  let current: Element | null = explicitReference;
  while (current) {
    const target: Element | null = current.closest(floatingRootSelector);
    if (!target) return null;
    if (isHTMLElement(target) && !target.hasAttribute("data-sw-floating-root")) {
      return target;
    }
    current = target.parentElement;
  }

  return null;
}
