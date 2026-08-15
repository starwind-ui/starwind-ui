import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFocusBoundary, getNextDocumentTabStop } from "../../src/internal/focus-boundary";

describe("getNextDocumentTabStop", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns the first eligible document target after the logical owner", () => {
    const before = button("before");
    const owner = document.createElement("div");
    const owned = button("owned");
    const hidden = button("hidden");
    hidden.hidden = true;
    const ariaHiddenParent = document.createElement("div");
    ariaHiddenParent.setAttribute("aria-hidden", "true");
    const ariaHidden = button("aria-hidden");
    ariaHiddenParent.append(ariaHidden);
    const disabled = button("disabled");
    disabled.disabled = true;
    const negative = button("negative");
    negative.tabIndex = -1;
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    const inertParent = document.createElement("div");
    inertParent.inert = true;
    const inertControl = button("inert");
    inertParent.append(inertControl);
    const next = button("next");
    owner.append(owned);
    document.body.append(
      before,
      owner,
      hidden,
      ariaHiddenParent,
      disabled,
      negative,
      hiddenInput,
      inertParent,
      next,
    );

    expect(getNextDocumentTabStop(owner)).toBe(next);
  });

  it("skips controls hidden by CSS on themselves or an ancestor", () => {
    const owner = document.createElement("div");
    const displayHidden = button("display-hidden");
    displayHidden.style.display = "none";
    const displayHiddenParent = document.createElement("div");
    displayHiddenParent.style.display = "none";
    displayHiddenParent.append(button("display-hidden-descendant"));
    const visibilityHidden = button("visibility-hidden");
    visibilityHidden.style.visibility = "hidden";
    const visibilityHiddenParent = document.createElement("div");
    visibilityHiddenParent.style.visibility = "hidden";
    visibilityHiddenParent.append(button("visibility-hidden-descendant"));
    const next = button("next");
    document.body.append(
      owner,
      displayHidden,
      displayHiddenParent,
      visibilityHidden,
      visibilityHiddenParent,
      next,
    );

    expect(getNextDocumentTabStop(owner)).toBe(next);
  });

  it("skips hidden content in closed details and keeps its summary eligible", () => {
    const owner = document.createElement("div");
    const details = document.createElement("details");
    const hiddenControl = button("hidden-control");
    const summary = document.createElement("summary");
    summary.textContent = "Summary";
    details.append(hiddenControl, summary);
    document.body.append(owner, details);

    expect(getNextDocumentTabStop(owner)).toBe(summary);
  });

  it("routes a checked radio group through its checked member", () => {
    const owner = document.createElement("div");
    const first = radio("choice");
    const checked = radio("choice");
    checked.checked = true;
    const next = button("next");
    document.body.append(owner, first, checked, next);

    expect(getNextDocumentTabStop(owner)).toBe(checked);
  });

  it("routes an unchecked radio group through its first member", () => {
    const owner = document.createElement("div");
    const first = radio("choice");
    const second = radio("choice");
    const next = button("next");
    document.body.append(owner, first, second, next);

    expect(getNextDocumentTabStop(owner)).toBe(first);
  });

  it("ignores a disabled checked radio when routing its group", () => {
    const owner = document.createElement("div");
    const first = radio("choice");
    const checked = radio("choice");
    checked.checked = true;
    checked.disabled = true;
    const next = button("next");
    document.body.append(owner, first, checked, next);

    expect(getNextDocumentTabStop(owner)).toBe(first);
  });

  it.each([
    ["display", "none"],
    ["visibility", "hidden"],
  ])("ignores a checked radio hidden by %s when routing its group", (property, value) => {
    const owner = document.createElement("div");
    const first = radio("choice");
    const checked = radio("choice");
    checked.checked = true;
    checked.style.setProperty(property, value);
    const next = button("next");
    document.body.append(owner, first, checked, next);

    expect(getNextDocumentTabStop(owner)).toBe(first);
  });

  it("ignores a negative-tab-index checked radio when routing its group", () => {
    const owner = document.createElement("div");
    const first = radio("choice");
    const checked = radio("choice");
    checked.checked = true;
    checked.tabIndex = -1;
    const next = button("next");
    document.body.append(owner, first, checked, next);

    expect(getNextDocumentTabStop(owner)).toBe(first);
  });

  it("keeps same-name radios with different form owners in separate groups", () => {
    const owner = document.createElement("div");
    const firstForm = document.createElement("form");
    const first = radio("choice");
    firstForm.append(first);
    const secondForm = document.createElement("form");
    const checked = radio("choice");
    checked.checked = true;
    secondForm.append(checked);
    const next = button("next");
    document.body.append(owner, firstForm, secondForm, next);

    expect(getNextDocumentTabStop(owner)).toBe(first);
  });

  it("uses the logical owner's document for iframe-owned targets", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const owner = frameDocument.createElement("div");
    const next = frameDocument.createElement("button");
    frameDocument.body.append(owner, next);

    expect(getNextDocumentTabStop(owner)).toBe(next);
  });

  it("excludes portaled surfaces and their descendants in document order", () => {
    const owner = document.createElement("div");
    const portal = document.createElement("div");
    const portalControl = button("portal-control");
    const nestedPortal = document.createElement("div");
    const nestedControl = button("nested-control");
    const next = button("next");
    portal.append(portalControl);
    nestedPortal.append(nestedControl);
    document.body.append(owner, portal, nestedPortal, next);

    expect(getNextDocumentTabStop(owner, [portal, nestedPortal])).toBe(next);
  });

  it("returns null for disconnected owners and when no following target exists", () => {
    const disconnected = document.createElement("div");
    expect(getNextDocumentTabStop(disconnected)).toBeNull();

    const before = button("before");
    const owner = document.createElement("div");
    document.body.append(before, owner);

    expect(getNextDocumentTabStop(owner)).toBeNull();
  });
});

