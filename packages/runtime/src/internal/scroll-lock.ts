export type DocumentScrollLock = {
  release(): void;
};

type BodyLockSnapshot = {
  overflow: string;
  overflowPriority: string;
  scrollbarWidth: string;
  scrollbarWidthPriority: string;
  hadLockMarker: boolean;
  lockMarkerValue: string | null;
};

type DocumentScrollLockState = {
  count: number;
  snapshot: BodyLockSnapshot;
};

const SCROLL_LOCK_ATTRIBUTE = "data-sw-scroll-locked";
const SCROLLBAR_WIDTH_PROPERTY = "--sw-scrollbar-width";
const documentLocks = new WeakMap<Document, DocumentScrollLockState>();

export function lockDocumentScroll(ownerDocument: Document = document): DocumentScrollLock {
  const body = ownerDocument.body;
  const existingState = documentLocks.get(ownerDocument);

  if (existingState) {
    existingState.count += 1;
    return createReleaseHandle(ownerDocument);
  }

  documentLocks.set(ownerDocument, {
    count: 1,
    snapshot: captureBodyLockSnapshot(body),
  });
  applyBodyScrollLock(ownerDocument);

  return createReleaseHandle(ownerDocument);
}

function createReleaseHandle(ownerDocument: Document): DocumentScrollLock {
  let released = false;

  return {
    release() {
      if (released) return;
      released = true;

      const state = documentLocks.get(ownerDocument);
      if (!state) return;

      state.count -= 1;
      if (state.count > 0) return;

      documentLocks.delete(ownerDocument);
      restoreBodyLockSnapshot(ownerDocument.body, state.snapshot);
    },
  };
}

function captureBodyLockSnapshot(body: HTMLElement): BodyLockSnapshot {
  return {
    overflow: body.style.overflow,
    overflowPriority: body.style.getPropertyPriority("overflow"),
    scrollbarWidth: body.style.getPropertyValue(SCROLLBAR_WIDTH_PROPERTY),
    scrollbarWidthPriority: body.style.getPropertyPriority(SCROLLBAR_WIDTH_PROPERTY),
    hadLockMarker: body.hasAttribute(SCROLL_LOCK_ATTRIBUTE),
    lockMarkerValue: body.getAttribute(SCROLL_LOCK_ATTRIBUTE),
  };
}

function applyBodyScrollLock(ownerDocument: Document): void {
  const body = ownerDocument.body;

  body.style.overflow = "hidden";
  body.style.setProperty(SCROLLBAR_WIDTH_PROPERTY, `${getScrollbarWidth(ownerDocument)}px`);
  body.setAttribute(SCROLL_LOCK_ATTRIBUTE, "");
}

function restoreBodyLockSnapshot(body: HTMLElement, snapshot: BodyLockSnapshot): void {
  if (snapshot.overflow) {
    body.style.setProperty("overflow", snapshot.overflow, snapshot.overflowPriority);
  } else {
    body.style.removeProperty("overflow");
  }

  if (snapshot.scrollbarWidth) {
    body.style.setProperty(
      SCROLLBAR_WIDTH_PROPERTY,
      snapshot.scrollbarWidth,
      snapshot.scrollbarWidthPriority,
    );
  } else {
    body.style.removeProperty(SCROLLBAR_WIDTH_PROPERTY);
  }

  if (snapshot.hadLockMarker) {
    body.setAttribute(SCROLL_LOCK_ATTRIBUTE, snapshot.lockMarkerValue ?? "");
  } else {
    body.removeAttribute(SCROLL_LOCK_ATTRIBUTE);
  }
}

function getScrollbarWidth(ownerDocument: Document): number {
  const viewportWidth = ownerDocument.defaultView?.innerWidth ?? 0;
  const documentWidth = ownerDocument.documentElement.clientWidth;

  return Math.max(0, viewportWidth - documentWidth);
}
