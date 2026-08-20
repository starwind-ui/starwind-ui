import * as React from "react";
import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import AlertDialogPortal from "../src/alert-dialog/AlertDialogPortal";
import { AlertDialog } from "../src/alert-dialog/index";
import ComboboxPortal from "../src/combobox/ComboboxPortal";
import { Combobox } from "../src/combobox/index";
import DrawerPortal from "../src/drawer/DrawerPortal";
import type { ReactPortalContainer } from "../src/internal/portal";
import MenuPortal from "../src/menu/MenuPortal";
import NavigationMenuPortal from "../src/navigation-menu/NavigationMenuPortal";
import { Popover } from "../src/popover/index";
import { Menu } from "../src/menu/index";
import { NavigationMenu } from "../src/navigation-menu/index";
import PreviewCardPortal from "../src/preview-card/PreviewCardPortal";
import SelectPortal from "../src/select/SelectPortal";
import { Select } from "../src/select/index";
import TooltipPortal from "../src/tooltip/TooltipPortal";
import { createCombobox } from "@starwind-ui/runtime/combobox";
import { createMenu } from "@starwind-ui/runtime/menu";
import { createSelect } from "@starwind-ui/runtime/select";
import StyledPopover from "../../../apps/react-demo/src/components/starwind-runtime/popover/Popover";
import StyledPopoverContent from "../../../apps/react-demo/src/components/starwind-runtime/popover/PopoverContent";
import StyledPopoverTrigger from "../../../apps/react-demo/src/components/starwind-runtime/popover/PopoverTrigger";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const portalParts = [
  ["alert-dialog", AlertDialogPortal, "data-sw-alert-dialog-portal"],
  ["combobox", ComboboxPortal, "data-sw-combobox-portal"],
  ["drawer", DrawerPortal, "data-sw-drawer-portal"],
  ["menu", MenuPortal, "data-sw-menu-portal"],
  ["navigation-menu", NavigationMenuPortal, "data-sw-nav-menu-portal"],
  ["popover", Popover.Portal, "data-sw-popover-portal"],
  ["preview-card", PreviewCardPortal, "data-sw-preview-card-portal"],
  ["select", SelectPortal, "data-sw-select-portal"],
  ["tooltip", TooltipPortal, "data-sw-tooltip-portal"],
] as const;

const PortalContext = React.createContext("missing");

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  document.querySelectorAll("[data-ticket08-target]").forEach((node) => node.remove());
  reactRoot = undefined;
  container = undefined;
});

