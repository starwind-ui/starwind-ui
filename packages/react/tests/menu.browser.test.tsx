import type * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import Dropdown from "../../../apps/react-demo/src/components/starwind-runtime/dropdown";
import { Menu } from "../src/menu/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

type Dir = "ltr" | "rtl";
type Side = "top" | "right" | "bottom" | "left";

const scopeStyle: React.CSSProperties = { position: "fixed", left: 450, top: 80, width: 200 };

describe("React Menu submenu side", () => {
  it.each(["ltr", "rtl"] as const)(
    "defaults a Primitive submenu to the bottom side in %s",
    async (dir) => {
      await mount(
        <div dir={dir} style={scopeStyle}>
          <Menu.Root modal={false}>
            <Menu.Trigger id="trigger">Open</Menu.Trigger>
            <Menu.Portal>
              <Menu.Popup id="root-popup" avoidCollisions={false}>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger id="sub-trigger">More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Popup id="sub-popup" avoidCollisions={false}>
                      <Menu.Item>Child</Menu.Item>
                    </Menu.Popup>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.Popup>
            </Menu.Portal>
          </Menu.Root>
        </div>,
      );

      const rootPopup = query("#root-popup");
      const subPopup = query("#sub-popup");
      expect(rootPopup).toHaveAttribute("data-side", "bottom");
      expect(subPopup).toHaveAttribute("data-side", "bottom");
      expect(subPopup.hasAttribute("data-sw-menu-side-intent")).toBe(false);

      await openSubmenu();
      expect(rootPopup).toHaveAttribute("data-side", "bottom");
      expect(subPopup).toHaveAttribute("data-side", "bottom");
      const trigger = query("#sub-trigger").getBoundingClientRect();
      expect(subPopup.getBoundingClientRect().top).toBeGreaterThanOrEqual(trigger.bottom);
    },
  );

  it("renders a Styled DropdownSubContent with the right side before Runtime starts", () => {
    const html = renderToStaticMarkup(
      <Dropdown.Root modal={false}>
        <Dropdown.Trigger>Open</Dropdown.Trigger>
        <Dropdown.Content>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>More</Dropdown.SubTrigger>
            <Dropdown.SubContent id="sub-default">Child</Dropdown.SubContent>
          </Dropdown.Sub>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>Other</Dropdown.SubTrigger>
            <Dropdown.SubContent id="sub-explicit" side="left">
              Child
            </Dropdown.SubContent>
          </Dropdown.Sub>
        </Dropdown.Content>
      </Dropdown.Root>,
    );
    const tag = (id: string) => html.match(new RegExp(`<div[^>]*id="${id}"[^>]*>`))?.[0] ?? "";

    // Older Runtime copies ignore the intent, so the first markup keeps the base right side.
    expect(tag("sub-default")).toContain('data-side="right"');
    expect(tag("sub-default")).toContain('data-sw-menu-side-intent=""');
    expect(tag("sub-explicit")).toContain('data-side="left"');
    expect(tag("sub-explicit")).toContain('data-sw-menu-side-intent="left"');
  });

  it.each([
    ["ltr", undefined, "right"],
    ["rtl", undefined, "left"],
    ["ltr", "left", "left"],
    ["rtl", "right", "right"],
  ] as const)(
    "places a Styled DropdownSubContent in %s with side %s on the %s",
    async (dir: Dir, side: Side | undefined, expected: Side) => {
      await mount(
        <div dir={dir} style={scopeStyle}>
          <Dropdown.Root modal={false}>
            <Dropdown.Trigger id="trigger">Open</Dropdown.Trigger>
            <Dropdown.Content id="root-popup" avoidCollisions={false}>
              <Dropdown.Sub>
                <Dropdown.SubTrigger id="sub-trigger">More</Dropdown.SubTrigger>
                <Dropdown.SubContent id="sub-popup" side={side} avoidCollisions={false}>
                  <Dropdown.Item>Child</Dropdown.Item>
                </Dropdown.SubContent>
              </Dropdown.Sub>
            </Dropdown.Content>
          </Dropdown.Root>
        </div>,
      );

      const subPopup = query("#sub-popup");
      expect(subPopup).toHaveAttribute("data-sw-menu-side-intent", side ?? "");
      expect(subPopup).toHaveAttribute("data-side", expected);

      await openSubmenu();
      expect(query("#root-popup")).toHaveAttribute("data-side", "bottom");
      expect(subPopup).toHaveAttribute("data-side", expected);
      const trigger = query("#sub-trigger").getBoundingClientRect();
      const popup = subPopup.getBoundingClientRect();
      if (expected === "right") expect(popup.left).toBeGreaterThanOrEqual(trigger.right - 1);
      else expect(popup.right).toBeLessThanOrEqual(trigger.left + 1);
    },
  );
});

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

function query(selector: string): HTMLElement {
  return document.querySelector<HTMLElement>(selector)!;
}

async function openSubmenu(): Promise<void> {
  await act(async () => {
    query("#trigger").click();
    await settlePosition();
  });
  await act(async () => {
    query("#sub-trigger").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
    );
    await settlePosition();
  });
  expect(query("#sub-popup").hidden).toBe(false);
}

async function settlePosition(): Promise<void> {
  for (let frame = 0; frame < 3; frame += 1) await new Promise(requestAnimationFrame);
}
