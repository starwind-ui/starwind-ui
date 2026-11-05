import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { NavigationMenu } from "../src/navigation-menu/index";

const roots: Root[] = [];

function Menu({ refuse = false }: { refuse?: boolean }) {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <>
      <button data-open-from-parent onClick={() => setValue("products")} type="button" />
      <NavigationMenu.Root
        closeDelay={0}
        onValueChange={(next) => {
          if (!refuse) setValue(next);
        }}
        openDelay={0}
        value={value}
      >
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger data-test="products">Products</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <NavigationMenu.Link data-link href="#products">
                Products link
              </NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner>
            <NavigationMenu.Popup>
              <NavigationMenu.Viewport />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>
    </>
  );
}

async function mount(element: React.ReactElement): Promise<void> {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  await settle();
}

async function settle(frames = 12): Promise<void> {
  await act(async () => {
    for (let index = 0; index < frames; index += 1) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });
}

function trigger(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-test="products"]')!;
}

function pressArrowDown(element: HTMLElement): void {
  element.focus();
  element.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
  );
}

describe("React Navigation Menu under a controlled value", () => {
  afterEach(() => {
    for (const root of roots.splice(0)) act(() => root.unmount());
    document.body.replaceChildren();
  });

  it("moves keyboard open focus into Content", async () => {
    await mount(<Menu />);
    pressArrowDown(trigger());
    await settle();

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(document.querySelector("[data-link]"));
  });

  it("keeps focus on the trigger when the parent refuses the keyboard open", async () => {
    await mount(<Menu refuse />);
    pressArrowDown(trigger());
    await settle(4);

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger());
  });

  it("does not move focus when the parent opens the menu without a keyboard request", async () => {
    await mount(<Menu />);
    trigger().focus();
    await act(async () => document.querySelector<HTMLElement>("[data-open-from-parent]")!.click());
    await settle(4);

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(trigger());
  });
});
