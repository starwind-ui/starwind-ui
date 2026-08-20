import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPortalBinding,
  isRuntimePartOwned,
  pendingPortalBindingSnapshot,
  queryRuntimePartElements,
  readyPortalBindingSnapshot,
} from "../../src/internal/portal-binding";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("PortalBinding", () => {
  it("publishes immutable pending and ready snapshots", () => {
    const root = document.createElement("div");
    const authoredParent = document.createElement("div");
    const wrapper = document.createElement("div");
    root.append(authoredParent);
    document.body.append(root, wrapper);
    const binding = createPortalBinding(root);
    const listener = vi.fn();
    binding.subscribe(listener);

    const pending = pendingPortalBindingSnapshot();
    binding.publish(pending);
    expect(Object.isFrozen(binding.getSnapshot())).toBe(true);

    binding.publish(readyPortalBindingSnapshot(root, [{ authoredParent, wrapper }]));
    const ready = binding.getSnapshot();
    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") return;
    expect(Object.isFrozen(ready)).toBe(true);
    expect(Object.isFrozen(ready.parts)).toBe(true);
    expect(Object.isFrozen(ready.parts.portals)).toBe(true);
    expect(Object.isFrozen(ready.parts.wrappers)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("combines one authored Root with multiple logically registered Portal wrappers", () => {
    const root = document.createElement("div");
    root.setAttribute("data-root", "");
    const submenuRoot = document.createElement("div");
    submenuRoot.setAttribute("data-submenu-root", "");
    root.append(submenuRoot);
    const mainWrapper = document.createElement("div");
    const mainPopup = document.createElement("div");
    mainPopup.setAttribute("data-popup", "main");
    mainWrapper.append(mainPopup);
    const submenuWrapper = document.createElement("div");
    const submenuPopup = document.createElement("div");
    submenuPopup.setAttribute("data-popup", "submenu");
    submenuWrapper.append(submenuPopup);
    document.body.append(root, mainWrapper, submenuWrapper);

    const binding = createPortalBinding(root);
    binding.publish(
      readyPortalBindingSnapshot(root, [
        { authoredParent: root, wrapper: mainWrapper },
        { authoredParent: submenuRoot, wrapper: submenuWrapper },
      ]),
    );

    expect(queryRuntimePartElements(root, "[data-popup]")).toEqual([mainPopup, submenuPopup]);
    expect(queryRuntimePartElements(submenuRoot, "[data-popup]")).toEqual([submenuPopup]);
    expect(isRuntimePartOwned(submenuRoot, submenuPopup, "[data-submenu-root]")).toBe(true);
  });

  it("replaces the logical Portal surface in one ready publication", () => {
    const root = document.createElement("div");
    const firstWrapper = document.createElement("div");
    const firstPopup = document.createElement("div");
    firstPopup.setAttribute("data-popup", "first");
    firstWrapper.append(firstPopup);
    const secondWrapper = document.createElement("div");
    const secondPopup = document.createElement("div");
    secondPopup.setAttribute("data-popup", "second");
    secondWrapper.append(secondPopup);
    document.body.append(root, firstWrapper, secondWrapper);
    const binding = createPortalBinding(root);

    binding.publish(
      readyPortalBindingSnapshot(root, [{ authoredParent: root, wrapper: firstWrapper }]),
    );
    expect(queryRuntimePartElements(root, "[data-popup]")).toEqual([firstPopup]);

    binding.publish(pendingPortalBindingSnapshot());
    expect(queryRuntimePartElements(root, "[data-popup]")).toEqual([]);
    binding.publish(
      readyPortalBindingSnapshot(root, [{ authoredParent: root, wrapper: secondWrapper }]),
    );
    expect(queryRuntimePartElements(root, "[data-popup]")).toEqual([secondPopup]);
  });
});
