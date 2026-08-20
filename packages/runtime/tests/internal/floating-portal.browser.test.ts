import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createFloatingPortalSession,
  reportPortalPlacement,
  resolvePortalPlacement,
} from "../../src/internal/floating-portal";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("floating portal placement", () => {
  it("moves and restores one Runtime-owned public wrapper", () => {
    const root = document.createElement("div");
    const before = document.createElement("span");
    const wrapper = document.createElement("div");
    const child = document.createElement("button");
    const after = document.createElement("span");
    const target = document.createElement("section");
    wrapper.append(child);
    root.append(before, wrapper, after);
    document.body.append(root, target);
    const session = createFloatingPortalSession({
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
      root,
    });

    expect(session.mount()).toBe(true);
    expect(wrapper.parentElement).toBe(target);
    expect(wrapper.firstElementChild).toBe(child);
    expect(wrapper).toHaveAttribute("data-placement", "ready");

    session.restore();
    expect(wrapper.parentElement).toBe(root);
    expect(wrapper.previousElementSibling).toBe(before);
    expect(wrapper.nextElementSibling).toBe(after);
    expect(wrapper).toHaveAttribute("data-placement", "pending");
    session.destroy();
  });

  it("keeps a disabled Runtime wrapper inline and ready", () => {
    const root = document.createElement("div");
    const wrapper = document.createElement("div");
    const target = document.createElement("section");
    wrapper.setAttribute("data-disabled", "");
    root.append(wrapper);
    document.body.append(root, target);
    const session = createFloatingPortalSession({
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
      root,
    });

    expect(session.mount()).toBe(true);
    expect(wrapper.parentElement).toBe(root);
    expect(wrapper).toHaveAttribute("data-placement", "ready");
    session.destroy();
  });

  it("waits for a framework-owned wrapper without moving it", () => {
    const root = document.createElement("div");
    const wrapper = document.createElement("div");
    const target = document.createElement("section");
    wrapper.setAttribute("data-sw-portal-placement", "framework");
    root.append(wrapper);
    document.body.append(root, target);
    const readyChange = vi.fn();
    const session = createFloatingPortalSession({
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
      root,
    });
    session.onReadyChange(readyChange);

    expect(session.mount()).toBe(false);
    expect(wrapper.parentElement).toBe(root);
    expect(wrapper).toHaveAttribute("data-placement", "pending");

    target.append(wrapper);
    reportPortalPlacement(wrapper, { ready: true, target });
    expect(session.isReady()).toBe(true);
    expect(wrapper.parentElement).toBe(target);
    expect(readyChange).toHaveBeenLastCalledWith(true);

    session.destroy();
    reportPortalPlacement(wrapper, null);
  });

  it("resumes when a replacement framework wrapper reports its commit", () => {
    const root = document.createElement("div");
    const firstWrapper = document.createElement("div");
    const secondWrapper = document.createElement("div");
    const firstTarget = document.createElement("section");
    const secondTarget = document.createElement("section");
    firstWrapper.setAttribute("data-sw-portal-placement", "framework");
    secondWrapper.setAttribute("data-sw-portal-placement", "framework");
    root.append(firstWrapper);
    document.body.append(root, firstTarget, secondTarget);
    firstTarget.append(firstWrapper);
    reportPortalPlacement(firstWrapper, { ready: true, target: firstTarget });
    let currentWrapper = firstWrapper;
    let currentTarget = firstTarget;
    const session = createFloatingPortalSession({
      getPortalElement: () => currentWrapper,
      getPortalTarget: () => currentTarget,
      root,
    });
    expect(session.mount()).toBe(true);

    reportPortalPlacement(firstWrapper, null);
    currentWrapper = secondWrapper;
    currentTarget = secondTarget;
    secondTarget.append(secondWrapper);
    reportPortalPlacement(secondWrapper, { ready: true, target: secondTarget });
    expect(session.mount()).toBe(true);
    expect(session.isReady()).toBe(true);
    expect(secondWrapper.parentElement).toBe(secondTarget);

    session.destroy();
    reportPortalPlacement(secondWrapper, null);
  });

  it("validates selector and element targets before using the fallback", () => {
    const root = document.createElement("div");
    const wrapper = document.createElement("div");
    const target = document.createElement("section");
    const fallback = document.createElement("section");
    target.id = "portal-target";
    root.append(wrapper);
    document.body.append(root, target, fallback);

    expect(
      resolvePortalPlacement(wrapper, {
        container: "#portal-target",
        fallbackTarget: fallback,
        reference: root,
      }).target,
    ).toBe(target);
    expect(
      resolvePortalPlacement(wrapper, {
        container: "[",
        fallbackTarget: fallback,
        reference: root,
      }).target,
    ).toBe(fallback);
    expect(
      resolvePortalPlacement(wrapper, {
        container: document.createElement("div"),
        fallbackTarget: fallback,
        reference: root,
      }).target,
    ).toBe(fallback);
  });

  it("removes framework report listeners during exact cleanup", () => {
    const root = document.createElement("div");
    const wrapper = document.createElement("div");
    const target = document.createElement("section");
    wrapper.setAttribute("data-sw-portal-placement", "framework");
    root.append(wrapper);
    document.body.append(root, target);
    const getPortalTarget = vi.fn(() => target);
    const session = createFloatingPortalSession({
      getPortalElement: () => wrapper,
      getPortalTarget,
      root,
    });
    session.mount();
    session.destroy();

    target.append(wrapper);
    reportPortalPlacement(wrapper, { ready: true, target });
    expect(getPortalTarget).toHaveBeenCalledTimes(1);
    expect(session.isReady()).toBe(false);
    reportPortalPlacement(wrapper, null);
  });
});