describe("createFocusBoundary", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("treats multiple portaled surfaces as one owned focus tree", async () => {
    const root = document.createElement("div");
    const trigger = button("trigger");
    const portal = document.createElement("div");
    const item = button("item");
    const submenuPortal = document.createElement("div");
    const submenuItem = button("submenu-item");
    const outside = button("outside");
    root.append(trigger);
    portal.append(item);
    submenuPortal.append(submenuItem);
    document.body.append(root, portal, submenuPortal, outside);
    const onFocusDeparture = vi.fn();
    const owned = [root, portal, submenuPortal];
    const boundary = createFocusBoundary({
      containsTarget: (target) => owned.some((surface) => surface.contains(target)),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: owned,
    });

    item.focus();
    submenuItem.focus();
    trigger.focus();
    await settleFocus();

    expect(onFocusDeparture).not.toHaveBeenCalled();

    outside.focus();
    await settleFocus();

    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
    expect(onFocusDeparture).toHaveBeenCalledWith({
      activeElement: outside,
      lastFocusOwner: trigger,
    });
    boundary.destroy();
  });

  it("coalesces duplicate focusout observations into one settled departure", async () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    const owned = button("owned");
    const outside = button("outside");
    inner.append(owned);
    outer.append(inner);
    document.body.append(outer, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => outer.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [outer, inner],
    });

    owned.focus();
    outside.focus();
    await settleFocus();

    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
    expect(onFocusDeparture.mock.calls[0]?.[0].activeElement).toBe(outside);
    boundary.destroy();
  });

  it("updates observed surfaces without retaining removed surfaces", async () => {
    const firstSurface = document.createElement("div");
    const firstOwner = button("first-owner");
    const secondSurface = document.createElement("div");
    const secondOwner = button("second-owner");
    const outside = button("outside");
    firstSurface.append(firstOwner);
    secondSurface.append(secondOwner);
    document.body.append(firstSurface, secondSurface, outside);
    const onFocusDeparture = vi.fn();
    let activeSurface = firstSurface;
    const boundary = createFocusBoundary({
      containsTarget: (target) => activeSurface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [firstSurface],
    });

    activeSurface = secondSurface;
    boundary.setSurfaces([secondSurface]);
    firstOwner.focus();
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).not.toHaveBeenCalled();

    secondOwner.focus();
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
    boundary.destroy();
  });

  it("uses an explicit eligible focus owner and drops it after disconnection", async () => {
    const surface = document.createElement("div");
    const item = button("item");
    const outside = button("outside");
    surface.append(item);
    document.body.append(surface, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => surface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [surface],
    });

    item.focus();
    boundary.setLastFocusOwner(item);
    item.remove();
    outside.focus();
    surface.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await settleFocus();

    expect(onFocusDeparture).toHaveBeenCalledWith({
      activeElement: outside,
      lastFocusOwner: null,
    });
    boundary.destroy();
  });

  it("rejects hidden-input and inert focus owners from restoration state", async () => {
    const surface = document.createElement("div");
    const owned = button("owned");
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    const inertParent = document.createElement("div");
    inertParent.inert = true;
    const inertControl = button("inert");
    const outside = button("outside");
    inertParent.append(inertControl);
    surface.append(owned, hiddenInput, inertParent);
    document.body.append(surface, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => surface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [surface],
    });

    owned.focus();
    boundary.setLastFocusOwner(hiddenInput);
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).toHaveBeenLastCalledWith({
      activeElement: outside,
      lastFocusOwner: null,
    });

    owned.focus();
    boundary.setLastFocusOwner(inertControl);
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).toHaveBeenLastCalledWith({
      activeElement: outside,
      lastFocusOwner: null,
    });
    expect(onFocusDeparture).toHaveBeenCalledTimes(2);
    boundary.destroy();
  });

  it("suppresses one departure during an explicit handoff", async () => {
    const surface = document.createElement("div");
    const owned = button("owned");
    const outside = button("outside");
    surface.append(owned);
    document.body.append(surface, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => surface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [surface],
    });

    owned.focus();
    boundary.suppressNextDeparture();
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).not.toHaveBeenCalled();

    owned.focus();
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
    boundary.destroy();
  });

  it("expires unused suppression after the pointer default-action window", async () => {
    vi.useFakeTimers();
    const surface = document.createElement("div");
    const owned = button("owned");
    const outside = button("outside");
    surface.append(owned);
    document.body.append(surface, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => surface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [surface],
    });

    owned.focus();
    boundary.suppressNextDeparture();
    await vi.runAllTimersAsync();
    outside.focus();
    await settleFocus();

    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
    boundary.destroy();
  });

  it("cancels pending checks and active listeners when destroyed", async () => {
    const surface = document.createElement("div");
    const owned = button("owned");
    const outside = button("outside");
    surface.append(owned);
    document.body.append(surface, outside);
    const onFocusDeparture = vi.fn();
    const boundary = createFocusBoundary({
      containsTarget: (target) => surface.contains(target),
      onFocusDeparture,
      ownerDocument: document,
      surfaces: [surface],
    });

    owned.focus();
    outside.focus();
    boundary.suppressNextDeparture();
    boundary.destroy();
    boundary.destroy();
    await settleFocus();

    owned.focus();
    outside.focus();
    await settleFocus();
    expect(onFocusDeparture).not.toHaveBeenCalled();
  });
});

function button(label: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.textContent = label;
  return element;
}

function radio(name: string): HTMLInputElement {
  const element = document.createElement("input");
  element.type = "radio";
  element.name = name;
  return element;
}

async function settleFocus(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
