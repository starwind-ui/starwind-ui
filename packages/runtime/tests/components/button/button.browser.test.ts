import { beforeEach, describe, expect, it, vi } from "vitest";

import { createButton } from "../../../src/components/button/button";

describe("createButton", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    ["anchor element", '<a data-sw-button href="/docs">Docs</a>'],
    ["non-button element", "<div data-sw-button>Open</div>"],
  ])("rejects a non-button %s root", (_name, markup) => {
    document.body.innerHTML = markup;
    const root = document.querySelector<HTMLElement>("[data-sw-button]")!;

    expect(() => createButton(root as HTMLButtonElement)).toThrow(
      new TypeError("createButton root must be an HTMLButtonElement."),
    );
  });

  it("does not add or rewrite the native button type", () => {
    const implicitType = renderButton("<button data-sw-button>Save</button>");
    const submitType = renderButton('<button data-sw-button type="submit">Submit</button>', false);

    createButton(implicitType);
    createButton(submitType);

    expect(implicitType.getAttribute("type")).toBeNull();
    expect(submitType.getAttribute("type")).toBe("submit");
  });

  it.each([
    ["enabled", false],
    ["disabled", true],
  ])("renders an initially %s focusable-disabled button", (_name, disabled) => {
    const button = renderButton(
      `<button data-sw-button${disabled ? " disabled" : ""}>Save</button>`,
    );

    createButton(button);

    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("data-disabled")).toBe(disabled);
    expect(button.getAttribute("aria-disabled")).toBe(disabled ? "true" : null);
  });

  it("transitions the same focused button between enabled and focusable-disabled states", () => {
    const button = renderButton("<button data-sw-button>Save</button>");
    const instance = createButton(button);

    button.focus();
    instance.setDisabled(true);

    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("data-disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    instance.setDisabled(false);

    expect(document.activeElement).toBe(button);
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("data-disabled")).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBeNull();
  });

  it("suppresses activation-ish handlers only while disabled", () => {
    const button = renderButton("<button data-sw-button>Save</button>");
    const instance = createButton(button);
    const handlers = {
      click: vi.fn(),
      keydown: vi.fn(),
      keyup: vi.fn(),
      mousedown: vi.fn(),
      pointerdown: vi.fn(),
    };
    Object.entries(handlers).forEach(([type, handler]) => button.addEventListener(type, handler));

    instance.setDisabled(true);
    dispatchActivationEvents(button);

    Object.values(handlers).forEach((handler) => expect(handler).not.toHaveBeenCalled());

    instance.setDisabled(false);
    dispatchActivationEvents(button);

    expect(handlers.click).toHaveBeenCalledTimes(1);
    expect(handlers.mousedown).toHaveBeenCalledTimes(1);
    expect(handlers.pointerdown).toHaveBeenCalledTimes(1);
    expect(handlers.keydown).toHaveBeenCalledTimes(2);
    expect(handlers.keyup).toHaveBeenCalledTimes(2);
  });

  it("preserves focus and non-activation pointer handlers while disabled", () => {
    const button = renderButton("<button data-sw-button>Save</button>");
    const instance = createButton(button, { disabled: true });
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const onMouseEnter = vi.fn();
    const onPointerMove = vi.fn();
    button.addEventListener("blur", onBlur);
    button.addEventListener("focus", onFocus);
    button.addEventListener("mouseenter", onMouseEnter);
    button.addEventListener("pointermove", onPointerMove);

    button.focus();
    button.dispatchEvent(createMouseEvent("mouseenter"));
    button.dispatchEvent(createPointerEvent("pointermove"));
    button.blur();

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("returns the existing instance for duplicate initialization", () => {
    const button = renderButton("<button data-sw-button>Save</button>");

    expect(createButton(button)).toBe(createButton(button));
  });

  it("destroy is idempotent and removes suppression listeners", () => {
    const button = renderButton("<button data-sw-button>Save</button>");
    const instance = createButton(button, { disabled: true });
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    instance.destroy();
    instance.destroy();
    button.dispatchEvent(createMouseEvent("click"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(createButton(button)).not.toBe(instance);
  });
});

function renderButton(markup: string, replaceBody = true): HTMLButtonElement {
  if (replaceBody) document.body.innerHTML = markup;
  else document.body.insertAdjacentHTML("beforeend", markup);
  return document.querySelectorAll<HTMLButtonElement>("[data-sw-button]").item(replaceBody ? 0 : 1);
}

function dispatchActivationEvents(button: HTMLButtonElement): void {
  button.dispatchEvent(createMouseEvent("click"));
  button.dispatchEvent(createMouseEvent("mousedown"));
  button.dispatchEvent(createPointerEvent("pointerdown"));
  button.dispatchEvent(createKeyboardEvent("keydown", "Enter"));
  button.dispatchEvent(createKeyboardEvent("keydown", " "));
  button.dispatchEvent(createKeyboardEvent("keyup", "Enter"));
  button.dispatchEvent(createKeyboardEvent("keyup", " "));
}

function createMouseEvent(type: string): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true });
}

function createPointerEvent(type: string): PointerEvent {
  return new PointerEvent(type, { bubbles: true, cancelable: true });
}

function createKeyboardEvent(type: string, key: string): KeyboardEvent {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, key });
}
