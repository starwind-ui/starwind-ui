import { afterEach, describe, expect, it, vi } from "vitest";

import { createCombobox } from "../../src/components/combobox/combobox";
import { createNavigationMenu } from "../../src/components/navigation-menu/navigation-menu";
import { createPopover } from "../../src/components/popover/popover";
import { createSelect } from "../../src/components/select/select";
import { initStarwind } from "../../src/init-starwind";
import { createDialogTopLayerHost } from "../../src/internal/dialog-top-layer-host";
import {
  createFloatingPortalSession,
  reportPortalPlacement,
  resolvePortalPlacement,
} from "../../src/internal/floating-portal";
import {
  prepareFrameworkPortalDirection,
  releaseFrameworkPortalDirection,
} from "../../src/internal/portal-direction";
import {
  isDocumentHTMLElement,
  resolveFloatingPortalOwner,
  resolveFloatingPortalTarget,
  resolveFloatingPortalTargetOwner,
} from "../../src/internal/portal-target-policy";

afterEach(() => {
  document.body.innerHTML = "";
  document.body.removeAttribute("dir");
});

describe("owner-bound portal direction", () => {
  it.each(["factory", "initStarwind"] as const)(
    "binds a %s Popover before the first visible frame",
    async (entrypoint) => {
      document.body.dir = "ltr";
      document.body.innerHTML = `
        <section dir="rtl">
          <div data-sw-popover>
            <button data-sw-popover-trigger style="position:fixed;left:240px;top:100px;width:80px;height:32px">Open</button>
            <div data-sw-popover-portal>
              <div data-sw-popover-positioner data-side="bottom" data-align="start">
                <div data-sw-popover-popup hidden style="width:120px;height:60px;text-align:start">
                  <button data-sw-popover-close>Close</button>
                </div>
              </div>
            </div>
          </div>
        </section>`;
      const scope = document.querySelector<HTMLElement>("section")!;
      const root = scope.querySelector<HTMLElement>("[data-sw-popover]")!;
      const portal = root.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
      const popup = root.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
      const trigger = root.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
      const instance = entrypoint === "factory" ? createPopover(root) : initStarwind(scope);

      trigger.click();
      const firstFrame = await new Promise<{
        direction: string;
        popupDirection: string;
        rect: DOMRect;
        triggerRect: DOMRect;
        visible: boolean;
      }>((resolve) =>
        requestAnimationFrame(() =>
          resolve({
            direction: getComputedStyle(portal).direction,
            popupDirection: getComputedStyle(popup).direction,
            rect: popup.getBoundingClientRect(),
            triggerRect: trigger.getBoundingClientRect(),
            visible: !popup.hidden,
          }),
        ),
      );
      expect(firstFrame.visible).toBe(true);
      expect(firstFrame.direction).toBe("rtl");
      expect(firstFrame.popupDirection).toBe("rtl");
      expect(firstFrame.rect.width).toBe(120);
      expect(Math.abs(firstFrame.rect.right - firstFrame.triggerRect.right)).toBeLessThan(2);
      const positioner = portal.querySelector<HTMLElement>("[data-sw-popover-positioner]")!;
      expect(positioner.style.transformOrigin).toMatch(/^right top(?: 0px)?$/);

      instance.destroy();
    },
  );

  it("restores only projected direction after close, reopen, and destroy", async () => {
    document.body.dir = "ltr";
    document.body.innerHTML = `
      <section dir="rtl"><div id="owner"><div id="wrapper"><span dir="ltr">Local</span></div></div></section>
      <div id="target" dir="ltr"></div>`;
    const owner = document.querySelector<HTMLElement>("#owner")!;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    const target = document.querySelector<HTMLElement>("#target")!;
    const local = wrapper.querySelector<HTMLElement>("span")!;
    const readyChanges = vi.fn();
    const session = createFloatingPortalSession({
      root: owner,
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
    });
    session.onReadyChange(readyChanges);

    expect(wrapper.hasAttribute("dir")).toBe(false);
    expect(session.mount()).toBe(true);
    expect(wrapper.parentElement).toBe(target);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    expect(getComputedStyle(local).direction).toBe("ltr");
    expect(readyChanges).toHaveBeenCalledTimes(1);
    session.restore();
    expect(wrapper.parentElement).toBe(owner);
    expect(wrapper.hasAttribute("dir")).toBe(false);
    expect(readyChanges).toHaveBeenCalledTimes(2);

    expect(session.mount()).toBe(true);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    wrapper.setAttribute("dir", "auto");
    await Promise.resolve();
    owner.closest("section")!.setAttribute("dir", "ltr");
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(wrapper.getAttribute("dir")).toBe("auto");
    session.destroy();
    expect(wrapper.getAttribute("dir")).toBe("auto");
    expect(readyChanges).toHaveBeenCalledTimes(4);
  });

  it("prepares framework placement before moving and releases its authored state", () => {
    document.body.dir = "ltr";
    document.body.innerHTML = `<section dir="rtl"><div id="owner"><div id="wrapper"></div></div></section><div id="target"></div>`;
    const owner = document.querySelector<HTMLElement>("#owner")!;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    const target = document.querySelector<HTMLElement>("#target")!;
    wrapper.setAttribute("data-sw-portal-placement", "framework");

    const placement = resolvePortalPlacement(wrapper, {
      mode: "framework",
      reference: owner,
      container: target,
    });
    expect(placement.target).toBe(target);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    target.append(wrapper);
    reportPortalPlacement(wrapper, { target, ready: true });
    expect(getComputedStyle(wrapper).direction).toBe("rtl");
    reportPortalPlacement(wrapper, null);
    owner.append(wrapper);
    expect(wrapper.hasAttribute("dir")).toBe(false);
  });

  it("binds a framework portal in its own document", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    frameDocument.body.innerHTML = `
      <section dir="rtl"><div id="owner"><div id="wrapper"></div></div></section>
      <div id="target" dir="ltr"></div>`;
    const owner = frameDocument.querySelector<HTMLElement>("#owner")!;
    const wrapper = frameDocument.querySelector<HTMLElement>("#wrapper")!;
    const target = frameDocument.querySelector<HTMLElement>("#target")!;
    wrapper.setAttribute("data-sw-portal-placement", "framework");

    const placement = resolvePortalPlacement(wrapper, {
      mode: "framework",
      reference: owner,
      container: target,
    });
    expect(placement.target).toBe(target);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    target.append(wrapper);
    expect(frame.contentWindow!.getComputedStyle(wrapper).direction).toBe("rtl");
    reportPortalPlacement(wrapper, null);
    owner.append(wrapper);
    expect(wrapper.hasAttribute("dir")).toBe(false);
    wrapper.removeAttribute("data-sw-portal-placement");
    const runtimeSession = createFloatingPortalSession({
      root: owner,
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
    });
    expect(runtimeSession.mount()).toBe(true);
    expect(wrapper.parentElement).toBe(target);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    runtimeSession.destroy();
    expect(wrapper.parentElement).toBe(owner);
    expect(wrapper.hasAttribute("dir")).toBe(false);
  });

  it.each([
    ["parent", "element"],
    ["parent", "selector"],
    ["third-frame", "element"],
    ["third-frame", "selector"],
  ] as const)(
    "keeps a %s-created adopted %s target and public Popover in its logical iframe owner",
    async (creation, kind) => {
      const frame = document.createElement("iframe");
      frame.style.width = "800px";
      frame.style.height = "500px";
      document.body.append(frame);
      const sourceFrame = document.createElement("iframe");
      if (creation === "third-frame") document.body.append(sourceFrame);
      const sourceDocument = creation === "third-frame" ? sourceFrame.contentDocument! : document;
      const ownerDocument = frame.contentDocument!;
      ownerDocument.body.dir = "ltr";
      const host = sourceDocument.createElement("div");
      host.id = "adopted-floating-root";
      host.dir = "rtl";
      host.setAttribute("data-floating-root", "");
      ownerDocument.body.append(host);
      const root = document.createElement("div");
      root.setAttribute("data-sw-popover", "");
      root.innerHTML = `<button data-sw-popover-trigger style="position:fixed;left:240px;top:100px;width:80px;height:32px">Open</button><div data-sw-popover-portal><div data-sw-popover-positioner data-side="bottom" data-align="start"><div data-sw-popover-popup hidden style="width:120px;height:60px">Popup</div></div></div>`;
      host.append(root);
      const trigger = root.querySelector<HTMLButtonElement>("[data-sw-popover-trigger]")!;
      const portal = root.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
      const popup = root.querySelector<HTMLElement>("[data-sw-popover-popup]")!;
      const container = kind === "element" ? host : "#adopted-floating-root";
      const FrameHTMLElement = (frame.contentWindow as Window & typeof globalThis).HTMLElement;
      expect(host.ownerDocument).toBe(ownerDocument);
      expect(host instanceof HTMLElement).toBe(creation === "parent");
      expect(host instanceof FrameHTMLElement).toBe(false);
      expect(resolveFloatingPortalTarget(trigger)).toBe(host);
      expect(resolvePortalPlacement(portal, { container, reference: trigger }).target).toBe(host);

      const popover = createPopover(root);
      try {
        popover.setOpen(true, { emit: false });
        const firstFrame = await new Promise<{
          direction: string;
          visible: boolean;
          popupRect: DOMRect;
          triggerRect: DOMRect;
        }>((resolve) =>
          requestAnimationFrame(() =>
            resolve({
              direction: frame.contentWindow!.getComputedStyle(popup).direction,
              visible: !popup.hidden,
              popupRect: popup.getBoundingClientRect(),
              triggerRect: trigger.getBoundingClientRect(),
            }),
          ),
        );
        expect(firstFrame.direction).toBe("rtl");
        expect(firstFrame.visible).toBe(true);
        expect(firstFrame.popupRect.width).toBe(120);
        expect(Math.abs(firstFrame.popupRect.right - firstFrame.triggerRect.right)).toBeLessThan(2);
        expect(portal.parentElement).toBe(host);
        expect(popover.getOpen()).toBe(true);

        popover.setOpen(false, { emit: false });
        popover.setOpen(true, { emit: false });
        expect(portal.parentElement).toBe(host);
        expect(frame.contentWindow!.getComputedStyle(popup).direction).toBe("rtl");
      } finally {
        popover.destroy();
      }
      expect(portal.parentElement).toBe(root);
      expect(portal.hasAttribute("dir")).toBe(false);
      frame.remove();
      sourceFrame.remove();
    },
  );

  it("uses adopted logical owners and dialog floating roots in the same iframe", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const ownerDocument = frame.contentDocument!;
    ownerDocument.body.dir = "ltr";
    const owner = document.createElement("div");
    owner.id = "logical-owner";
    owner.dir = "rtl";
    ownerDocument.body.append(owner);
    const wrapper = document.createElement("div");
    ownerDocument.body.append(wrapper);
    prepareFrameworkPortalDirection(wrapper, owner);
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    expect(frame.contentWindow!.getComputedStyle(wrapper).direction).toBe("rtl");
    releaseFrameworkPortalDirection(wrapper);
    expect(wrapper.hasAttribute("dir")).toBe(false);

    const sourceFrame = document.createElement("iframe");
    document.body.append(sourceFrame);
    const dialog = sourceFrame.contentDocument!.createElement("dialog");
    dialog.id = "adopted-dialog";
    dialog.dir = "rtl";
    dialog.setAttribute("data-sw-dialog-content", "");
    const floatingRoot = sourceFrame.contentDocument!.createElement("div");
    floatingRoot.setAttribute("data-floating-root", "");
    dialog.append(floatingRoot);
    const reference = document.createElement("button");
    dialog.append(reference);
    ownerDocument.body.append(dialog);
    expect(
      dialog instanceof (frame.contentWindow as Window & typeof globalThis).HTMLDialogElement,
    ).toBe(false);
    expect(dialog instanceof HTMLDialogElement).toBe(false);
    expect(resolveFloatingPortalOwner(reference)).toBe(dialog);
    expect(resolveFloatingPortalTarget(reference)).toBe(floatingRoot);
    expect(resolveFloatingPortalTargetOwner(floatingRoot)).toBe(dialog);

    const foreign = document.createElement("div");
    document.body.append(foreign);
    const svg = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    ownerDocument.body.append(svg);
    const disconnected = ownerDocument.createElement("div");
    const fake = {
      ownerDocument,
      isConnected: true,
      nodeType: 1,
      namespaceURI: "http://www.w3.org/1999/xhtml",
      localName: "div",
    } as unknown as Element;
    expect(isDocumentHTMLElement(fake, ownerDocument)).toBe(false);
    for (const invalid of [foreign, svg, disconnected, fake]) {
      expect(resolveFloatingPortalTarget(reference, { explicitTargets: [invalid] })).toBe(
        floatingRoot,
      );
      expect(resolvePortalPlacement(wrapper, { container: invalid, reference }).target).toBe(
        floatingRoot,
      );
    }

    const picker = document.createElement("div");
    picker.dir = "rtl";
    picker.setAttribute("data-sw-color-picker", "");
    const pickerTarget = document.createElement("div");
    pickerTarget.id = "picker-target";
    const pickerPortal = document.createElement("div");
    picker.append(pickerTarget, pickerPortal);
    ownerDocument.body.append(picker);
    expect(
      resolvePortalPlacement(pickerPortal, { container: pickerTarget, reference: picker }).target,
    ).toBe(pickerTarget);
    expect(
      resolvePortalPlacement(pickerPortal, { container: "#picker-target", reference: picker })
        .target,
    ).toBe(pickerTarget);
    for (const invalid of [foreign, svg, disconnected, fake]) {
      expect(
        resolvePortalPlacement(pickerPortal, { container: invalid, reference: picker }).target,
      ).toBe(picker);
    }
    frame.remove();
    sourceFrame.remove();
    foreign.remove();
  });

  it("accepts a delayed HTML target in a document without a browsing context", () => {
    const ownerDocument = document.implementation.createHTMLDocument("Detached portal owner");
    expect(ownerDocument.defaultView).toBeNull();
    ownerDocument.body.innerHTML = `<section><div id="owner"><div id="wrapper"></div></div></section>`;
    const owner = ownerDocument.querySelector<HTMLElement>("#owner")!;
    const wrapper = ownerDocument.querySelector<HTMLElement>("#wrapper")!;
    wrapper.setAttribute("data-sw-portal-placement", "framework");

    const options = { mode: "framework" as const, reference: owner, container: "#late-target" };
    expect(resolvePortalPlacement(wrapper, options).target).toBe(ownerDocument.body);

    const target = ownerDocument.createElement("div");
    target.id = "late-target";
    ownerDocument.body.append(target);
    expect(resolvePortalPlacement(wrapper, options).target).toBe(target);
    target.append(wrapper);
    reportPortalPlacement(wrapper, { target, ready: true });
    expect(resolvePortalPlacement(wrapper, options).ready).toBe(true);

    const svg = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
    ownerDocument.body.append(svg);
    expect(resolveFloatingPortalTarget(owner, { explicitTargets: [svg] })).toBe(ownerDocument.body);
    const foreignTarget = document.createElement("div");
    document.body.append(foreignTarget);
    expect(resolveFloatingPortalTarget(owner, { explicitTargets: [foreignTarget] })).toBe(
      ownerDocument.body,
    );

    reportPortalPlacement(wrapper, null);
    owner.append(wrapper);
    expect(wrapper.hasAttribute("dir")).toBe(false);
  });

  it("recognizes a native dialog and floating root in a document without a browsing context", () => {
    const ownerDocument = document.implementation.createHTMLDocument("Detached dialog owner");
    ownerDocument.body.innerHTML = `<dialog data-sw-dialog-content><div data-floating-root></div><div id="owner"></div></dialog>`;
    const dialog = ownerDocument.querySelector<HTMLDialogElement>("dialog")!;
    const owner = ownerDocument.querySelector<HTMLElement>("#owner")!;
    const floatingRoot = ownerDocument.querySelector<HTMLElement>("[data-floating-root]")!;

    expect(resolveFloatingPortalOwner(owner)).toBe(dialog);
    expect(resolveFloatingPortalTarget(owner)).toBe(floatingRoot);
    expect(resolveFloatingPortalTarget(owner, { explicitTargets: [ownerDocument.body] })).toBe(
      floatingRoot,
    );
  });

  it("binds a native dialog floating host before its first visible frame", async () => {
    document.body.dir = "ltr";
    document.body.innerHTML = `
      <dialog data-sw-dialog-content dir="rtl">
        <div id="owner"><div id="wrapper">Content</div></div>
      </dialog>`;
    const dialog = document.querySelector<HTMLDialogElement>("dialog")!;
    const owner = document.querySelector<HTMLElement>("#owner")!;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    dialog.showModal();
    const host = createDialogTopLayerHost(dialog);
    expect(host.show()).toBe(true);
    const session = createFloatingPortalSession({
      root: owner,
      getPortalElement: () => wrapper,
      getPortalTarget: () => host.floatingRoot,
    });
    expect(session.mount()).toBe(true);

    const firstFrame = await new Promise<{ direction: string; visible: boolean }>((resolve) =>
      requestAnimationFrame(() =>
        resolve({
          direction: getComputedStyle(wrapper).direction,
          visible: host.host.matches(":popover-open"),
        }),
      ),
    );
    expect(wrapper.parentElement).toBe(host.floatingRoot);
    expect(firstFrame).toEqual({ direction: "rtl", visible: true });
    session.destroy();
    host.destroy();
    dialog.close();
    expect(wrapper.parentElement).toBe(owner);
    expect(wrapper.hasAttribute("dir")).toBe(false);
  });

  it("repositions an authored auto surface on a direction-change event after its text changes", async () => {
    document.body.innerHTML = `
      <section dir="rtl"><div id="owner"><div id="wrapper" dir="auto">محتوى</div></div></section>
      <div id="target" dir="ltr"></div>`;
    const owner = document.querySelector<HTMLElement>("#owner")!;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    const target = document.querySelector<HTMLElement>("#target")!;
    const session = createFloatingPortalSession({
      root: owner,
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
    });
    const onDirectionChange = vi.fn();
    session.onDirectionChange(onDirectionChange);
    session.mount();
    expect(getComputedStyle(wrapper).direction).toBe("rtl");

    wrapper.textContent = "Content";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(getComputedStyle(wrapper).direction).toBe("ltr");
    expect(onDirectionChange).not.toHaveBeenCalled();
    document.dispatchEvent(new Event("starwind:direction-change"));
    expect(onDirectionChange).toHaveBeenCalledTimes(1);
    session.destroy();
    const callsAfterDestroy = onDirectionChange.mock.calls.length;
    wrapper.textContent = "محتوى";
    owner.closest("section")!.dir = "ltr";
    document.dispatchEvent(new Event("starwind:direction-change"));
    expect(onDirectionChange).toHaveBeenCalledTimes(callsAfterDestroy);
    expect(wrapper.getAttribute("dir")).toBe("auto");
  });

  it("copies the owner direction to an open portal at the next position compute", () => {
    document.body.innerHTML = `
      <section dir="rtl"><div id="owner"></div></section>
      <div id="wrapper"></div><div id="target" dir="ltr"></div>`;
    const scope = document.querySelector("section")!;
    const owner = document.querySelector<HTMLElement>("#owner")!;
    const wrapper = document.querySelector<HTMLElement>("#wrapper")!;
    const target = document.querySelector<HTMLElement>("#target")!;
    const session = createFloatingPortalSession({
      root: owner,
      getPortalElement: () => wrapper,
      getPortalTarget: () => target,
    });
    const onDirectionChange = vi.fn();
    session.onDirectionChange(onDirectionChange);
    session.mount();
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    scope.dir = "ltr";
    expect(wrapper.getAttribute("dir")).toBe("rtl");
    session.syncDirection();
    expect(wrapper.getAttribute("dir")).toBe("ltr");
    expect(onDirectionChange).toHaveBeenCalledTimes(1);
    session.syncDirection();
    expect(onDirectionChange).toHaveBeenCalledTimes(1);
    session.destroy();
    expect(wrapper.hasAttribute("dir")).toBe(false);
  });

  it.each(["Popover", "Select"] as const)(
    "copies a dir flip with no event to an open %s portal on a scroll or resize recompute",
    async (component) => {
      document.body.dir = "ltr";
      document.body.innerHTML =
        component === "Popover"
          ? `
        <section dir="ltr">
          <div data-sw-popover>
            <button data-sw-popover-trigger style="position:fixed;left:240px;top:100px;width:80px;height:32px">Open</button>
            <div data-sw-popover-portal>
              <div data-sw-popover-positioner data-side="bottom" data-align="start">
                <div data-sw-popover-popup hidden style="width:120px;height:60px">Popup</div>
              </div>
            </div>
          </div>
        </section>`
          : `
        <section dir="ltr">
          <div data-sw-select data-modal="false">
            <button data-sw-select-trigger style="position:fixed;left:240px;top:100px;width:80px;height:32px"><span data-sw-select-value></span></button>
            <div data-sw-select-portal>
              <div data-sw-select-positioner data-side="bottom" data-align="start" data-align-item-with-trigger="false">
                <div data-sw-select-popup data-align-item-with-trigger="false" hidden style="width:120px;height:60px">
                  <div data-sw-select-list>
                    <div data-sw-select-item data-value="one"><span data-sw-select-item-text>One</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>`;
      const prefix = component === "Popover" ? "popover" : "select";
      const scope = document.querySelector<HTMLElement>("section")!;
      const root = scope.querySelector<HTMLElement>(`[data-sw-${prefix}]`)!;
      const trigger = root.querySelector<HTMLButtonElement>(`[data-sw-${prefix}-trigger]`)!;
      const portal = root.querySelector<HTMLElement>(`[data-sw-${prefix}-portal]`)!;
      const positioner = root.querySelector<HTMLElement>(`[data-sw-${prefix}-positioner]`)!;
      const popup = root.querySelector<HTMLElement>(`[data-sw-${prefix}-popup]`)!;
      // Popover positions its positioner. Select positions its popup.
      const floating = component === "Popover" ? positioner : popup;
      const instance = component === "Popover" ? createPopover(root) : createSelect(root);
      const settle = async () => {
        for (let frame = 0; frame < 3; frame++) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      };
      const edges = () => {
        const popupRect = popup.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();
        return {
          left: Math.abs(popupRect.left - triggerRect.left) < 2,
          right: Math.abs(popupRect.right - triggerRect.right) < 2,
        };
      };
      try {
        trigger.click();
        await settle();
        expect(popup.hidden).toBe(false);
        expect(portal.parentElement).not.toBe(root);
        expect(portal.getAttribute("dir")).toBe("ltr");
        expect(edges()).toEqual({ left: true, right: false });
        expect(floating.style.transformOrigin).toMatch(/^left top(?: 0px)?$/);

        const writes = new MutationObserver(() => {});
        writes.observe(portal, { attributeFilter: ["dir"] });
        scope.dir = "rtl";
        await settle();
        // With no event and no recompute, the wrapper keeps its last projection.
        expect(portal.getAttribute("dir")).toBe("ltr");
        expect(writes.takeRecords()).toHaveLength(0);

        window.dispatchEvent(new Event("scroll"));
        // The recompute copies the owner direction before it computes the position.
        expect(portal.getAttribute("dir")).toBe("rtl");
        expect(writes.takeRecords()).toHaveLength(1);
        await settle();
        expect(edges()).toEqual({ left: false, right: true });
        expect(floating.style.transformOrigin).toMatch(/^right top(?: 0px)?$/);

        for (let index = 0; index < 4; index++) {
          window.dispatchEvent(new Event(index % 2 === 0 ? "scroll" : "resize"));
          await settle();
        }
        expect(writes.takeRecords()).toHaveLength(0);
        expect(portal.getAttribute("dir")).toBe("rtl");
        writes.disconnect();
      } finally {
        instance.destroy();
      }
    },
  );

  it.each(["Combobox", "aligned Select", "Navigation Menu"] as const)(
    "copies a dir flip to an open %s portal on a direction-change event and on a scroll recompute",
    async (component) => {
      document.body.dir = "ltr";
      const markup = {
        Combobox: `
          <div data-sw-combobox>
            <div data-sw-combobox-input-group>
              <input data-sw-combobox-input aria-label="Fruit" />
              <button data-sw-combobox-trigger type="button" style="position:fixed;left:240px;top:100px;width:80px;height:32px">Open</button>
            </div>
            <div data-sw-combobox-portal>
              <div data-sw-combobox-positioner data-side="bottom" data-align="start">
                <div data-sw-combobox-popup hidden style="width:120px;height:60px">
                  <div data-sw-combobox-list>
                    <div data-sw-combobox-item data-value="one"><span data-sw-combobox-item-text>One</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        // A trigger this close to the viewport edge cannot align the item with the trigger, so
        // the aligned Select falls back to its own floating autoUpdate.
        "aligned Select": `
          <div data-sw-select data-modal="false">
            <button data-sw-select-trigger style="position:fixed;left:240px;top:4px;width:80px;height:32px"><span data-sw-select-value></span></button>
            <div data-sw-select-portal>
              <div data-sw-select-positioner data-side="bottom" data-align="start">
                <div data-sw-select-popup hidden style="width:120px;height:60px">
                  <div data-sw-select-list>
                    <div data-sw-select-item data-value="one"><span data-sw-select-item-text>One</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>`,
        "Navigation Menu": `
          <nav data-sw-nav-menu aria-label="Main">
            <ul data-sw-nav-menu-list>
              <li data-sw-nav-menu-item data-value="one">
                <button type="button" data-sw-nav-menu-trigger style="position:fixed;left:240px;top:100px;width:80px;height:32px">One</button>
                <div data-sw-nav-menu-content><a href="#one">Link</a></div>
              </li>
            </ul>
            <div data-sw-nav-menu-portal>
              <div data-sw-nav-menu-positioner>
                <div data-sw-nav-menu-popup hidden><div data-sw-nav-menu-viewport></div></div>
              </div>
            </div>
          </nav>`,
      }[component];
      document.body.innerHTML = `<section dir="ltr">${markup}</section>`;
      const prefix = {
        Combobox: "combobox",
        "aligned Select": "select",
        "Navigation Menu": "nav-menu",
      }[component];
      const scope = document.querySelector<HTMLElement>("section")!;
      const root = scope.querySelector<HTMLElement>(`[data-sw-${prefix}]`)!;
      const trigger = root.querySelector<HTMLButtonElement>(`[data-sw-${prefix}-trigger]`)!;
      const portal = root.querySelector<HTMLElement>(`[data-sw-${prefix}-portal]`)!;
      const popup = root.querySelector<HTMLElement>(`[data-sw-${prefix}-popup]`)!;
      const instance =
        component === "Combobox"
          ? createCombobox(root)
          : component === "aligned Select"
            ? createSelect(root)
            : createNavigationMenu(root);
      const settle = async () => {
        for (let frame = 0; frame < 3; frame++) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
      };
      try {
        trigger.click();
        await settle();
        expect(popup.hidden).toBe(false);
        expect(portal.parentElement).not.toBe(root);
        expect(portal.getAttribute("dir")).toBe("ltr");

        scope.dir = "rtl";
        document.dispatchEvent(new Event("starwind:direction-change"));
        expect(portal.getAttribute("dir")).toBe("rtl");
        await settle();

        scope.dir = "ltr";
        await settle();
        // With no event and no recompute, the wrapper keeps its last projection.
        expect(portal.getAttribute("dir")).toBe("rtl");

        window.dispatchEvent(new Event("scroll"));
        // The autoUpdate recompute copies the owner direction.
        expect(portal.getAttribute("dir")).toBe("ltr");
      } finally {
        instance.destroy();
      }
    },
  );

  it("updates nested open portals on a direction-change event after an owner flip", async () => {
    document.body.dir = "ltr";
    document.body.innerHTML = `
      <section dir="rtl"><div id="parent-owner"><div id="parent-wrapper"><div id="child-owner"><div id="child-wrapper"></div></div></div></div></section>
      <div id="target"></div>`;
    const scope = document.querySelector<HTMLElement>("section")!;
    const parentOwner = document.querySelector<HTMLElement>("#parent-owner")!;
    const parentWrapper = document.querySelector<HTMLElement>("#parent-wrapper")!;
    const childOwner = document.querySelector<HTMLElement>("#child-owner")!;
    const childWrapper = document.querySelector<HTMLElement>("#child-wrapper")!;
    const target = document.querySelector<HTMLElement>("#target")!;
    const parentSession = createFloatingPortalSession({
      root: parentOwner,
      getPortalElement: () => parentWrapper,
      getPortalTarget: () => target,
    });
    const childSession = createFloatingPortalSession({
      root: childOwner,
      getPortalElement: () => childWrapper,
      getPortalTarget: () => target,
    });
    parentSession.mount();
    childSession.mount();
    expect(parentWrapper.getAttribute("dir")).toBe("rtl");
    expect(childWrapper.getAttribute("dir")).toBe("rtl");

    scope.dir = "ltr";
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect([parentWrapper.getAttribute("dir"), childWrapper.getAttribute("dir")]).toEqual([
      "rtl",
      "rtl",
    ]);
    scope.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    expect([parentWrapper.getAttribute("dir"), childWrapper.getAttribute("dir")]).toEqual([
      "ltr",
      "ltr",
    ]);
    childSession.destroy();
    parentSession.destroy();
  });
});
