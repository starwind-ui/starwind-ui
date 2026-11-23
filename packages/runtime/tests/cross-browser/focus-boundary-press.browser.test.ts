import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";

import { createFocusBoundary, type FocusBoundaryHandle } from "../../src/internal/focus-boundary";

// Each test destroys its boundary, so no press listener stays on the document.
const boundaries: FocusBoundaryHandle[] = [];

const settle = () => new Promise((resolve) => setTimeout(resolve, 100));
const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const press = (target: HTMLElement, type: string) =>
  target.dispatchEvent(new PointerEvent(type, { bubbles: true }));

/** The events of a pointer press, with the timer that ends the press still pending. */
function click(target: HTMLElement): void {
  press(target, "pointerdown");
  press(target, "pointerup");
  target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

/**
 * A browser runs microtasks between a keyboard focusout and its focusin, so the check sees the
 * document as active. Key input can come before the timer that ends a press.
 */
function keyboardFocusOut(from: HTMLElement, relatedTarget: Element | null): void {
  from.blur();
  from.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
}

const tabKey = (options: KeyboardEventInit = {}) =>
  document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab", ...options }));

function setup(markup: string): {
  onFocusDeparture: ReturnType<typeof vi.fn>;
  surface: HTMLElement;
} {
  document.body.innerHTML = markup;
  const surface = document.querySelector<HTMLElement>("[data-testid='surface']")!;
  const onFocusDeparture = vi.fn();
  const boundary = createFocusBoundary({
    containsTarget: (target) => surface.contains(target),
    onFocusDeparture,
    ownerDocument: document,
    surfaces: [surface],
  });
  boundaries.push(boundary);
  return { onFocusDeparture, surface };
}

const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.querySelector<T>(`[data-testid='${id}']`)!;

describe("focus boundary press and keyboard", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    for (const boundary of boundaries.splice(0)) boundary.destroy();
  });

  const plain = `
    <div data-testid="surface"><button data-testid="owned" type="button">Owned</button></div>
    <button data-testid="outside" type="button">Outside</button>
  `;

  it("counts a Tab to another control before the press timer ends", async () => {
    const { onFocusDeparture } = setup(plain);
    byId("owned").focus();

    click(byId("owned"));
    tabKey();
    keyboardFocusOut(byId("owned"), byId("outside"));
    await flushMicrotasks();

    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
  });

  it("counts a Tab with no destination before the press timer ends", async () => {
    const { onFocusDeparture } = setup(plain);
    byId("owned").focus();

    click(byId("owned"));
    tabKey();
    // An outside iframe, browser chrome and the end of the document give no destination.
    keyboardFocusOut(byId("owned"), null);
    await flushMicrotasks();

    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
  });

  it("keeps a repeated key from ending a press", async () => {
    const { onFocusDeparture } = setup(plain);
    byId("owned").focus();

    press(byId("owned"), "pointerdown");
    tabKey({ key: "Shift", repeat: true });
    byId("owned").blur();
    await flushMicrotasks();

    expect(onFocusDeparture).not.toHaveBeenCalled();
  });

  it("keeps a press whose focus moves to a focusable ancestor outside the boundary", async () => {
    const { onFocusDeparture } = setup(`
      <div data-testid="wrapper" tabindex="-1">
        <div data-testid="surface">
          <button data-testid="owned" type="button">Owned</button>
          <span data-testid="label">Label</span>
        </div>
      </div>
    `);
    byId("owned").focus();

    // A press on content that cannot take focus moves focus to the nearest focusable ancestor.
    press(byId("label"), "pointerdown");
    keyboardFocusOut(byId("owned"), byId("wrapper"));
    await flushMicrotasks();

    expect(onFocusDeparture).not.toHaveBeenCalled();
  });

  it("keeps a real press on content inside a focusable ancestor", async () => {
    const { onFocusDeparture } = setup(`
      <div data-testid="wrapper" tabindex="-1" style="padding:8px">
        <div data-testid="surface">
          <button data-testid="owned" type="button">Owned</button>
          <span data-testid="label">Label</span>
        </div>
      </div>
    `);
    byId("owned").focus();

    await userEvent.click(page.getByTestId("label"));
    await settle();

    expect(onFocusDeparture).not.toHaveBeenCalled();
  });

  it("keeps a real press on an owned button", async () => {
    const { onFocusDeparture } = setup(plain);
    byId("owned").focus();

    // WebKit does not focus a pressed button, so focus falls to the document.
    await userEvent.click(page.getByTestId("owned"));
    await settle();

    expect(onFocusDeparture).not.toHaveBeenCalled();
  });

  it("counts a real Tab after a real press", async () => {
    // WebKit skips buttons on Tab by default, so the Tab moves between text inputs.
    const { onFocusDeparture } = setup(`
      <div data-testid="surface"><input data-testid="owned" /></div>
      <input data-testid="outside" />
    `);

    await userEvent.click(page.getByTestId("owned"));
    await userEvent.keyboard("{Tab}");
    await settle();

    expect(document.activeElement).toBe(byId("outside"));
    expect(onFocusDeparture).toHaveBeenCalledTimes(1);
  });

  it("keeps focus that moves into an owned iframe during a press", async () => {
    const { onFocusDeparture } = setup(`
      <div data-testid="surface">
        <button data-testid="owned" type="button">Owned</button>
        <iframe data-testid="frame" srcdoc="<button>Inner</button>"></iframe>
      </div>
    `);
    byId("owned").focus();

    press(byId("owned"), "pointerdown");
    byId<HTMLIFrameElement>("frame").focus();
    await settle();

    expect(document.activeElement).toBe(byId("frame"));
    expect(onFocusDeparture).not.toHaveBeenCalled();
  });
});
