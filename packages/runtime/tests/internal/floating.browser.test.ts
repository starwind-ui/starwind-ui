import { describe, expect, it } from "vitest";

import {
  createFloatingPositioner,
  type FloatingAlign,
  type FloatingSide,
  resolveFloatingPortalTarget,
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

  it("creates and reuses one direct floating root for the nearest dialog", () => {
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
    expect(firstTarget.parentElement).toBe(childDialog);
    expect(firstTarget).not.toBe(unrelatedRoot);
    expect(firstTarget.getAttribute("data-floating-root")).toBe("");
    expect(firstTarget.getAttribute("data-sw-floating-root")).toBe("dialog");
    expect(childDialog.querySelectorAll(":scope > [data-floating-root]")).toHaveLength(1);
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

    expect(internalRoot.getAttribute("data-sw-floating-root")).toBe("dialog");
    expect(resolveFloatingPortalTarget(reference)).toBe(authorRoot);

    dialog.remove();
  });
});
