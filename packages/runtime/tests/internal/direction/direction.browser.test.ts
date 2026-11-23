import { afterEach, describe, expect, it, vi } from "vitest";

import { createColorPicker } from "../../../src/components/color-picker/controller";
import { onDirectionChange, subscribeDirection } from "../../../src/internal/direction";
import { createPortalDirectionSession } from "../../../src/internal/portal-direction";

const nextFrame = async () => {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
};

const directionChange = (target: Document | Element = document) => {
  const view = (target instanceof Element ? target.ownerDocument : target).defaultView!;
  target.dispatchEvent(new view.Event("starwind:direction-change", { bubbles: true }));
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("direction subscription", () => {
  it("reads inherited, invalid, empty, auto, and CSS direction from the owner document", () => {
    const scope = document.createElement("div");
    const owner = document.createElement("div");
    scope.dir = "rtl";
    scope.append(owner);
    document.body.append(scope);
    const changes: string[] = [];
    const subscription = subscribeDirection(owner, (direction) => changes.push(direction));
    expect(subscription.get()).toBe("rtl");
    scope.setAttribute("dir", "invalid");
    directionChange();
    expect(changes).toEqual(["ltr"]);
    scope.setAttribute("dir", "");
    expect(subscription.get()).toBe("ltr");

    scope.dir = "auto";
    const text = document.createTextNode("שלום");
    scope.insertBefore(text, owner);
    expect(subscription.get()).toBe("rtl");
    text.data = "Hello";
    directionChange();
    expect(changes.at(-1)).toBe("ltr");

    scope.style.direction = "rtl";
    expect(subscription.get()).toBe("rtl");
    scope.style.direction = "ltr";
    expect(subscription.refresh()).toBe("ltr");
    subscription.destroy();
  });

  it("keeps idle state on a dir change with no event and reads it at the next input", async () => {
    const scope = document.createElement("div");
    const owner = document.createElement("button");
    scope.append(owner);
    document.body.append(scope);
    const changes: string[] = [];
    const subscription = subscribeDirection(owner, (direction) => changes.push(direction));
    owner.addEventListener("keydown", () => changes.push(`key:${subscription.get()}`));
    scope.dir = "rtl";
    await nextFrame();
    expect(changes).toEqual([]);
    owner.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(changes).toEqual(["rtl", "key:rtl"]);
    scope.dir = "ltr";
    await nextFrame();
    expect(changes).toEqual(["rtl", "key:rtl"]);
    subscription.destroy();
  });

  it("publishes synchronously on a document event or a bubbling element event", () => {
    const scope = document.createElement("div");
    const owner = document.createElement("button");
    scope.append(owner);
    document.body.append(scope);
    const changes: string[] = [];
    const subscription = subscribeDirection(owner, (direction) => changes.push(direction));
    scope.dir = "rtl";
    directionChange();
    expect(changes).toEqual(["rtl"]);
    scope.dir = "ltr";
    directionChange(scope);
    expect(changes).toEqual(["rtl", "ltr"]);
    scope.dir = "rtl";
    // A non-bubbling event on an element does not reach the document listener.
    scope.dispatchEvent(new Event("starwind:direction-change"));
    expect(changes).toEqual(["rtl", "ltr"]);
    subscription.destroy();
  });

  it("rebinds after reparenting and after adopting an owner into another document", () => {
    const left = document.createElement("div");
    const right = document.createElement("div");
    const owner = document.createElement("button");
    const peer = document.createElement("button");
    left.dir = "ltr";
    right.dir = "rtl";
    left.append(owner, peer);
    document.body.append(left, right);
    const changes: string[] = [];
    const subscription = subscribeDirection(owner, (direction) => changes.push(direction));
    const peerChanges: string[] = [];
    const peerSubscription = subscribeDirection(peer, (direction) => peerChanges.push(direction));
    right.append(owner);
    directionChange();
    expect(changes).toEqual(["rtl"]);

    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const otherDocument = iframe.contentDocument!;
    otherDocument.documentElement.dir = "ltr";
    otherDocument.body.append(otherDocument.adoptNode(owner));
    // The adopted owner stays in the old document's registry until its next read.
    expect(subscription.get()).toBe("ltr");
    expect(changes).toEqual(["rtl", "ltr"]);
    otherDocument.documentElement.dir = "rtl";
    directionChange();
    expect(changes).toEqual(["rtl", "ltr"]);
    directionChange(otherDocument);
    expect(changes.at(-1)).toBe("rtl");
    expect(peerChanges).toEqual([]);
    left.dir = "rtl";
    directionChange();
    expect(peerChanges).toEqual(["rtl"]);
    expect(changes).toEqual(["rtl", "ltr", "rtl"]);
    subscription.destroy();
    peerSubscription.destroy();
  });

  it("shares one listener, reads each owner once per event, and removes it after the last owner", () => {
    const scope = document.createElement("div");
    scope.dir = "ltr";
    document.body.append(scope);
    const owners = Array.from({ length: 40 }, () => {
      const owner = document.createElement("span");
      scope.append(owner);
      return owner;
    });
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const listenerCalls = (spy: typeof add | typeof remove) =>
      spy.mock.calls.filter(([type]) => type === "starwind:direction-change");
    const changes = vi.fn();
    const subscriptions = owners.map((owner) => subscribeDirection(owner, changes));
    const read = vi.spyOn(window, "getComputedStyle");
    try {
      expect(listenerCalls(add)).toHaveLength(1);
      scope.setAttribute("dir", "ltr");
      scope.dir = "rtl";
      expect(read).toHaveBeenCalledTimes(0);
      expect(changes).toHaveBeenCalledTimes(0);
      directionChange();
      expect(read).toHaveBeenCalledTimes(40);
      expect(changes).toHaveBeenCalledTimes(40);
      directionChange();
      expect(read).toHaveBeenCalledTimes(80);
      expect(changes).toHaveBeenCalledTimes(40);
      subscriptions.forEach((subscription) => subscription.destroy());
      subscriptions.forEach((subscription) => subscription.destroy());
      expect(listenerCalls(remove)).toHaveLength(1);
      scope.dir = "ltr";
      directionChange();
      expect(changes).toHaveBeenCalledTimes(40);
      const next = subscribeDirection(owners[0]!, changes);
      expect(next.get()).toBe("ltr");
      next.destroy();
      expect(listenerCalls(add)).toHaveLength(2);
      expect(listenerCalls(remove)).toHaveLength(2);
    } finally {
      read.mockRestore();
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it("runs projections until they settle and then runs other owners once", () => {
    const scope = document.createElement("div");
    const wrapper = document.createElement("div");
    const inner = document.createElement("span");
    scope.dir = "ltr";
    wrapper.append(inner);
    document.body.append(scope, wrapper);
    const order: string[] = [];
    // Registered before the portal, so one registration-order pass would read a stale wrapper.
    const owner = subscribeDirection(inner, (direction) => order.push(`owner:${direction}`));
    const stop = onDirectionChange(
      document,
      () => {
        order.push("projection");
        return false;
      },
      true,
    );
    const session = createPortalDirectionSession(scope, wrapper);
    expect(wrapper.dir).toBe("ltr");
    scope.dir = "rtl";
    directionChange();
    expect(wrapper.dir).toBe("rtl");
    expect(order).toEqual(["projection", "projection", "owner:rtl"]);
    session.destroy();
    stop();
    owner.destroy();
  });

  it("runs another projection pass when only a nested portal writes", () => {
    const scope = document.createElement("div");
    const parentWrapper = document.createElement("div");
    const inset = document.createElement("div");
    const nestedOwner = document.createElement("span");
    const nestedWrapper = document.createElement("div");
    const probe = document.createElement("span");
    scope.dir = "ltr";
    inset.append(nestedOwner);
    parentWrapper.append(inset);
    nestedWrapper.append(probe);
    document.body.append(scope, parentWrapper, nestedWrapper);
    const published: string[] = [];
    // Registered first, so the first pass reads the nested wrapper before it changes.
    const probeSubscription = subscribeDirection(probe, (direction) => published.push(direction), {
      projection: true,
    });
    const parentSession = createPortalDirectionSession(scope, parentWrapper);
    // Registered after the parent, so the parent pass writes the nested wrapper first.
    const nestedSession = createPortalDirectionSession(nestedOwner, nestedWrapper);
    expect([parentWrapper.dir, nestedWrapper.dir]).toEqual(["ltr", "ltr"]);
    const parentWrites = new MutationObserver(() => {});
    const nestedWrites = new MutationObserver(() => {});
    parentWrites.observe(parentWrapper, { attributeFilter: ["dir"] });
    nestedWrites.observe(nestedWrapper, { attributeFilter: ["dir"] });

    inset.dir = "rtl";
    directionChange();
    expect(parentWrites.takeRecords()).toHaveLength(0);
    expect(nestedWrites.takeRecords()).toHaveLength(1);
    expect(nestedWrapper.dir).toBe("rtl");
    expect(published).toEqual(["rtl"]);
    parentWrites.disconnect();
    nestedWrites.disconnect();
    nestedSession.destroy();
    parentSession.destroy();
    probeSubscription.destroy();
  });

  it("creates no MutationObserver for direction, portal direction, or Color Picker", () => {
    const Observer = window.MutationObserver;
    const created = vi.fn();
    window.MutationObserver = class extends Observer {
      constructor(callback: MutationCallback) {
        super(callback);
        created();
      }
    };
    try {
      const scope = document.createElement("div");
      const wrapper = document.createElement("div");
      const root = document.createElement("div");
      root.setAttribute("data-sw-color-picker", "");
      scope.append(root);
      document.body.append(scope, wrapper);
      const subscription = subscribeDirection(scope, () => {});
      const session = createPortalDirectionSession(scope, wrapper);
      const picker = createColorPicker(root);
      scope.dir = "rtl";
      directionChange();
      expect(root.dir).toBe("rtl");
      expect(wrapper.dir).toBe("rtl");
      picker.destroy();
      session.destroy();
      subscription.destroy();
      expect(created).not.toHaveBeenCalled();
    } finally {
      window.MutationObserver = Observer;
    }
  });
});
