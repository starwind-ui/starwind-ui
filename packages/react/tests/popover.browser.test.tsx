import {
  PopoverPopup,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "@starwind-ui/react/popover";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { DrawerPopup, DrawerRoot } from "../src/drawer/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Popover", () => {
  it("activates on first placement when nested in an open Sheet-equivalent Drawer", async () => {
    await mount(
      <DrawerRoot defaultOpen>
        <DrawerPopup>
          <div data-floating-root />
          <PopoverRoot>
            <PopoverTrigger id="sheet-popover-trigger">Open details</PopoverTrigger>
            <PopoverPortal>
              <PopoverPopup id="sheet-popover-popup">Details</PopoverPopup>
            </PopoverPortal>
          </PopoverRoot>
        </DrawerPopup>
      </DrawerRoot>,
    );

    const trigger = query<HTMLButtonElement>("#sheet-popover-trigger");
    const popup = query<HTMLElement>("#sheet-popover-popup");
    const portal = query<HTMLElement>("[data-sw-popover-portal]");
    expect(portal).toHaveAttribute("data-placement", "ready");
    expect(trigger).toHaveAttribute("aria-controls", popup.id);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(popup.hidden).toBe(true);

    await act(async () => {
      trigger.focus();
      await userEvent.keyboard("{Enter}");
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(popup.hidden).toBe(false);
  });

  it.each([
    ["mounts after the root inside a Portal", true, [true]],
    ["mounts after the root without a Portal", false, [true]],
    ["is hidden and shown again inside a Portal", true, [true, false, true]],
    ["is hidden and shown again inside a mounted Portal", "mounted", [true, false, true]],
    ["is hidden and shown again without a Portal", false, [true, false, true]],
    ["is replaced inside a mounted Portal", "mounted", [true, "replace"]],
    ["is replaced without a Portal", false, [true, "replace"]],
  ] as const)("opens and closes a Popup that %s", async (_name, portal, sequence) => {
    const { setPopup, trigger, popup } = await mountTogglePopover(portal);
    expect(popup()).toBeNull();
    for (const show of sequence) await setPopup(show);
    expect(popup()!.hidden).toBe(true);

    await act(async () => {
      trigger().focus();
      trigger().click();
    });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(popup()!.hidden).toBe(false);

    await pressEscape();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(popup()!.hidden).toBe(true);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("recovers when an open Popup unmounts and mounts again %s", async (_name, withPortal) => {
    const { setPopup, trigger, popup, proposals } = await mountTogglePopover(withPortal, true);
    const root = query<HTMLElement>("[data-sw-popover]");
    await setPopup(true);
    await act(async () => trigger().click());
    expect(popup()!.hidden).toBe(false);
    proposals.length = 0;

    await setPopup(false);
    expect(root).toHaveAttribute("data-state", "closed");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    await setPopup(true);
    expect(root).toHaveAttribute("data-state", "open");
    expect(popup()!.hidden).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([]);

    await pressEscape();
    expect(root).toHaveAttribute("data-state", "closed");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(popup()!.hidden).toBe(true);

    await act(async () => trigger().click());
    expect(root).toHaveAttribute("data-state", "open");
    expect(popup()!.hidden).toBe(false);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("keeps an open Popup open when its placement changes %s", async (_name, withPortal) => {
    const proposals: boolean[] = [];
    let setSide: (side: "bottom" | "top") => void = () => {};
    function SidePopover() {
      const [side, update] = React.useState<"bottom" | "top">("bottom");
      setSide = update;
      const popup = (
        <PopoverPopup id="side-popup" side={side}>
          <input />
        </PopoverPopup>
      );
      return (
        <PopoverRoot modal onOpenChange={(open) => proposals.push(open)}>
          <PopoverTrigger id="side-trigger">Open</PopoverTrigger>
          {withPortal ? <PopoverPortal>{popup}</PopoverPortal> : popup}
        </PopoverRoot>
      );
    }
    await mount(<SidePopover />);
    await act(async () => query<HTMLButtonElement>("#side-trigger").click());
    const input = query<HTMLInputElement>("#side-popup input");
    input.focus();
    proposals.length = 0;

    await act(async () => setSide("top"));
    await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    expect(query<HTMLElement>("#side-popup").hidden).toBe(false);
    expect(document.activeElement).toBe(input);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([]);
  });

  it("finishes a pending exit once when placement changes", async () => {
    const style = document.createElement("style");
    style.textContent =
      "#exit-popup { opacity: 1; transition: opacity 120ms linear; } #exit-popup[data-state='closed'] { opacity: 0; }";
    document.head.append(style);
    const completions: number[] = [];
    let setSide: (side: "bottom" | "top") => void = () => {};
    function ExitPopover() {
      const [side, update] = React.useState<"bottom" | "top">("bottom");
      setSide = update;
      return (
        <PopoverRoot onCloseComplete={() => completions.push(1)}>
          <PopoverTrigger id="exit-trigger">Open</PopoverTrigger>
          <PopoverPopup id="exit-popup" side={side}>
            Details
          </PopoverPopup>
        </PopoverRoot>
      );
    }
    try {
      await mount(<ExitPopover />);
      await act(async () => query<HTMLButtonElement>("#exit-trigger").click());
      await pressEscape();
      expect(query<HTMLElement>("#exit-popup").hidden).toBe(false);
      await act(async () => setSide("top"));
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 250)));
      expect(completions).toEqual([1]);
      expect(query<HTMLElement>("#exit-popup").hidden).toBe(true);
    } finally {
      style.remove();
    }
  });

  it("returns focus to the opening Trigger after a placement change", async () => {
    let setSide: (side: "bottom" | "top") => void = () => {};
    function TwoTriggerPopover() {
      const [side, update] = React.useState<"bottom" | "top">("bottom");
      setSide = update;
      return (
        <PopoverRoot>
          <PopoverTrigger id="first-trigger">First</PopoverTrigger>
          <PopoverTrigger id="second-trigger">Second</PopoverTrigger>
          <PopoverPopup id="focus-popup" side={side}>
            <input id="focus-input" />
          </PopoverPopup>
        </PopoverRoot>
      );
    }
    await mount(<TwoTriggerPopover />);
    const second = query<HTMLButtonElement>("#second-trigger");
    await act(async () => {
      second.focus();
      second.click();
    });
    await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    expect(document.activeElement).toBe(query("#focus-input"));
    await act(async () => setSide("top"));
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(query("#first-trigger")).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(query("#focus-input"));
    await pressEscape();
    expect(query<HTMLElement>("#focus-popup").hidden).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it.each([
    ["inside a Portal", true],
    ["without a Portal", false],
  ])("opens a default-open Popover on mount %s", async (_name, withPortal) => {
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => errors.push(event.error);
    const consoleError = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    window.addEventListener("error", onError);
    try {
      const popup = <PopoverPopup id="default-popup">Details</PopoverPopup>;
      await mount(
        <PopoverRoot defaultOpen>
          <PopoverTrigger id="default-trigger">Open</PopoverTrigger>
          {withPortal ? <PopoverPortal>{popup}</PopoverPortal> : popup}
        </PopoverRoot>,
      );
      await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
      const trigger = query<HTMLButtonElement>("#default-trigger");
      expect(query<HTMLElement>("#default-popup").hidden).toBe(false);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      await pressEscape();
      expect(query<HTMLElement>("#default-popup").hidden).toBe(true);
      await act(async () => trigger.click());
      expect(query<HTMLElement>("#default-popup").hidden).toBe(false);
      expect(errors).toEqual([]);
    } finally {
      console.error = consoleError;
      window.removeEventListener("error", onError);
    }
  });

  it("coordinates a pre-rendered nested tree through normal effect ordering", async () => {
    await mount(
      <PopoverRoot openOnHover closeDelay={20}>
        <PopoverTrigger id="parent-trigger">Open parent</PopoverTrigger>
        <PopoverPortal>
          <PopoverPopup id="parent-popup">
            <PopoverRoot>
              <PopoverTrigger id="child-trigger">Open child</PopoverTrigger>
              <PopoverPortal>
                <PopoverPopup id="child-popup">Child content</PopoverPopup>
              </PopoverPortal>
            </PopoverRoot>
          </PopoverPopup>
        </PopoverPortal>
      </PopoverRoot>,
    );

    const parentTrigger = query<HTMLButtonElement>("#parent-trigger");
    const parentPopup = query<HTMLElement>("#parent-popup");
    const childTrigger = query<HTMLButtonElement>("#child-trigger");
    const childPopup = query<HTMLElement>("#child-popup");

    await act(async () => {
      parentTrigger.dispatchEvent(
        new PointerEvent("pointerenter", { bubbles: false, pointerType: "mouse" }),
      );
      childTrigger.click();
      parentPopup.dispatchEvent(
        new PointerEvent("pointerleave", { bubbles: false, pointerType: "mouse" }),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    });

    expect(parentTrigger).toHaveAttribute("aria-expanded", "true");
    expect(parentPopup.hidden).toBe(false);
    expect(childTrigger).toHaveAttribute("aria-expanded", "true");
    expect(childPopup.hidden).toBe(false);

    await act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
      );
    });

    expect(parentTrigger).toHaveAttribute("aria-expanded", "true");
    expect(parentPopup.hidden).toBe(false);
    expect(childTrigger).toHaveAttribute("aria-expanded", "false");
    expect(childPopup.hidden).toBe(true);
  });
});

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

function query<T extends Element>(selector: string): T {
  return document.querySelector<T>(selector)!;
}

async function mountTogglePopover(portal: boolean | "mounted", modal = false) {
  let setShow: (value: boolean) => void = () => {};
  let replace: () => void = () => {};
  const proposals: boolean[] = [];
  function TogglePopover() {
    const [show, update] = React.useState(false);
    const [key, setKey] = React.useState(0);
    setShow = update;
    replace = () => setKey((current) => current + 1);
    const popup = show ? (
      <PopoverPopup key={key} id="late-popup">
        Late details
      </PopoverPopup>
    ) : null;
    return (
      <PopoverRoot modal={modal} onOpenChange={(open) => proposals.push(open)}>
        <PopoverTrigger id="late-trigger">Open</PopoverTrigger>
        {portal === "mounted" || (portal && show) ? <PopoverPortal>{popup}</PopoverPortal> : popup}
      </PopoverRoot>
    );
  }
  await mount(<TogglePopover />);
  return {
    proposals,
    async setPopup(value: boolean | "replace") {
      await act(async () => (value === "replace" ? replace() : setShow(value)));
      await act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    },
    trigger: () => query<HTMLButtonElement>("#late-trigger"),
    popup: () => document.querySelector<HTMLElement>("#late-popup"),
  };
}

async function pressEscape() {
  await act(async () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
  });
}
