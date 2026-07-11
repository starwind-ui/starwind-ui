import { beforeEach, describe, expect, it } from "vitest";

import { resolveAsChildControl, uniqueElements } from "../../src/internal/dom";

describe("DOM internals", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves as-child wrappers while preserving child-owned attributes and styles", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-as-child", "");
    wrapper.setAttribute("data-outer", "yes");
    wrapper.className = "outer";
    wrapper.style.color = "red";
    wrapper.style.marginLeft = "4px";

    const button = document.createElement("button");
    button.setAttribute("data-outer", "button");
    button.className = "button";
    button.style.color = "green";

    wrapper.append(button);
    document.body.append(wrapper);

    const control = resolveAsChildControl(wrapper);

    expect(control).toBe(button);
    expect(button.classList.contains("outer")).toBe(true);
    expect(button.classList.contains("button")).toBe(true);
    expect(button.getAttribute("data-outer")).toBe("button");
    expect(button.style.color).toBe("green");
    expect(button.style.marginLeft).toBe("4px");
    expect(wrapper.hasAttribute("data-as-child")).toBe(false);
    expect(wrapper.hasAttribute("class")).toBe(false);
    expect(wrapper.style.color).toBe("");
    expect(wrapper.style.marginLeft).toBe("");
    expect(wrapper.style.display).toBe("contents");
  });

  it("skips inert child elements when resolving as-child controls", () => {
    const wrapper = document.createElement("span");
    wrapper.setAttribute("data-as-child", "");
    const script = document.createElement("script");
    const style = document.createElement("style");
    const template = document.createElement("template");
    const button = document.createElement("button");

    wrapper.append(script, style, template, button);

    expect(resolveAsChildControl(wrapper)).toBe(button);
    expect(button.hasAttribute("data-as-child")).toBe(false);
    expect(wrapper.style.display).toBe("contents");
  });

  it("leaves non-as-child wrappers and empty as-child wrappers untouched", () => {
    const plain = document.createElement("button");
    plain.className = "plain";

    const emptyWrapper = document.createElement("span");
    emptyWrapper.setAttribute("data-as-child", "");
    emptyWrapper.className = "empty";

    expect(resolveAsChildControl(plain)).toBe(plain);
    expect(plain.className).toBe("plain");
    expect(resolveAsChildControl(emptyWrapper)).toBe(emptyWrapper);
    expect(emptyWrapper.hasAttribute("data-as-child")).toBe(true);
    expect(emptyWrapper.className).toBe("empty");
    expect(emptyWrapper.style.display).toBe("");
  });

  it("deduplicates elements while preserving first-seen order", () => {
    const first = document.createElement("button");
    const second = document.createElement("button");
    const third = document.createElement("button");

    expect(uniqueElements([first, second, first, third, second])).toEqual([first, second, third]);
  });
});
