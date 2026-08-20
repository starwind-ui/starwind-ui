import { describe, expect, it, vi } from "vitest";

import {
  createFloatingPositioner,
  type FloatingAlign,
  type FloatingSide,
  resolveFloatingPortalTarget,
  resolveFloatingPortalTargetOwner,
} from "../../src/internal/floating";

describe("floating internals", () => {
  it("positions a floating element and writes placement state", async () => {
    const reference = document.createElement("button");
    const floating = document.createElement("div");

    reference.style.cssText = [
      "position: fixed",
      "left: 80px",
      "top: 100px",
      "width: 60px",
      "height: 30px",
    ].join(";");
    floating.style.cssText = ["width: 120px", "height: 80px"].join(";");

    document.body.append(reference, floating);

    const positioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: "start" satisfies FloatingAlign,
        avoidCollisions: false,
        side: "bottom" satisfies FloatingSide,
        sideOffset: 4,
      }),
      reference,
    });

    await positioner.update();

    expect(floating.style.position).toBe("fixed");
    expect(floating.style.left).toBe("80px");
    expect(floating.style.top).toBe("134px");
    expect(floating.style.transformOrigin).toBe("left top");
    expect(floating.style.getPropertyValue("--transform-origin")).toBe("left top");
    expect(floating.getAttribute("data-side")).toBe("bottom");
    expect(floating.getAttribute("data-align")).toBe("start");

    positioner.destroy();
  });

  it.each(["stop", "destroy"] as const)(
    "invalidates a deferred manual update after %s",
    async (action) => {
      const reference = document.createElement("button");
      const floating = document.createElement("div");
      reference.style.cssText =
        "position: fixed; left: 80px; top: 100px; width: 60px; height: 30px";
      floating.style.cssText = "width: 120px; height: 80px";
      document.body.append(reference, floating);
      const positioner = createFloatingPositioner({
        floating,
        getOptions: () => ({ align: "start", avoidCollisions: false, side: "bottom" }),
        reference,
      });

      const pendingUpdate = positioner.update();
      floating.style.left = "777px";
      floating.style.top = "888px";
      if (action === "stop") positioner.stopAutoUpdate();
      else positioner.destroy();
      await pendingUpdate;

      expect(floating.style.left).toBe("777px");
      expect(floating.style.top).toBe("888px");
      expect(floating.getAttribute("data-side")).toBeNull();
      expect(floating.getAttribute("data-align")).toBeNull();

      positioner.destroy();
      reference.remove();
      floating.remove();
    },
  );

  it("invalidates a deferred auto update when auto-update stops", async () => {
    const reference = document.createElement("button");
    const floating = document.createElement("div");
    reference.style.cssText = "position: fixed; left: 80px; top: 100px; width: 60px; height: 30px";
    floating.style.cssText = "width: 120px; height: 80px";
    document.body.append(reference, floating);
    const onUpdated = vi.fn();
    const positioner = createFloatingPositioner({
      floating,
      getOptions: () => ({ align: "start", avoidCollisions: false, side: "bottom" }),
      reference,
    });

    positioner.startAutoUpdate({ onUpdated });
    floating.style.left = "777px";
    floating.style.top = "888px";
    positioner.stopAutoUpdate();
    await Promise.resolve();
    await Promise.resolve();

    expect(floating.style.left).toBe("777px");
    expect(floating.style.top).toBe("888px");
    expect(onUpdated).not.toHaveBeenCalled();

    positioner.destroy();
    reference.remove();
    floating.remove();
  });

  it("can preserve anchor attachment when viewport collision would otherwise shift the floating element", async () => {
    const reference = document.createElement("button");
    const floating = document.createElement("div");
    const referenceLeft = window.innerWidth - 24;

    reference.style.cssText = [
      "position: fixed",
      `left: ${referenceLeft}px`,
      "top: 100px",
      "width: 20px",
      "height: 30px",
    ].join(";");
    floating.style.cssText = ["width: 160px", "height: 80px"].join(";");

    document.body.append(reference, floating);

    const positioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: "start" satisfies FloatingAlign,
        preserveAnchor: true,
        side: "bottom" satisfies FloatingSide,
        sideOffset: 4,
      }),
      reference,
    });

    await positioner.update();

    expect(floating.style.left).toBe(`${referenceLeft + 20 - 160}px`);
    expect(floating.style.top).toBe("134px");
    expect(floating.getAttribute("data-side")).toBe("bottom");
    expect(floating.getAttribute("data-align")).toBe("end");

    positioner.destroy();
  });

  it("keeps shifting to viewport padding by default", async () => {
    const reference = document.createElement("button");
    const floating = document.createElement("div");
    const referenceLeft = window.innerWidth - 24;

    reference.style.cssText = [
      "position: fixed",
      `left: ${referenceLeft}px`,
      "top: 100px",
      "width: 20px",
      "height: 30px",
    ].join(";");
    floating.style.cssText = ["width: 160px", "height: 80px"].join(";");

    document.body.append(reference, floating);

    const positioner = createFloatingPositioner({
      floating,
      getOptions: () => ({
        align: "start" satisfies FloatingAlign,
        side: "bottom" satisfies FloatingSide,
        sideOffset: 4,
      }),
      reference,
    });

    await positioner.update();

    expect(floating.style.left).toBe(`${window.innerWidth - 160 - 8}px`);

    positioner.destroy();
  });

  it("honors updated requested placement across positioner lifecycles", async () => {
    const reference = document.createElement("button");
    const floating = document.createElement("div");

    reference.style.cssText = [
      "position: fixed",
      "left: 100px",
      "top: 100px",
      "width: 80px",
      "height: 40px",
    ].join(";");
    floating.style.cssText = ["width: 120px", "height: 60px"].join(";");

    document.body.append(reference, floating);
    floating.setAttribute("data-side", "bottom");
    floating.setAttribute("data-align", "start");

    const getOptions = () => ({
      align: floating.getAttribute("data-align") as FloatingAlign,
      avoidCollisions: false,
      side: floating.getAttribute("data-side") as FloatingSide,
    });
    const firstPositioner = createFloatingPositioner({
      floating,
      getOptions,
      reference,
    });

    await firstPositioner.update();
    expect(floating.getAttribute("data-side")).toBe("bottom");
    expect(floating.getAttribute("data-align")).toBe("start");

    firstPositioner.destroy();
    floating.setAttribute("data-side", "top");
    floating.setAttribute("data-align", "end");

    const secondPositioner = createFloatingPositioner({
      floating,
      getOptions,
      reference,
    });

    await secondPositioner.update();

    expect(floating.getAttribute("data-side")).toBe("top");
    expect(floating.getAttribute("data-align")).toBe("end");

    secondPositioner.destroy();
  });

  it("resolves the nearest floating root before falling back to the document body", () => {
    const floatingRoot = document.createElement("div");
    const reference = document.createElement("button");
    floatingRoot.setAttribute("data-floating-root", "");
    floatingRoot.append(reference);
    document.body.append(floatingRoot);

    expect(resolveFloatingPortalTarget(reference)).toBe(floatingRoot);

    floatingRoot.remove();
    document.body.append(reference);

    expect(resolveFloatingPortalTarget(reference)).toBe(document.body);
  });

  it("uses the nearest dialog as the fallback until a top-layer host is registered", () => {
    const parentDialog = document.createElement("dialog");
    const childDialog = document.createElement("dialog");
    const nestedComponent = document.createElement("div");
    const unrelatedRoot = document.createElement("div");
    const reference = document.createElement("button");
    parentDialog.setAttribute("data-slot", "dialog-content");
    childDialog.setAttribute("data-slot", "dialog-content");
    unrelatedRoot.setAttribute("data-floating-root", "");
    unrelatedRoot.append(reference);
    nestedComponent.append(unrelatedRoot);
    childDialog.append(nestedComponent);
    parentDialog.append(childDialog);
    document.body.append(parentDialog);

    const firstTarget = resolveFloatingPortalTarget(reference);
    const secondTarget = resolveFloatingPortalTarget(reference);

    expect(firstTarget).toBe(secondTarget);
    expect(firstTarget).toBe(childDialog);
    expect(firstTarget).not.toBe(unrelatedRoot);
    expect(firstTarget.hasAttribute("data-floating-root")).toBe(false);
    expect(childDialog.querySelectorAll(":scope > [data-floating-root]")).toHaveLength(0);
    expect(parentDialog.querySelector(":scope > [data-floating-root]")).toBeNull();

    parentDialog.remove();
  });

  it("prefers an author-provided direct dialog floating root", () => {
    const dialog = document.createElement("dialog");
    const floatingRoot = document.createElement("div");
    const reference = document.createElement("button");
    dialog.setAttribute("data-slot", "sheet-content");
    floatingRoot.setAttribute("data-floating-root", "");
    dialog.append(floatingRoot, reference);
    document.body.append(dialog);

    expect(resolveFloatingPortalTarget(reference)).toBe(floatingRoot);
    expect(floatingRoot.hasAttribute("data-sw-floating-root")).toBe(false);

    dialog.remove();
  });

  it("prefers a direct author root added after an internal root", () => {
    const dialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const authorRoot = document.createElement("div");
    dialog.setAttribute("data-slot", "drawer-content");
    authorRoot.setAttribute("data-floating-root", "");
    dialog.append(reference);
    document.body.append(dialog);

    const internalRoot = resolveFloatingPortalTarget(reference);
    dialog.append(authorRoot);

    expect(internalRoot).toBe(dialog);
    expect(resolveFloatingPortalTarget(reference)).toBe(authorRoot);

    dialog.remove();
  });

  it("resolves a nested explicit floating root to its owning dialog", () => {
    const dialog = document.createElement("dialog");
    const customContainer = document.createElement("div");
    const floatingRoot = document.createElement("div");
    dialog.setAttribute("data-slot", "dialog-content");
    floatingRoot.setAttribute("data-floating-root", "");
    customContainer.append(floatingRoot);
    dialog.append(customContainer);
    document.body.append(dialog);

    expect(resolveFloatingPortalTargetOwner(floatingRoot)).toBe(dialog);

    document.body.append(floatingRoot);

    expect(resolveFloatingPortalTargetOwner(floatingRoot)).toBeNull();

    dialog.remove();
    floatingRoot.remove();
  });

  it("rejects an explicit root outside the active reference dialog", () => {
    const dialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const outsideRoot = document.createElement("div");
    const portalReference = document.createElement("div");
    dialog.setAttribute("data-slot", "dialog-content");
    outsideRoot.setAttribute("data-floating-root", "");
    outsideRoot.append(portalReference);
    dialog.append(reference);
    document.body.append(dialog, outsideRoot);

    const target = resolveFloatingPortalTarget(reference, {
      explicitReferences: [portalReference],
    });

    expect(dialog.contains(target)).toBe(true);
    expect(target).not.toBe(outsideRoot);

    dialog.remove();
    outsideRoot.remove();
  });

  it("accepts a connected explicit target in the owning document", () => {
    const reference = document.createElement("button");
    const target = document.createElement("section");
    document.body.append(reference, target);

    expect(resolveFloatingPortalTarget(reference, { explicitTargets: [target] })).toBe(target);

    reference.remove();
    target.remove();
  });

  it("falls back when explicit targets are disconnected or owned by another document", () => {
    const reference = document.createElement("button");
    const disconnected = document.createElement("section");
    const otherDocument = document.implementation.createHTMLDocument("portal target");
    const crossDocument = otherDocument.createElement("section");
    otherDocument.body.append(crossDocument);
    document.body.append(reference);

    expect(
      resolveFloatingPortalTarget(reference, {
        explicitTargets: [disconnected, crossDocument],
      }),
    ).toBe(document.body);

    reference.remove();
  });

  it("rejects an explicit target outside the active dialog", () => {
    const dialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const outsideTarget = document.createElement("section");
    dialog.setAttribute("data-slot", "dialog-content");
    dialog.append(reference);
    document.body.append(dialog, outsideTarget);

    const target = resolveFloatingPortalTarget(reference, {
      explicitTargets: [outsideTarget],
    });

    expect(dialog.contains(target)).toBe(true);
    expect(target).not.toBe(outsideTarget);

    dialog.remove();
    outsideTarget.remove();
  });

  it("uses a later compatible explicit target when the first candidate is outside the reference dialog", () => {
    const dialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const outsideRoot = document.createElement("div");
    const outsideReference = document.createElement("div");
    const insideRoot = document.createElement("div");
    const insideReference = document.createElement("div");
    dialog.setAttribute("data-slot", "dialog-content");
    outsideRoot.setAttribute("data-floating-root", "");
    insideRoot.setAttribute("data-floating-root", "");
    outsideRoot.append(outsideReference);
    insideRoot.append(insideReference);
    dialog.append(reference, insideRoot);
    document.body.append(dialog, outsideRoot);

    expect(
      resolveFloatingPortalTarget(reference, {
        explicitReferences: [outsideReference, insideReference],
      }),
    ).toBe(insideRoot);

    dialog.remove();
    outsideRoot.remove();
  });

  it("prefers an explicit authored root with no reference dialog or the same dialog", () => {
    const dialog = document.createElement("dialog");
    const reference = document.createElement("button");
    const authoredRoot = document.createElement("div");
    const portalReference = document.createElement("div");
    dialog.setAttribute("data-slot", "dialog-content");
    authoredRoot.setAttribute("data-floating-root", "");
    authoredRoot.append(portalReference);
    document.body.append(reference, authoredRoot, dialog);

    expect(resolveFloatingPortalTarget(reference, { explicitReferences: [portalReference] })).toBe(
      authoredRoot,
    );

    dialog.append(reference, authoredRoot);

    expect(resolveFloatingPortalTarget(reference, { explicitReferences: [portalReference] })).toBe(
      authoredRoot,
    );

    dialog.remove();
  });

  it("keeps Runtime-created roots under fallback ownership", () => {
    const reference = document.createElement("button");
    const authoredRoot = document.createElement("div");
    const runtimeRoot = document.createElement("div");
    const portalReference = document.createElement("div");
    authoredRoot.setAttribute("data-floating-root", "");
    runtimeRoot.setAttribute("data-floating-root", "");
    runtimeRoot.setAttribute("data-sw-floating-root", "dialog");
    runtimeRoot.append(portalReference);
    document.body.append(reference, runtimeRoot);

    expect(resolveFloatingPortalTarget(reference, { explicitReferences: [portalReference] })).toBe(
      document.body,
    );

    authoredRoot.append(runtimeRoot);
    document.body.append(authoredRoot);

    expect(resolveFloatingPortalTarget(reference, { explicitReferences: [portalReference] })).toBe(
      authoredRoot,
    );

    reference.remove();
    authoredRoot.remove();
  });
});
