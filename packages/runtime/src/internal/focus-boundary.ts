const documentTabStopSelector = [
  "a[href]",
  "area[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  "iframe",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

export type FocusBoundaryDeparture = {
  activeElement: Element | null;
  lastFocusOwner: HTMLElement | null;
};

export type FocusBoundaryOptions = {
  containsTarget: (target: Node) => boolean;
  onFocusDeparture: (departure: FocusBoundaryDeparture) => void;
  ownerDocument: Document;
  surfaces: Iterable<HTMLElement | null>;
};

export type FocusBoundaryHandle = {
  destroy(): void;
  setLastFocusOwner(element: HTMLElement | null): void;
  setSurfaces(surfaces: Iterable<HTMLElement | null>): void;
  suppressNextDeparture(): void;
};

export function getNextDocumentTabStop(
  logicalOwner: HTMLElement,
  excludedSurfaces: Iterable<HTMLElement | null> = [],
): HTMLElement | null {
  const ownerDocument = logicalOwner.ownerDocument;
  if (!logicalOwner.isConnected || !ownerDocument.body.contains(logicalOwner)) return null;

  const excluded = Array.from(excludedSurfaces).filter(
    (surface): surface is HTMLElement => surface !== null,
  );
  const NodeConstructor = ownerDocument.defaultView?.Node ?? Node;
  const candidates = ownerDocument.querySelectorAll<HTMLElement>(documentTabStopSelector);

  for (const candidate of candidates) {
    if (!isEligibleFocusOwner(candidate, ownerDocument)) continue;
    if (logicalOwner.contains(candidate)) continue;
    if (excluded.some((surface) => surface.contains(candidate))) continue;
    if (
      !(
        logicalOwner.compareDocumentPosition(candidate) &
        NodeConstructor.DOCUMENT_POSITION_FOLLOWING
      )
    ) {
      continue;
    }

    return candidate;
  }

  return null;
}

export function createFocusBoundary(options: FocusBoundaryOptions): FocusBoundaryHandle {
  const { containsTarget, onFocusDeparture, ownerDocument } = options;
  const observedSurfaces = new Set<HTMLElement>();
  let destroyed = false;
  let lastFocusOwner: HTMLElement | null = null;
  let pendingCheck = false;
  let pendingCheckVersion = 0;
  let suppressionPending = false;
  let suppressionTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  const cancelPendingCheck = (): void => {
    if (!pendingCheck) return;

    pendingCheck = false;
    pendingCheckVersion += 1;
  };

  const handleFocusIn = (event: FocusEvent): void => {
    if (!isDocumentNode(event.target, ownerDocument) || !containsTarget(event.target)) return;
    cancelPendingCheck();
    if (!(event.target instanceof (ownerDocument.defaultView?.HTMLElement ?? HTMLElement))) return;

    const focusOwner = event.target as HTMLElement;
    if (isEligibleFocusOwner(focusOwner, ownerDocument, { allowNegativeTabIndex: true })) {
      lastFocusOwner = focusOwner;
    }
  };

  const runPendingCheck = (version: number): void => {
    if (destroyed || version !== pendingCheckVersion) return;
    pendingCheck = false;

    const activeElement = ownerDocument.activeElement;
    if (isDocumentNode(activeElement, ownerDocument) && containsTarget(activeElement)) return;

    if (suppressionPending) {
      clearSuppression();
      return;
    }

    const eligibleLastFocusOwner =
      lastFocusOwner &&
      isEligibleFocusOwner(lastFocusOwner, ownerDocument, { allowNegativeTabIndex: true })
        ? lastFocusOwner
        : null;

    onFocusDeparture({ activeElement, lastFocusOwner: eligibleLastFocusOwner });
  };

  const scheduleDepartureCheck = (): void => {
    if (destroyed || pendingCheck) return;

    pendingCheck = true;
    const version = ++pendingCheckVersion;
    queueMicrotask(() => runPendingCheck(version));
  };

  const handleFocusOut = (event: FocusEvent): void => {
    if (isDocumentNode(event.relatedTarget, ownerDocument) && containsTarget(event.relatedTarget)) {
      cancelPendingCheck();
      return;
    }

    scheduleDepartureCheck();
  };

  const setSurfaces = (surfaces: Iterable<HTMLElement | null>): void => {
    if (destroyed) return;

    const nextSurfaces = new Set(
      Array.from(surfaces).filter(
        (surface): surface is HTMLElement =>
          surface !== null && surface.ownerDocument === ownerDocument,
      ),
    );

    observedSurfaces.forEach((surface) => {
      if (nextSurfaces.has(surface)) return;
      surface.removeEventListener("focusin", handleFocusIn);
      surface.removeEventListener("focusout", handleFocusOut);
      observedSurfaces.delete(surface);
    });

    nextSurfaces.forEach((surface) => {
      if (observedSurfaces.has(surface)) return;
      surface.addEventListener("focusin", handleFocusIn);
      surface.addEventListener("focusout", handleFocusOut);
      observedSurfaces.add(surface);
    });
  };

  const clearSuppression = (): void => {
    suppressionPending = false;
    if (suppressionTimer === null) return;

    globalThis.clearTimeout(suppressionTimer);
    suppressionTimer = null;
  };

  setSurfaces(options.surfaces);

  return {
    destroy(): void {
      if (destroyed) return;

      destroyed = true;
      pendingCheck = false;
      pendingCheckVersion += 1;
      clearSuppression();
      observedSurfaces.forEach((surface) => {
        surface.removeEventListener("focusin", handleFocusIn);
        surface.removeEventListener("focusout", handleFocusOut);
      });
      observedSurfaces.clear();
      lastFocusOwner = null;
    },
    setLastFocusOwner(element): void {
      if (destroyed) return;

      lastFocusOwner =
        element && isEligibleFocusOwner(element, ownerDocument, { allowNegativeTabIndex: true })
          ? element
          : null;
    },
    setSurfaces,
    suppressNextDeparture(): void {
      if (destroyed) return;

      clearSuppression();
      suppressionPending = true;
      suppressionTimer = globalThis.setTimeout(() => {
        suppressionPending = false;
        suppressionTimer = null;
      }, 0);
    },
  };
}

function isEligibleFocusOwner(
  element: HTMLElement,
  ownerDocument: Document,
  options: { allowNegativeTabIndex?: boolean } = {},
): boolean {
  if (!isBaseFocusOwnerEligible(element, ownerDocument, options)) return false;
  if (!options.allowNegativeTabIndex && !isSequentialRadioTabStop(element, ownerDocument))
    return false;

  return true;
}

function isBaseFocusOwnerEligible(
  element: HTMLElement,
  ownerDocument: Document,
  options: { allowNegativeTabIndex?: boolean } = {},
): boolean {
  if (!element.isConnected || element.ownerDocument !== ownerDocument) return false;
  if (!options.allowNegativeTabIndex && element.tabIndex < 0) return false;
  if (element.localName === "input" && (element as HTMLInputElement).type === "hidden")
    return false;
  if (element.matches(":disabled") || element.getAttribute("aria-disabled") === "true")
    return false;
  if (element.closest("[inert]")) return false;
  if (!element.checkVisibility({ visibilityProperty: true })) return false;

  let current: HTMLElement | null = element;
  while (current) {
    if (current.hidden || current.getAttribute("aria-hidden") === "true") return false;
    current = current.parentElement;
  }

  return true;
}

function isSequentialRadioTabStop(element: HTMLElement, ownerDocument: Document): boolean {
  const InputConstructor = ownerDocument.defaultView?.HTMLInputElement ?? HTMLInputElement;
  if (!(element instanceof InputConstructor) || element.type !== "radio") return true;
  if (element.name === "" || element.checked) return true;

  return !Array.from(ownerDocument.querySelectorAll<HTMLInputElement>("input[type='radio']")).some(
    (radio) =>
      radio !== element &&
      radio.checked &&
      radio.name === element.name &&
      radio.form === element.form &&
      radio.getRootNode() === element.getRootNode() &&
      isBaseFocusOwnerEligible(radio, ownerDocument),
  );
}

function isDocumentNode(value: EventTarget | null, ownerDocument: Document): value is Node {
  const NodeConstructor = ownerDocument.defaultView?.Node ?? Node;
  return value instanceof NodeConstructor;
}
