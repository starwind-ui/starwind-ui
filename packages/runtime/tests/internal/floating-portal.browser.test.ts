import { describe, expect, it, vi } from "vitest";

import { resolveFloatingPortalTarget } from "../../src/internal/floating";
import {
  createFloatingPortalSession,
  demoteDialogOwnedFloatingPortals,
  promoteDialogOwnedFloatingPortals,
  requestDialogOwnedFloatingPortalClose,
} from "../../src/internal/floating-portal";

function createDialogFixture() {
  const before = document.createElement("span");
  const dialog = document.createElement("dialog");
  const reference = document.createElement("button");
  const portalElement = document.createElement("div");
  const focusTarget = document.createElement("button");
  const after = document.createElement("span");

  dialog.setAttribute("data-slot", "dialog-content");
  dialog.style.cssText = [
    "position: fixed",
    "inset: auto",
    "left: 20px",
    "top: 20px",
    "width: 120px",
    "height: 80px",
    "margin: 0",
    "padding: 0",
    "overflow: hidden",
  ].join(";");
  portalElement.style.cssText = [
    "position: fixed",
    "left: 240px",
    "top: 40px",
    "width: 80px",
    "height: 40px",
  ].join(";");
  focusTarget.style.cssText = "width: 100%; height: 100%";
  portalElement.append(focusTarget);
  dialog.append(before, reference, portalElement, after);
  document.body.append(dialog);
  dialog.showModal();

  const portalTarget = resolveFloatingPortalTarget(reference);
  const session = createFloatingPortalSession({
    getPortalElement: () => portalElement,
    getPortalTarget: () => portalTarget,
    root: dialog,
  });

  return {
    after,
    before,
    dialog,
    focusTarget,
    portalElement,
    portalTarget,
    reference,
    session,
  };
}

