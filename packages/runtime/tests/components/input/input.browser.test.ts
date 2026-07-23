import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInput } from "../../../src/components/input/input";
import { getFormValueRevision } from "../../../src/internal/form-value-revision";

describe("createInput", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes filled input state from the native value", () => {
    const input = renderInput({ value: "Ada" });

    createInput(input);

    expect(input.getAttribute("data-sw-input")).toBe("");
    expect(input.hasAttribute("data-filled")).toBe(true);
    expect(input.hasAttribute("data-dirty")).toBe(false);
    expect(input.hasAttribute("data-focused")).toBe(false);
    expect(input.hasAttribute("data-touched")).toBe(false);
  });

  it("updates value state and notifies value-change listeners when the user types", () => {
    const input = renderInput({ value: "Ada" });
    const onValueChange = vi.fn();
    const listener = vi.fn();
    const instance = createInput(input, { onValueChange });
    input.addEventListener("starwind:value-change", listener);

    input.value = "Ada Lovelace";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(instance.getValue()).toBe("Ada Lovelace");
    expect(input.hasAttribute("data-filled")).toBe(true);
    expect(input.hasAttribute("data-dirty")).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith(
      "Ada Lovelace",
      expect.objectContaining({
        previousValue: "Ada",
        reason: "none",
        value: "Ada Lovelace",
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toMatchObject({
      previousValue: "Ada",
      reason: "none",
      value: "Ada Lovelace",
    });
  });

  it("correlates a native input with its semantic value notification", () => {
    const input = renderInput({ value: "Ada" });
    createInput(input);
    const semanticEvents: Event[] = [];
    input.addEventListener("starwind:value-change", (event) => semanticEvents.push(event));
    const nativeEvent = new InputEvent("input", { bubbles: true });

    input.value = "Grace";
    input.dispatchEvent(nativeEvent);

    expect(semanticEvents).toHaveLength(1);
    expect(getFormValueRevision(nativeEvent)).toBeDefined();
    expect(getFormValueRevision(semanticEvents[0])).toBe(getFormValueRevision(nativeEvent));
  });

  it("assigns distinct revisions to later imperative actions with a repeated value", () => {
    const input = renderInput();
    const instance = createInput(input);
    const revisions: unknown[] = [];
    input.addEventListener("starwind:value-change", (event) => {
      revisions.push(getFormValueRevision(event));
    });

    instance.setValue("Ada");
    instance.setValue("Grace");
    instance.setValue("Ada");

    expect(revisions).toHaveLength(3);
    expect(new Set(revisions).size).toBe(3);
  });

  it("tracks focus and touched state", () => {
    const input = renderInput();
    createInput(input);

    input.dispatchEvent(new FocusEvent("focus", { bubbles: false }));
    expect(input.hasAttribute("data-focused")).toBe(true);
    expect(input.hasAttribute("data-touched")).toBe(false);

    input.dispatchEvent(new FocusEvent("blur", { bubbles: false }));
    expect(input.hasAttribute("data-focused")).toBe(false);
    expect(input.hasAttribute("data-touched")).toBe(true);
  });

  it("honors runtime disabled options and setter updates", () => {
    const input = renderInput();
    const instance = createInput(input, { disabled: true });

    expect(input.disabled).toBe(true);
    expect(input).toHaveAttribute("data-disabled");

    instance.setDisabled(false);

    expect(input.disabled).toBe(false);
    expect(input).not.toHaveAttribute("data-disabled");

    instance.setDisabled(true);

    expect(input.disabled).toBe(true);
    expect(input).toHaveAttribute("data-disabled");
  });

  it("supports controlled mode without committing value until setValue is called", () => {
    const input = renderInput({ value: "Ada" });
    const onValueChange = vi.fn();
    const instance = createInput(input, {
      onValueChange,
      value: "Ada",
    });

    input.value = "Grace";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(onValueChange).toHaveBeenCalledWith(
      "Grace",
      expect.objectContaining({ previousValue: "Ada", value: "Grace" }),
    );
    expect(instance.getValue()).toBe("Ada");
    expect(input.value).toBe("Grace");

    instance.setValue("Grace", { emit: false });
    expect(instance.getValue()).toBe("Grace");
    expect(input.value).toBe("Grace");
  });

  it("syncs state after native form reset", async () => {
    document.body.innerHTML = `
      <form>
        <input data-sw-input name="name" value="Ada" />
      </form>
    `;
    const input = document.querySelector<HTMLInputElement>("[data-sw-input]")!;
    const form = document.querySelector<HTMLFormElement>("form")!;
    const instance = createInput(input);

    input.value = "Grace";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(instance.getValue()).toBe("Grace");
    expect(input.hasAttribute("data-dirty")).toBe(true);

    form.reset();
    await waitForMacrotask();

    expect(input.value).toBe("Ada");
    expect(instance.getValue()).toBe("Ada");
    expect(input.hasAttribute("data-dirty")).toBe(false);
    expect(input.hasAttribute("data-filled")).toBe(true);
    expect(new FormData(form).get("name")).toBe("Ada");
  });

  it("can update value programmatically and clean up listeners", () => {
    const input = renderInput();
    const listener = vi.fn();
    const instance = createInput(input);
    input.addEventListener("starwind:value-change", listener);

    instance.setValue("Ada");

    expect(input.value).toBe("Ada");
    expect(input.hasAttribute("data-filled")).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    instance.destroy();
    input.value = "Grace";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(instance.getValue()).toBe("Ada");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns the existing instance for duplicate initialization", () => {
    const input = renderInput();

    expect(createInput(input)).toBe(createInput(input));
  });
});

function renderInput({
  value = "",
  disabled = false,
}: {
  value?: string;
  disabled?: boolean;
} = {}) {
  document.body.innerHTML = `
    <input data-sw-input ${disabled ? "disabled" : ""} value="${value}" />
  `;

  return document.querySelector<HTMLInputElement>("[data-sw-input]")!;
}

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
