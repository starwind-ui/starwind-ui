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
});