describe("floating portal session", () => {
  it("promotes dialog-owned content above clipping while preserving interaction and geometry", () => {
    const fixture = createDialogFixture();

    fixture.session.mount();

    const wrapper = fixture.portalTarget.querySelector<HTMLElement>(
      ":scope > [data-sw-floating-portal]",
    );
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("popover")).toBe("manual");
    expect(wrapper?.matches(":popover-open")).toBe(true);
    expect(fixture.portalElement.parentElement).toBe(wrapper);
    expect(fixture.portalElement.style.position).toBe("fixed");
    expect(fixture.portalElement.style.left).toBe("240px");
    expect(fixture.portalElement.style.top).toBe("40px");
    expect(fixture.portalElement.style.pointerEvents).toBe("auto");
    expect(document.elementFromPoint(260, 60)).toBe(fixture.focusTarget);

    fixture.focusTarget.focus();
    expect(document.activeElement).toBe(fixture.focusTarget);

    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("demotes, rapidly promotes again, restores, and destroys idempotently", () => {
    const fixture = createDialogFixture();

    fixture.session.mount();
    fixture.session.demote();
    expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.portalElement.parentElement).toBe(fixture.portalTarget);
    expect(fixture.portalElement.style.pointerEvents).toBe("");

    fixture.session.promote();
    expect(
      fixture.portalTarget
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    fixture.session.restore();
    fixture.session.restore();
    expect(fixture.portalElement.previousElementSibling).toBe(fixture.reference);
    expect(fixture.portalElement.nextElementSibling).toBe(fixture.after);
    expect(fixture.dialog.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.dialog.childNodes).not.toContainEqual(
      expect.objectContaining({ nodeType: Node.COMMENT_NODE }),
    );

    fixture.session.destroy();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("keeps outside-dialog portals unwrapped", () => {
    const originalParent = document.createElement("div");
    const floatingRoot = document.createElement("div");
    const reference = document.createElement("button");
    const portalElement = document.createElement("div");
    floatingRoot.setAttribute("data-floating-root", "");
    originalParent.append(reference, portalElement);
    floatingRoot.append(originalParent);
    document.body.append(floatingRoot);

    const session = createFloatingPortalSession({
      getPortalElement: () => portalElement,
      getPortalTarget: () => resolveFloatingPortalTarget(reference),
      root: originalParent,
    });
    session.mount();

    expect(portalElement.parentElement).toBe(floatingRoot);
    expect(document.querySelector("[data-sw-floating-portal]")).toBeNull();

    session.destroy();
    expect(portalElement.parentElement).toBe(originalParent);
    floatingRoot.remove();
  });

  it("falls back to valid dialog-local topology when Popover API methods are unavailable", () => {
    const originalShowPopover = HTMLElement.prototype.showPopover;
    const originalHidePopover = HTMLElement.prototype.hidePopover;
    const fixture = createDialogFixture();

    Object.defineProperties(HTMLElement.prototype, {
      hidePopover: { configurable: true, value: undefined },
      showPopover: { configurable: true, value: undefined },
    });

    try {
      expect(() => fixture.session.mount()).not.toThrow();
      expect(fixture.portalElement.parentElement).toBe(fixture.portalTarget);
      expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();
      expect(() => fixture.session.destroy()).not.toThrow();
      expect(fixture.portalElement.parentElement).toBe(fixture.dialog);
    } finally {
      Object.defineProperties(HTMLElement.prototype, {
        hidePopover: { configurable: true, value: originalHidePopover },
        showPopover: { configurable: true, value: originalShowPopover },
      });
      fixture.dialog.close();
      fixture.dialog.remove();
    }
  });

  it("falls back without corrupting topology when native promotion throws", () => {
    const fixture = createDialogFixture();
    const showPopover = vi
      .spyOn(HTMLElement.prototype, "showPopover")
      .mockImplementationOnce(() => {
        throw new DOMException("invalid state", "InvalidStateError");
      });

    expect(() => fixture.session.mount()).not.toThrow();
    expect(fixture.portalElement.parentElement).toBe(fixture.portalTarget);
    expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();

    showPopover.mockRestore();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("registers owner lifecycle hooks only while the session is mounted", () => {
    const fixture = createDialogFixture();
    let closeRequested = false;
    const session = createFloatingPortalSession({
      getPortalElement: () => fixture.portalElement,
      getPortalTarget: () => fixture.portalTarget,
      onOwnerCloseRequest: () => {
        closeRequested = true;
      },
      root: fixture.dialog,
    });

    session.mount();
    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    expect(closeRequested).toBe(true);

    demoteDialogOwnedFloatingPortals(fixture.dialog);
    expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();
    promoteDialogOwnedFloatingPortals(fixture.dialog);
    expect(
      fixture.portalTarget
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    closeRequested = false;
    session.destroy();
    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    expect(closeRequested).toBe(false);

    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("does not promote while its controller is logically ineligible", () => {
    const fixture = createDialogFixture();
    let canPromote = false;
    const session = createFloatingPortalSession({
      canPromote: () => canPromote,
      getPortalElement: () => fixture.portalElement,
      getPortalTarget: () => fixture.portalTarget,
      root: fixture.dialog,
    });

    session.mount();
    expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();

    canPromote = true;
    session.promote();
    expect(
      fixture.portalTarget
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    session.demote();
    canPromote = false;
    session.promote();
    expect(fixture.portalTarget.querySelector("[data-sw-floating-portal]")).toBeNull();

    session.destroy();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("requests a late closing-owner session once and preserves reentrant restoration", () => {
    const fixture = createDialogFixture();
    let closeRequests = 0;
    let session!: ReturnType<typeof createFloatingPortalSession>;
    session = createFloatingPortalSession({
      getPortalElement: () => fixture.portalElement,
      getPortalTarget: () => fixture.portalTarget,
      onOwnerCloseRequest: () => {
        closeRequests += 1;
        fixture.portalElement.setAttribute("data-state", "closed");
        session.restore();
      },
      root: fixture.dialog,
    });

    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    session.mount();
    requestDialogOwnedFloatingPortalClose(fixture.dialog);

    expect(closeRequests).toBe(1);
    expect(fixture.portalElement.getAttribute("data-state")).toBe("closed");
    expect(fixture.portalElement.parentElement).toBe(fixture.dialog);
    expect(fixture.portalElement.previousElementSibling).toBe(fixture.reference);
    expect(fixture.portalElement.nextElementSibling).toBe(fixture.after);
    expect(fixture.dialog.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.dialog.childNodes).not.toContainEqual(
      expect.objectContaining({ nodeType: Node.COMMENT_NODE }),
    );

    session.destroy();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("requests one close intent when a session leaves and rejoins the same closing owner", () => {
    const fixture = createDialogFixture();
    const outsideTarget = document.createElement("div");
    outsideTarget.setAttribute("data-floating-root", "");
    document.body.append(outsideTarget);
    let portalTarget = fixture.portalTarget;
    const closeEvents: string[] = [];
    const session = createFloatingPortalSession({
      getPortalElement: () => fixture.portalElement,
      getPortalTarget: () => portalTarget,
      onOwnerCloseRequest: () => closeEvents.push("requested"),
      root: fixture.dialog,
    });
    session.mount();

    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    portalTarget = outsideTarget;
    session.mount();
    portalTarget = fixture.portalTarget;
    session.mount();

    expect(closeEvents).toEqual(["requested"]);
    expect(fixture.dialog.querySelector("[data-sw-floating-portal]")).toBeNull();

    promoteDialogOwnedFloatingPortals(fixture.dialog);
    requestDialogOwnedFloatingPortalClose(fixture.dialog);

    expect(closeEvents).toEqual(["requested", "requested"]);

    session.destroy();
    outsideTarget.remove();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("restores a controlled late session exactly after its closing owner reopens", () => {
    const fixture = createDialogFixture();
    const closeEvents: string[] = [];
    const session = createFloatingPortalSession({
      getPortalElement: () => fixture.portalElement,
      getPortalTarget: () => fixture.portalTarget,
      onOwnerCloseRequest: () => closeEvents.push("requested"),
      root: fixture.dialog,
    });

    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    session.mount();

    expect(closeEvents).toEqual(["requested"]);
    expect(fixture.dialog.querySelector("[data-sw-floating-portal]")).toBeNull();

    promoteDialogOwnedFloatingPortals(fixture.dialog);

    expect(
      fixture.dialog
        .querySelector<HTMLElement>("[data-sw-floating-portal]")
        ?.matches(":popover-open"),
    ).toBe(true);

    session.restore();

    expect(fixture.portalElement.parentElement).toBe(fixture.dialog);
    expect(fixture.portalElement.previousElementSibling).toBe(fixture.reference);
    expect(fixture.portalElement.nextElementSibling).toBe(fixture.after);
    expect(fixture.dialog.querySelector("[data-sw-floating-portal]")).toBeNull();
    expect(fixture.dialog.childNodes).not.toContainEqual(
      expect.objectContaining({ nodeType: Node.COMMENT_NODE }),
    );

    requestDialogOwnedFloatingPortalClose(fixture.dialog);
    expect(closeEvents).toEqual(["requested"]);

    session.destroy();
    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("leaves no native or local wrapper when destroy re-enters promotion", () => {
    const fixture = createDialogFixture();
    const onBeforeToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      if (
        toggleEvent.newState === "open" &&
        toggleEvent.target instanceof HTMLElement &&
        toggleEvent.target.hasAttribute("data-sw-floating-portal")
      ) {
        fixture.session.destroy();
      }
    };
    document.addEventListener("beforetoggle", onBeforeToggle, true);

    try {
      fixture.session.mount();

      expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);
      expect(document.querySelectorAll("[data-sw-floating-portal]:popover-open")).toHaveLength(0);
      expect(fixture.portalElement.parentElement).toBe(fixture.dialog);
      expect(fixture.portalElement.previousElementSibling).toBe(fixture.reference);
      expect(fixture.portalElement.style.pointerEvents).toBe("");
    } finally {
      document.removeEventListener("beforetoggle", onBeforeToggle, true);
      fixture.dialog.close();
      fixture.dialog.remove();
    }
  });

  it("restores cleanly and remains reusable when restore re-enters promotion", () => {
    const fixture = createDialogFixture();
    const onBeforeToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      if (
        toggleEvent.newState === "open" &&
        toggleEvent.target instanceof HTMLElement &&
        toggleEvent.target.hasAttribute("data-sw-floating-portal")
      ) {
        fixture.session.restore();
      }
    };
    document.addEventListener("beforetoggle", onBeforeToggle, true);

    fixture.session.mount();
    document.removeEventListener("beforetoggle", onBeforeToggle, true);

    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);
    expect(fixture.portalElement.parentElement).toBe(fixture.dialog);
    expect(fixture.portalElement.previousElementSibling).toBe(fixture.reference);
    expect(fixture.portalElement.style.pointerEvents).toBe("");

    fixture.session.mount();
    expect(
      fixture.portalTarget.querySelectorAll("[data-sw-floating-portal]:popover-open"),
    ).toHaveLength(1);
    expect(fixture.portalElement.style.pointerEvents).toBe("auto");

    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("preserves one interactive wrapper when promote re-enters demotion", () => {
    const fixture = createDialogFixture();
    fixture.session.mount();
    const firstWrapper = fixture.portalTarget.querySelector<HTMLElement>(
      ":scope > [data-sw-floating-portal]",
    );
    expect(firstWrapper?.matches(":popover-open")).toBe(true);
    firstWrapper?.addEventListener(
      "beforetoggle",
      (event) => {
        if ((event as ToggleEvent).newState === "closed") {
          fixture.session.promote();
        }
      },
      { once: true },
    );

    fixture.session.demote();

    const wrappers = fixture.portalTarget.querySelectorAll<HTMLElement>(
      ":scope > [data-sw-floating-portal]",
    );
    expect(wrappers).toHaveLength(1);
    expect(wrappers[0]?.matches(":popover-open")).toBe(true);
    expect(fixture.portalElement.parentElement).toBe(wrappers[0]);
    expect(fixture.portalElement.style.pointerEvents).toBe("auto");
    expect(document.elementFromPoint(260, 60)).toBe(fixture.focusTarget);

    fixture.session.destroy();
    fixture.dialog.close();
    fixture.dialog.remove();
  });

  it("remounts a promoted session without retaining its previous dialog owner", () => {
    const parentDialog = document.createElement("dialog");
    const childDialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const childReference = document.createElement("button");
    const portalElement = document.createElement("div");
    const after = document.createElement("span");
    let closeRequested = false;
    parentDialog.setAttribute("data-slot", "dialog-content");
    childDialog.setAttribute("data-slot", "dialog-content");
    parentDialog.append(reference, portalElement, after, childDialog);
    childDialog.append(childReference);
    document.body.append(parentDialog);
    parentDialog.showModal();
    childDialog.showModal();

    const parentTarget = resolveFloatingPortalTarget(reference);
    const childTarget = resolveFloatingPortalTarget(childReference);
    let currentTarget = parentTarget;
    const session = createFloatingPortalSession({
      getPortalElement: () => portalElement,
      getPortalTarget: () => currentTarget,
      onOwnerCloseRequest: () => {
        closeRequested = true;
      },
      root: parentDialog,
    });
    session.mount();
    expect(parentTarget.querySelectorAll("[data-sw-floating-portal]:popover-open")).toHaveLength(1);

    currentTarget = childTarget;
    session.mount();

    expect(parentTarget.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);
    expect(childTarget.querySelectorAll("[data-sw-floating-portal]:popover-open")).toHaveLength(1);
    expect(portalElement.closest("dialog")).toBe(childDialog);
    requestDialogOwnedFloatingPortalClose(parentDialog);
    expect(closeRequested).toBe(false);
    requestDialogOwnedFloatingPortalClose(childDialog);
    expect(closeRequested).toBe(true);

    session.destroy();
    expect(portalElement.parentElement).toBe(parentDialog);
    expect(portalElement.nextElementSibling).toBe(after);
    expect(document.querySelectorAll("[data-sw-floating-portal]")).toHaveLength(0);

    childDialog.close();
    parentDialog.close();
    parentDialog.remove();
  });
});
