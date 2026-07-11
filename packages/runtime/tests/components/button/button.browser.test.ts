import { beforeEach, describe, expect, it, vi } from "vitest";

import { createButton } from "../../../src/components/button/button";

describe("createButton", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("defaults native buttons to type button", () => {
    const button = renderButton("<button data-sw-button>Save</button>");

    createButton(button);

    expect(button.getAttribute("type")).toBe("button");
    expect(button.hasAttribute("data-disabled")).toBe(false);
  });

  it("preserves explicit native button types", () => {
    const button = renderButton('<button data-sw-button type="submit">Submit</button>');

    createButton(button);

    expect(button.getAttribute("type")).toBe("submit");
  });

  it("reflects disabled state with native disabled and data-disabled", () => {
    const button = renderButton("<button data-sw-button disabled>Save</button>");

    createButton(button);

    expect(button.disabled).toBe(true);
    expect(button.hasAttribute("data-disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBeNull();
  });

  it("keeps disabled buttons focusable when requested", () => {
    const button = renderButton(
      "<button data-sw-button disabled data-focusable-when-disabled>Save</button>",
    );
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    createButton(button);
    button.click();

    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("data-disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("honors runtime disabled options when static markup starts enabled", () => {
    const button = renderButton("<button data-sw-button>Save</button>");
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    createButton(button, { disabled: true, focusableWhenDisabled: true });

    expect(button.disabled).toBe(false);
    expect(button.hasAttribute("data-disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.dispatchEvent(createMouseEvent("click"))).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ["native button", "<button data-sw-button disabled>Save</button>"],
    [
      "focusable native button",
      "<button data-sw-button disabled data-focusable-when-disabled>Save</button>",
    ],
    ["non-native button", '<div data-sw-button data-native="false" data-disabled>Open</div>'],
    [
      "focusable non-native button",
      '<div data-sw-button data-native="false" data-disabled data-focusable-when-disabled>Open</div>',
    ],
  ])("suppresses activation-ish events on disabled %s", (_name, markup) => {
    const button = renderButton(markup);
    const onClick = vi.fn();
    const onMouseDown = vi.fn();
    const onPointerDown = vi.fn();
    const onKeyDown = vi.fn();
    const onKeyUp = vi.fn();
    button.addEventListener("click", onClick);
    button.addEventListener("mousedown", onMouseDown);
    button.addEventListener("pointerdown", onPointerDown);
    button.addEventListener("keydown", onKeyDown);
    button.addEventListener("keyup", onKeyUp);

    createButton(button);

    expect(button.dispatchEvent(createMouseEvent("click"))).toBe(false);
    expect(button.dispatchEvent(createMouseEvent("mousedown"))).toBe(false);
    expect(button.dispatchEvent(createPointerEvent("pointerdown"))).toBe(false);
    expect(button.dispatchEvent(createKeyboardEvent("keydown", "Enter"))).toBe(false);
    expect(button.dispatchEvent(createKeyboardEvent("keydown", " "))).toBe(false);
    expect(button.dispatchEvent(createKeyboardEvent("keyup", " "))).toBe(false);

    expect(onClick).not.toHaveBeenCalled();
    expect(onMouseDown).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onKeyDown).not.toHaveBeenCalled();
    expect(onKeyUp).not.toHaveBeenCalled();
  });

  it("preserves non-activation pointer affordances on disabled buttons", () => {
    const button = renderButton('<div data-sw-button data-native="false" data-disabled>Open</div>');
    const onMouseEnter = vi.fn();
    const onPointerMove = vi.fn();
    button.addEventListener("mouseenter", onMouseEnter);
    button.addEventListener("pointermove", onPointerMove);

    createButton(button);
    button.dispatchEvent(createMouseEvent("mouseenter"));
    button.dispatchEvent(createPointerEvent("pointermove"));

    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onPointerMove).toHaveBeenCalledTimes(1);
  });

  it("preserves disabled href link semantics while suppressing activation", () => {
    const button = renderButton('<a data-sw-button data-disabled href="/docs">Docs</a>');
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    createButton(button);

    expect(button.getAttribute("role")).toBeNull();
    expect(button.getAttribute("href")).toBe("/docs");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.dispatchEvent(createMouseEvent("click"))).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("adds button semantics and keyboard activation to non-native buttons", () => {
    const button = renderButton('<div data-sw-button data-native="false">Open</div>');
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    createButton(button);
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    button.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

    expect(button.getAttribute("role")).toBe("button");
    expect(button.tabIndex).toBe(0);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("keeps href anchors as links instead of forcing button semantics", () => {
    const button = renderButton('<a data-sw-button href="/docs">Docs</a>');
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    button.addEventListener("click", onClick);

    createButton(button);
    button.click();

    expect(button.getAttribute("role")).toBeNull();
    expect(button.getAttribute("href")).toBe("/docs");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps href anchors as links even when nativeButton false is present", () => {
    const button = renderButton('<a data-sw-button data-native="false" href="/docs">Docs</a>');
    const onClick = vi.fn();
    button.addEventListener("click", onClick);

    createButton(button);
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    button.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));

    expect(button.getAttribute("role")).toBeNull();
    expect(button.getAttribute("href")).toBe("/docs");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("returns the existing instance for duplicate initialization", () => {
    const button = renderButton("<button data-sw-button>Save</button>");

    expect(createButton(button)).toBe(createButton(button));
  });

  it("destroy removes keyboard listeners", () => {
    const button = renderButton('<div data-sw-button data-native="false">Open</div>');
    const onClick = vi.fn();
    const instance = createButton(button);
    button.addEventListener("click", onClick);

    instance.destroy();
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});

function renderButton(markup: string): HTMLButtonElement & HTMLAnchorElement & HTMLElement {
  document.body.innerHTML = markup;
  return document.querySelector<HTMLElement>("[data-sw-button]") as HTMLButtonElement &
    HTMLAnchorElement &
    HTMLElement;
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
