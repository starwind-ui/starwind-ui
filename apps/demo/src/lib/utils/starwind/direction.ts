export function readDirection(element: Element): "ltr" | "rtl" {
  return element.ownerDocument.defaultView!.getComputedStyle(element).direction === "rtl"
    ? "rtl"
    : "ltr";
}

/** Watch the inherited scope only while a gesture, engine or moved surface owns it. */
export function watchDirection(owner: HTMLElement, changed: () => void): () => void {
  const view = owner.ownerDocument.defaultView!;
  let last = readDirection(owner);
  const refresh = () => {
    const next = readDirection(owner);
    if (next !== last) {
      last = next;
      changed();
    }
  };
  const observer = new view.MutationObserver((records) => {
    if (!owner.isConnected) {
      stop();
      return;
    }
    if (records.some((r) => r.type === "childList" || r.attributeName === "dir")) bind();
    refresh();
  });
  function bind() {
    observer.disconnect();
    for (let element: HTMLElement | null = owner; element; element = element.parentElement) {
      const auto = element.dir === "auto";
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["dir", "class", "style"],
        childList: true,
        subtree: auto,
        characterData: auto,
      });
    }
  }
  bind();
  view.addEventListener("resize", refresh);
  function stop() {
    observer.disconnect();
    view.removeEventListener("resize", refresh);
  }
  return stop;
}

const movedScopes = new WeakMap<HTMLElement, () => void>();

/** An authored popup direction takes precedence, including writes while the popup is open. */
export function keepPortalDirection(
  owner: HTMLElement,
  popup: HTMLElement,
  reposition: () => void,
) {
  const view = owner.ownerDocument.defaultView!;
  let authored = popup.getAttribute("dir");
  const ownWrites = new view.MutationObserver(() => {
    authored = popup.getAttribute("dir");
    project();
    reposition();
  });
  function project() {
    if (ownWrites.takeRecords().length) authored = popup.getAttribute("dir");
    if (authored !== null) return;
    // An event can run in the task that changed an ancestor of a nested portal.
    for (let ancestor: HTMLElement | null = owner; ancestor; ancestor = ancestor.parentElement) {
      const syncParent = movedScopes.get(ancestor);
      if (syncParent) {
        syncParent();
        break;
      }
    }
    const direction = readDirection(owner);
    if (popup.getAttribute("dir") !== direction) {
      popup.setAttribute("dir", direction);
      ownWrites.takeRecords();
    }
  }
  ownWrites.observe(popup, { attributes: true, attributeFilter: ["dir"] });
  project();
  movedScopes.set(popup, project);
  const stopOwner = watchDirection(owner, () => {
    project();
    reposition();
  });
  const stopPopup = watchDirection(popup, reposition);
  return {
    sync: project,
    destroy() {
      movedScopes.delete(popup);
      if (ownWrites.takeRecords().length) authored = popup.getAttribute("dir");
      ownWrites.disconnect();
      stopOwner();
      stopPopup();
      if (authored === null) popup.removeAttribute("dir");
    },
  };
}
