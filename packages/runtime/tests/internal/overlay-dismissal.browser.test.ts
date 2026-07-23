import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerOverlayDismissal } from "../../src/internal/overlay-dismissal";

describe("overlay dismissal registry", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("treats a portaled overlay as inside each logical overlay owner", () => {
    const parent = createOverlay();
    const child = createOverlay();
    const grandchild = createOverlay();
    const parentOutside = vi.fn();
    const childOutside = vi.fn();
    const grandchildOutside = vi.fn();

    parent.floating.append(child.root);
    child.floating.append(grandchild.root);
    document.body.append(parent.root, parent.floating, child.floating, grandchild.floating);

    const parentHandle = registerOverlayDismissal({
      ...parent,
      onOutsidePointerDown: parentOutside,
    });
    const childHandle = registerOverlayDismissal({
      ...child,
      onOutsidePointerDown: childOutside,
    });
    const grandchildHandle = registerOverlayDismissal({
      ...grandchild,
      onOutsidePointerDown: grandchildOutside,
    });

    grandchild.floating.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(parentOutside).not.toHaveBeenCalled();
    expect(childOutside).not.toHaveBeenCalled();
    expect(grandchildOutside).not.toHaveBeenCalled();

    grandchildHandle.destroy();
    childHandle.destroy();
    parentHandle.destroy();
  });

  it("still dismisses independent overlays", () => {
    const first = createOverlay();
    const second = createOverlay();
    const firstOutside = vi.fn();
    const secondOutside = vi.fn();
    document.body.append(first.root, first.floating, second.root, second.floating);

    const firstHandle = registerOverlayDismissal({
      ...first,
      onOutsidePointerDown: firstOutside,
    });
    const secondHandle = registerOverlayDismissal({
      ...second,
      onOutsidePointerDown: secondOutside,
    });

    second.floating.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    expect(firstOutside).toHaveBeenCalledTimes(1);
    expect(secondOutside).not.toHaveBeenCalled();

    secondHandle.destroy();
    firstHandle.destroy();
  });

  it("claims Escape before earlier bubble listeners and closes only the topmost overlay", () => {
    const first = createOverlay();
    const second = createOverlay();
    const observedOrder: string[] = [];
    first.floating.setAttribute("data-state", "open");
    second.floating.setAttribute("data-state", "open");
    document.body.append(first.root, first.floating, second.root, second.floating);
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      observedOrder.push(`bubble:${String(event.defaultPrevented)}`);
    };
    document.addEventListener("keydown", onDocumentKeyDown);

    const firstHandle = registerOverlayDismissal({
      ...first,
      onEscapeKeyDown: (event) => {
        observedOrder.push("first");
        event.preventDefault();
        first.floating.setAttribute("data-state", "closed");
        return true;
      },
    });
    const secondHandle = registerOverlayDismissal({
      ...second,
      onEscapeKeyDown: (event) => {
        observedOrder.push("second");
        event.preventDefault();
        second.floating.setAttribute("data-state", "closed");
        return true;
      },
    });

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );

    expect(observedOrder).toEqual(["second", "bubble:true"]);
    expect(second.floating.getAttribute("data-state")).toBe("closed");
    expect(first.floating.getAttribute("data-state")).toBe("open");

    secondHandle.destroy();
    firstHandle.destroy();
    document.removeEventListener("keydown", onDocumentKeyDown);
  });

  it("does not let a background floating layer claim Escape from an active modal Dialog", () => {
    const overlay = createOverlay();
    overlay.floating.setAttribute("data-state", "open");
    const dialog = document.createElement("dialog");
    const dialogButton = document.createElement("button");
    dialog.append(dialogButton);
    document.body.append(overlay.root, overlay.floating, dialog);
    const handle = registerOverlayDismissal({
      ...overlay,
      onEscapeKeyDown: (event) => {
        event.preventDefault();
        overlay.floating.setAttribute("data-state", "closed");
        return true;
      },
    });
    dialog.showModal();
    dialogButton.focus();

    try {
      const escape = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Escape",
      });
      dialogButton.dispatchEvent(escape);

      expect(escape.defaultPrevented).toBe(false);
      expect(overlay.floating.getAttribute("data-state")).toBe("open");
    } finally {
      handle.destroy();
      dialog.close();
    }
  });
});

function createOverlay(): {
  contains: (target: Node) => boolean;
  floating: HTMLElement;
  root: HTMLElement;
} {
  const root = document.createElement("div");
  const trigger = document.createElement("button");
  const floating = document.createElement("div");
  root.append(trigger);

  return {
    contains: (target) => trigger.contains(target) || floating.contains(target),
    floating,
    root,
  };
}