describe("React-owned Portal parts", () => {
  it("places all nine public wrappers while preserving context, logical events, native props, and refs", async () => {
    const refs = portalParts.map(() => React.createRef<HTMLDivElement>());
    const onLogicalClick = vi.fn();
    const onPortalPointerDown = vi.fn();

    await mount(
      <PortalContext.Provider value="available">
        <div onClick={onLogicalClick}>
          {portalParts.map(([family, Portal], index) => (
            <Portal
              data-ticket08-family={family}
              key={family}
              onPointerDown={onPortalPointerDown}
              ref={refs[index]}
            >
              <ContextConsumer family={family} />
            </Portal>
          ))}
        </div>
      </PortalContext.Provider>,
    );

    for (const [index, [family, , attribute]] of portalParts.entries()) {
      const wrapper = document.querySelector<HTMLDivElement>(`[${attribute}]`)!;
      expect(wrapper.parentElement).toBe(document.body);
      expect(wrapper).toHaveAttribute("data-placement", "ready");
      expect(wrapper).toHaveAttribute("data-sw-portal-placement", "framework");
      expect(wrapper.textContent).toBe(`${family}:available`);
      expect(refs[index].current).toBe(wrapper);
    }

    const child = document.querySelector<HTMLButtonElement>('[data-ticket08-child="popover"]')!;
    await act(() => {
      child.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      child.click();
    });
    expect(onPortalPointerDown).toHaveBeenCalledTimes(1);
    expect(onLogicalClick).toHaveBeenCalledTimes(1);

    await act(() => reactRoot?.unmount());
    reactRoot = undefined;
    expect(refs.every((ref) => ref.current === null)).toBe(true);
    for (const [, , attribute] of portalParts) {
      expect(document.querySelector(`[${attribute}]`)).toBeNull();
    }
  });

  it("follows selector, element, ref, disabled, and disconnected target changes with Runtime rebound", async () => {
    const firstTarget = createTarget("first");
    const secondTarget = createTarget("second");
    const disconnectedTarget = document.createElement("section");
    const portalRef = React.createRef<HTMLDivElement>();
    let setPortalOptions: React.Dispatch<
      React.SetStateAction<{ container: ReactPortalContainer; disabled: boolean }>
    > = () => undefined;

    function Harness() {
      const [portalOptions, setOptions] = React.useState<{
        container: ReactPortalContainer;
        disabled: boolean;
      }>({ container: "#ticket08-first", disabled: false });
      setPortalOptions = setOptions;

      return (
        <Popover.Root defaultOpen modal={false}>
          <Popover.Trigger data-ticket08-trigger>Toggle</Popover.Trigger>
          <Popover.Portal {...portalOptions} ref={portalRef}>
            <Popover.Positioner>
              <Popover.Popup keepMounted data-ticket08-popup>
                Content
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    await mount(
      <React.StrictMode>
        <Harness />
      </React.StrictMode>,
    );
    const firstWrapper = portalRef.current!;
    expect(firstWrapper.parentElement).toBe(firstTarget);
    expect(firstWrapper).toHaveAttribute("data-placement", "ready");

    await update(() => setPortalOptions({ container: secondTarget, disabled: false }));
    const secondWrapper = portalRef.current!;
    expect(secondWrapper).not.toBe(firstWrapper);
    expect(secondWrapper.parentElement).toBe(secondTarget);
    expect(firstTarget.querySelector("[data-sw-popover-portal]")).toBeNull();

    await update(() => setPortalOptions({ container: { current: firstTarget }, disabled: false }));
    expect(portalRef.current?.parentElement).toBe(firstTarget);

    await update(() => setPortalOptions({ container: secondTarget, disabled: true }));
    expect(portalRef.current?.parentElement).toHaveAttribute("data-sw-popover");
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    await update(() => setPortalOptions({ container: disconnectedTarget, disabled: false }));
    expect(portalRef.current?.parentElement).toBe(document.body);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    const trigger = document.querySelector<HTMLButtonElement>("[data-ticket08-trigger]")!;
    const popup = document.querySelector<HTMLElement>("[data-ticket08-popup]")!;
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(popup.hidden).toBe(false);
    await act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(popup.hidden).toBe(true);
    expect(document.querySelectorAll("[data-sw-popover-portal]")).toHaveLength(1);
  });

  it("forwards public Styled portal controls through target, inline, and target return", async () => {
    let setDisablePortal: React.Dispatch<React.SetStateAction<boolean>> = () => undefined;

    function Harness() {
      const [disablePortal, updateDisablePortal] = React.useState(false);
      setDisablePortal = updateDisablePortal;

      return (
        <>
          <section id="ticket12-styled-target" />
          <StyledPopover defaultOpen id="ticket12-styled-popover" modal={false}>
            <StyledPopoverTrigger>Styled portal trigger</StyledPopoverTrigger>
            <StyledPopoverContent
              disablePortal={disablePortal}
              keepMounted
              portalContainer="#ticket12-styled-target"
            >
              Styled portal content
            </StyledPopoverContent>
          </StyledPopover>
        </>
      );
    }

    await mount(<Harness />);
    const target = document.querySelector<HTMLElement>("#ticket12-styled-target")!;
    const root = document.querySelector<HTMLElement>("#ticket12-styled-popover")!;
    const getPortal = () => document.querySelector<HTMLElement>('[data-slot="popover-portal"]')!;

    expect(getPortal().parentElement).toBe(target);
    expect(getPortal()).toHaveAttribute("data-placement", "ready");

    await update(() => setDisablePortal(true));
    expect(root.contains(getPortal())).toBe(true);
    expect(target.querySelector('[data-slot="popover-portal"]')).toBeNull();
    expect(getPortal()).toHaveAttribute("data-disabled");

    await update(() => setDisablePortal(false));
    expect(getPortal().parentElement).toBe(target);
    expect(getPortal()).not.toHaveAttribute("data-disabled");
    expect(getPortal()).toHaveAttribute("data-placement", "ready");
  });

  it("re-resolves a stable selector when its target is replaced, removed, and restored", async () => {
    const firstTarget = createTarget("stable-selector");
    const portalRef = React.createRef<HTMLDivElement>();
    const placements: string[] = [];
    const placementObserver = new MutationObserver((records) => {
      for (const record of records) {
        if (!(record.target instanceof HTMLElement)) continue;
        if (!record.target.hasAttribute("data-sw-popover-portal")) continue;
        placements.push(record.target.getAttribute("data-placement") ?? "missing");
      }
    });
    placementObserver.observe(document.body, {
      attributeFilter: ["data-placement"],
      attributes: true,
      subtree: true,
    });

    await mount(
      <Popover.Root defaultOpen modal={false}>
        <Popover.Trigger>Toggle</Popover.Trigger>
        <Popover.Portal container="#ticket08-stable-selector" ref={portalRef}>
          <Popover.Positioner>
            <Popover.Popup keepMounted>Content</Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );
    expect(portalRef.current?.parentElement).toBe(firstTarget);

    const replacementTarget = makeTarget("stable-selector");
    await mutateAndWaitForPortalParent(portalRef, replacementTarget, () => {
      firstTarget.remove();
      document.body.append(replacementTarget);
    });
    expect(portalRef.current?.parentElement).toBe(replacementTarget);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    await mutateAndWaitForPortalParent(portalRef, document.body, () => replacementTarget.remove());
    expect(portalRef.current?.parentElement).toBe(document.body);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    const restoredTarget = makeTarget("stable-selector");
    await mutateAndWaitForPortalParent(portalRef, restoredTarget, () => {
      document.body.append(restoredTarget);
    });
    expect(portalRef.current?.parentElement).toBe(restoredTarget);
    expect(placements).toContain("pending");
    placementObserver.disconnect();
  });

  it("falls back and returns when a stable element target disconnects and reconnects", async () => {
    const stableTarget = createTarget("stable-element");
    const portalRef = React.createRef<HTMLDivElement>();

    await mount(
      <Popover.Portal container={stableTarget} ref={portalRef}>
        <span>Stable element content</span>
      </Popover.Portal>,
    );
    expect(portalRef.current?.parentElement).toBe(stableTarget);

    await mutateAndWaitForPortalParent(portalRef, document.body, () => stableTarget.remove());
    expect(portalRef.current?.parentElement).toBe(document.body);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    await mutateAndWaitForPortalParent(portalRef, stableTarget, () => {
      document.body.append(stableTarget);
    });
    expect(portalRef.current?.parentElement).toBe(stableTarget);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");
  });

  it("re-resolves a stable RefObject when current changes during a parent lifecycle", async () => {
    const firstTarget = createTarget("stable-ref-first");
    const secondTarget = createTarget("stable-ref-second");
    const stableContainerRef: React.RefObject<HTMLElement | null> = { current: firstTarget };
    const portalRef = React.createRef<HTMLDivElement>();
    let refreshParent = () => undefined;

    function Harness() {
      const [, setRevision] = React.useState(0);
      refreshParent = () => setRevision((current) => current + 1);
      return (
        <Popover.Portal container={stableContainerRef} ref={portalRef}>
          <span>Stable ref content</span>
        </Popover.Portal>
      );
    }

    await mount(<Harness />);
    expect(portalRef.current?.parentElement).toBe(firstTarget);

    stableContainerRef.current = secondTarget;
    await update(refreshParent);
    expect(portalRef.current?.parentElement).toBe(secondTarget);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");

    stableContainerRef.current = null;
    await update(refreshParent);
    expect(portalRef.current?.parentElement).toBe(document.body);
    expect(portalRef.current).toHaveAttribute("data-placement", "ready");
  });

  it("hydrates the inline first render before moving the public wrapper", async () => {
    container = document.createElement("div");
    document.body.append(container);
    const node = (
      <Popover.Portal data-ticket08-hydration>
        <span>Hydrated content</span>
      </Popover.Portal>
    );
    container.innerHTML = renderToString(node);
    expect(container.querySelector("[data-ticket08-hydration]")).toHaveAttribute(
      "data-placement",
      "pending",
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => {
      reactRoot = hydrateRoot(container!, node);
      await Promise.resolve();
      await Promise.resolve();
    });

    const wrapper = document.querySelector<HTMLElement>("[data-ticket08-hydration]")!;
    expect(wrapper.parentElement).toBe(document.body);
    expect(wrapper).toHaveAttribute("data-placement", "ready");
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("registers main and submenu Portals by stable key through Strict Mode cleanup", async () => {
    await mount(
      <React.StrictMode>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal data-ticket11-portal="main">
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
                  <Menu.Portal data-ticket11-portal="submenu">
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Item>Nested action</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </React.StrictMode>,
    );

    const wrappers = document.querySelectorAll<HTMLElement>("[data-ticket11-portal]");
    expect(wrappers).toHaveLength(2);
    expect([...wrappers].every((wrapper) => wrapper.parentElement === document.body)).toBe(true);
    expect([...wrappers].every((wrapper) => wrapper.dataset.placement === "ready")).toBe(true);

    await act(() => reactRoot?.unmount());
    reactRoot = undefined;
    expect(document.querySelectorAll("[data-ticket11-portal]")).toHaveLength(0);
  });

  it("rebinds list, native Dialog, and Navigation Menu controllers after target replacement", async () => {
    const firstTarget = createTarget("category-first");
    const secondTarget = createTarget("category-second");
    let setTarget: React.Dispatch<React.SetStateAction<HTMLElement>> = () => undefined;

    function Harness() {
      const [target, updateTarget] = React.useState(firstTarget);
      setTarget = updateTarget;
      return (
        <>
          <Menu.Root defaultOpen>
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal container={target} data-ticket11-category="menu">
              <Menu.Positioner>
                <Menu.Popup data-ticket11-menu-popup>
                  <Menu.Item>Action</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          <AlertDialog.Root defaultOpen>
            <AlertDialog.Portal container={target} data-ticket11-category="dialog">
              <AlertDialog.Backdrop />
              <AlertDialog.Popup data-ticket11-dialog-popup>
                <AlertDialog.Title>Confirm</AlertDialog.Title>
                <AlertDialog.Description>Confirm this action</AlertDialog.Description>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
          <NavigationMenu.Root openDelay={0} closeDelay={0}>
            <NavigationMenu.List>
              <NavigationMenu.Item value="products">
                <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
                <NavigationMenu.Content>
                  <NavigationMenu.Link href="#products">Products link</NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            <NavigationMenu.Portal container={target} data-ticket11-category="navigation-menu">
              <NavigationMenu.Positioner>
                <NavigationMenu.Popup data-ticket11-navigation-popup>
                  <NavigationMenu.Viewport />
                </NavigationMenu.Popup>
              </NavigationMenu.Positioner>
            </NavigationMenu.Portal>
          </NavigationMenu.Root>
        </>
      );
    }

    await mount(<Harness />);
    const navigationTrigger = document.querySelector<HTMLElement>("[data-sw-nav-menu-trigger]")!;
    await act(() => navigationTrigger.click());
    const firstMenuPopup = document.querySelector<HTMLElement>("[data-ticket11-menu-popup]")!;
    const firstDialog = document.querySelector<HTMLDialogElement>("[data-ticket11-dialog-popup]")!;
    const firstNavigationPopup = document.querySelector<HTMLElement>(
      "[data-ticket11-navigation-popup]",
    )!;
    expect(firstMenuPopup.hidden).toBe(false);
    expect(firstDialog.open).toBe(true);
    expect(firstNavigationPopup.hidden).toBe(false);

    await update(() => setTarget(secondTarget));

    const secondMenuPopup = document.querySelector<HTMLElement>("[data-ticket11-menu-popup]")!;
    const secondDialog = document.querySelector<HTMLDialogElement>("[data-ticket11-dialog-popup]")!;
    const secondNavigationPopup = document.querySelector<HTMLElement>(
      "[data-ticket11-navigation-popup]",
    )!;
    expect(secondMenuPopup).not.toBe(firstMenuPopup);
    expect(secondDialog).not.toBe(firstDialog);
    expect(secondNavigationPopup).not.toBe(firstNavigationPopup);
    expect(secondMenuPopup.hidden).toBe(false);
    expect(secondDialog.open).toBe(true);
    expect(secondNavigationPopup.hidden).toBe(false);
    expect(secondTarget.querySelectorAll("[data-ticket11-category]")).toHaveLength(3);
    expect(firstTarget.querySelector("[data-ticket11-category]")).toBeNull();
  });

  it("retains one open Menu controller, subscriptions, focus, dismissal, and cleanup across target replacement", async () => {
    const firstTarget = createTarget("menu-retention-first");
    const secondTarget = createTarget("menu-retention-second");
    const rootRef = React.createRef<HTMLDivElement>();
    let setTarget: React.Dispatch<React.SetStateAction<HTMLElement>> = () => undefined;

    function Harness() {
      const [target, updateTarget] = React.useState(firstTarget);
      setTarget = updateTarget;
      return (
        <Menu.Root defaultOpen ref={rootRef}>
          <Menu.Trigger data-ticket11-menu-trigger>Actions</Menu.Trigger>
          <Menu.Portal container={target}>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item data-ticket11-menu-item>Replacement action</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
    }

    await mount(<Harness />);
    const instance = createMenu(rootRef.current!);
    const openChanges = vi.fn();
    instance.subscribe("openChange", openChanges);

    await update(() => setTarget(secondTarget));

    expect(createMenu(rootRef.current!)).toBe(instance);
    expect(instance.getOpen()).toBe(true);
    const replacementPopup = secondTarget.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    const replacementItem = secondTarget.querySelector<HTMLElement>("[data-ticket11-menu-item]")!;
    await act(() => {
      replacementPopup.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
      );
    });
    expect(document.activeElement).toBe(replacementItem);

    await act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
    });
    expect(instance.getOpen()).toBe(false);
    expect(openChanges).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(
      document.querySelector<HTMLElement>("[data-ticket11-menu-trigger]"),
    );

    await act(() => reactRoot?.unmount());
    reactRoot = undefined;
    const callsAfterCleanup = openChanges.mock.calls.length;
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    expect(openChanges).toHaveBeenCalledTimes(callsAfterCleanup);
  });

  it("refreshes open Select and Combobox surfaces while retaining value and controller identity", async () => {
    const firstTarget = createTarget("collection-retention-first");
    const secondTarget = createTarget("collection-retention-second");
    const selectRootRef = React.createRef<HTMLDivElement>();
    const comboboxRootRef = React.createRef<HTMLDivElement>();
    let setTarget: React.Dispatch<React.SetStateAction<HTMLElement>> = () => undefined;

    function Harness() {
      const [target, updateTarget] = React.useState(firstTarget);
      setTarget = updateTarget;
      return (
        <>
          <Select.Root defaultOpen defaultValue="first" modal={false} ref={selectRootRef}>
            <Select.Trigger>Select value</Select.Trigger>
            <Select.Portal container={target}>
              <Select.Positioner alignItemWithTrigger={false}>
                <Select.Popup keepMounted>
                  <Select.Item value="first">First</Select.Item>
                  <Select.Item value="second">Second</Select.Item>
                </Select.Popup>
              </Select.Positioner>
            </Select.Portal>
          </Select.Root>
          <Combobox.Root defaultOpen defaultValue="first" modal={false} ref={comboboxRootRef}>
            <Combobox.Input />
            <Combobox.Portal container={target}>
              <Combobox.Positioner>
                <Combobox.Popup keepMounted>
                  <Combobox.Item value="first">First</Combobox.Item>
                  <Combobox.Item value="second">Second</Combobox.Item>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        </>
      );
    }

    await mount(<Harness />);
    const select = createSelect(selectRootRef.current!);
    const combobox = createCombobox(comboboxRootRef.current!);

    await update(() => setTarget(secondTarget));

    expect(createSelect(selectRootRef.current!)).toBe(select);
    expect(createCombobox(comboboxRootRef.current!)).toBe(combobox);
    expect(select.getValue()).toBe("first");
    expect(combobox.getValue()).toBe("first");
    const nextSelectItem = secondTarget.querySelector<HTMLElement>(
      '[data-sw-select-item][data-value="second"]',
    )!;
    const nextComboboxItem = secondTarget.querySelector<HTMLElement>(
      '[data-sw-combobox-item][data-value="second"]',
    )!;
    await act(() => nextSelectItem.click());
    expect(select.getValue()).toBe("second");
    expect(document.activeElement).toBe(
      selectRootRef.current?.querySelector("[data-sw-select-trigger]"),
    );

    combobox.open();
    await act(() => nextComboboxItem.click());
    expect(combobox.getValue()).toBe("second");
    expect(combobox.getInputValue()).toBe("Second");
  });

  it("replays one Combobox value command accepted while Portal placement is pending", async () => {
    const firstTarget = createTarget("combobox-command-first");
    const secondTarget = createTarget("combobox-command-second");
    const rootRef = React.createRef<HTMLDivElement>();
    let firstPortal: HTMLDivElement | null = null;
    let setTarget: React.Dispatch<React.SetStateAction<HTMLElement>> = () => undefined;

    function Harness() {
      const [target, updateTarget] = React.useState(firstTarget);
      setTarget = updateTarget;
      const portalRef = React.useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        if (firstPortal && node !== firstPortal) {
          rootRef.current?.dispatchEvent(
            new CustomEvent("starwind:set-value", {
              bubbles: true,
              detail: { emit: false, value: "second" },
            }),
          );
        }
        firstPortal = node;
      }, []);
      return (
        <Combobox.Root defaultValue="first" modal={false} ref={rootRef}>
          <Combobox.Input />
          <Combobox.Portal container={target} ref={portalRef}>
            <Combobox.Positioner>
              <Combobox.Popup keepMounted>
                <Combobox.Item value="first">First</Combobox.Item>
                <Combobox.Item value="second">Second</Combobox.Item>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    await mount(<Harness />);
    await update(() => setTarget(secondTarget));

    const instance = createCombobox(rootRef.current!);
    expect(instance.getValue()).toBe("second");
    expect(instance.getInputValue()).toBe("Second");
  });

  it("replays a Combobox value command accepted before the first Portal placement", async () => {
    const target = createTarget("combobox-first-command");
    const rootRef = React.createRef<HTMLDivElement>();
    const pendingObservations: Array<{ controllerInitialized: boolean; placement: string }> = [];

    function Harness() {
      const commandAcceptedRef = React.useRef(false);

      React.useLayoutEffect(() => {
        if (commandAcceptedRef.current) return;
        const root = rootRef.current;
        const portal = root?.querySelector<HTMLElement>("[data-sw-combobox-portal]");
        const input = root?.querySelector<HTMLElement>("[data-sw-combobox-input]");
        if (!root || !input || portal?.dataset.placement !== "pending") return;

        commandAcceptedRef.current = true;
        pendingObservations.push({
          controllerInitialized: input.hasAttribute("aria-controls"),
          placement: portal.dataset.placement,
        });
        root.dispatchEvent(
          new CustomEvent("starwind:set-value", {
            bubbles: true,
            detail: { emit: false, value: "second" },
          }),
        );
      });

      return (
        <Combobox.Root defaultValue="first" modal={false} ref={rootRef}>
          <Combobox.Input />
          <Combobox.Portal container={target}>
            <Combobox.Positioner>
              <Combobox.Popup keepMounted>
                <Combobox.Item value="first">First</Combobox.Item>
                <Combobox.Item value="second">Second</Combobox.Item>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
      );
    }

    await mount(<Harness />);

    const portal = target.querySelector<HTMLElement>("[data-sw-combobox-portal]")!;
    const instance = createCombobox(rootRef.current!);
    expect(pendingObservations).toEqual([{ controllerInitialized: false, placement: "pending" }]);
    expect(portal).toHaveAttribute("data-placement", "ready");
    expect(rootRef.current?.querySelector("[data-sw-combobox-input]")).toHaveAttribute(
      "aria-controls",
    );
    expect(instance.getValue()).toBe("second");
    expect(instance.getInputValue()).toBe("Second");
  });

  it("keeps a nested floating Portal inside its active native dialog owner", async () => {
    const dialogTargetRef = React.createRef<HTMLDivElement>();
    await mount(
      <AlertDialog.Root defaultOpen>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop />
          <AlertDialog.Popup data-ticket08-dialog>
            <AlertDialog.Title>Confirm</AlertDialog.Title>
            <AlertDialog.Description>Confirm the action</AlertDialog.Description>
            <div data-ticket08-dialog-target ref={dialogTargetRef} />
            <Popover.Root defaultOpen modal={false}>
              <Popover.Trigger>Nested trigger</Popover.Trigger>
              <Popover.Portal container={dialogTargetRef}>
                <Popover.Positioner>
                  <Popover.Popup keepMounted>
                    <button data-ticket08-dialog-focus>Nested action</button>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>,
    );

    const dialog = document.querySelector<HTMLDialogElement>("[data-ticket08-dialog]")!;
    const dialogPortal = document.querySelector<HTMLElement>("[data-sw-alert-dialog-portal]")!;
    const nestedPortal = document.querySelector<HTMLElement>("[data-sw-popover-portal]")!;
    expect(dialog.open).toBe(true);
    expect(dialogPortal.parentElement).toBe(document.body);
    expect(dialogPortal).toHaveAttribute("data-placement", "ready");
    expect(nestedPortal).toHaveAttribute("data-placement", "ready");
    expect(nestedPortal.parentElement).toHaveAttribute("data-sw-floating-root", "dialog");
    expect(dialog.contains(nestedPortal)).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

function ContextConsumer({ family }: { family: string }) {
  const value = React.useContext(PortalContext);
  return <button data-ticket08-child={family}>{`${family}:${value}`}</button>;
}

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(async () => {
    reactRoot!.render(node);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function update(updateState: () => void): Promise<void> {
  await act(async () => {
    updateState();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mutateAndWaitForPortalParent(
  portalRef: React.RefObject<HTMLDivElement | null>,
  expectedParent: HTMLElement,
  mutate: () => void,
): Promise<void> {
  await new Promise<void>((resolve) => {
    const completeIfPlaced = () => {
      if (portalRef.current?.parentElement !== expectedParent) return;
      observer.disconnect();
      resolve();
    };
    const observer = new MutationObserver(() => {
      completeIfPlaced();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    mutate();
    completeIfPlaced();
  });
  await act(async () => undefined);
}

function createTarget(name: string): HTMLElement {
  const target = makeTarget(name);
  document.body.append(target);
  return target;
}

function makeTarget(name: string): HTMLElement {
  const target = document.createElement("section");
  target.id = `ticket08-${name}`;
  target.dataset.ticket08Target = name;
  return target;
}
