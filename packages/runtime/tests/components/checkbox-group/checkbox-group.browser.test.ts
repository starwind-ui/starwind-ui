import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCheckbox } from "../../../src/components/checkbox";
import { createCheckboxGroup } from "../../../src/components/checkbox-group/checkbox-group";
import { getFormValueRevision } from "../../../src/internal/form-value-revision";

describe("createCheckboxGroup", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes child checkboxes from defaultValue and emits value changes", () => {
    const root = renderCheckboxGroup({ defaultValue: ["red"] });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const group = createCheckboxGroup(root);

    const [red, green, blue] = getCheckboxes(root);
    expect(group.getValue()).toEqual(["red"]);
    expect(red?.getAttribute("aria-checked")).toBe("true");
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(blue?.getAttribute("aria-checked")).toBe("false");
    expect(root.getAttribute("role")).toBe("group");

    green?.click();

    expect(group.getValue()).toEqual(["red", "green"]);
    expect(green?.getAttribute("aria-checked")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          checkboxValue: "green",
          previousValue: ["red"],
          value: ["red", "green"],
        }),
      }),
    );

    red?.click();

    expect(group.getValue()).toEqual(["green"]);
    expect(red?.getAttribute("aria-checked")).toBe("false");
  });

  it("does not commit group value when a child checked change is canceled", () => {
    const root = renderCheckboxGroup();
    const valueListener = vi.fn();
    root.addEventListener("starwind:checked-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });
    root.addEventListener("starwind:value-change", valueListener);

    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    green?.click();

    expect(group.getValue()).toEqual([]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(valueListener).not.toHaveBeenCalled();
  });

  it("forwards one revision from a child checked notification to the group value notification", () => {
    const root = renderCheckboxGroup();
    createCheckboxGroup(root);
    const checkedEvents: Event[] = [];
    const valueEvents: Event[] = [];
    root.addEventListener("starwind:checked-change", (event) => checkedEvents.push(event));
    root.addEventListener("starwind:value-change", (event) => valueEvents.push(event));

    getCheckboxes(root)[1]?.click();

    expect(checkedEvents).toHaveLength(1);
    expect(valueEvents).toHaveLength(1);
    expect(getFormValueRevision(valueEvents[0])).toBe(getFormValueRevision(checkedEvents[0]));
  });

  it("does not commit group value when a child checked change event is prevented", () => {
    const root = renderCheckboxGroup();
    const valueListener = vi.fn();
    root.addEventListener("starwind:checked-change", (event) => {
      event.preventDefault();
    });
    root.addEventListener("starwind:value-change", valueListener);

    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    green?.click();

    expect(group.getValue()).toEqual([]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(valueListener).not.toHaveBeenCalled();
  });

  it("does not commit group value when a group value change is canceled", () => {
    const root = renderCheckboxGroup();
    const valueListener = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      const detail = (event as CustomEvent<{ cancel(): void; isCanceled: boolean }>).detail;
      detail.cancel();
      expect(detail.isCanceled).toBe(true);
    });
    root.addEventListener("starwind:value-change", valueListener);

    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    green?.click();

    expect(group.getValue()).toEqual([]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(valueListener).toHaveBeenCalledTimes(1);
  });

  it("does not commit group value when a group value change event is prevented", () => {
    const root = renderCheckboxGroup();
    const valueListener = vi.fn((event: Event) => {
      expect(event.cancelable).toBe(true);
      event.preventDefault();
    });
    root.addEventListener("starwind:value-change", valueListener);

    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    green?.click();

    expect(group.getValue()).toEqual([]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(valueListener).toHaveBeenCalledTimes(1);
  });

  it("does not commit programmatic value when a group value change is canceled", () => {
    const root = renderCheckboxGroup({ defaultValue: ["red"] });
    root.addEventListener("starwind:value-change", (event) => {
      (event as CustomEvent<{ cancel(): void }>).detail.cancel();
    });

    const group = createCheckboxGroup(root);
    const [red, green] = getCheckboxes(root);

    group.setValue(["green"]);

    expect(group.getValue()).toEqual(["red"]);
    expect(root.getAttribute("data-value")).toBe('["red"]');
    expect(red?.getAttribute("aria-checked")).toBe("true");
    expect(green?.getAttribute("aria-checked")).toBe("false");
  });

  it("disables all child checkboxes when the group is disabled", () => {
    const root = renderCheckboxGroup({ defaultValue: ["red"], disabled: true });
    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);

    green?.click();

    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(group.getValue()).toEqual(["red"]);
    expect(green?.getAttribute("aria-disabled")).toBe("true");
    expect(green?.getAttribute("aria-checked")).toBe("false");
  });

  it("lets disabled groups override checkbox instances that were initialized first", () => {
    const root = renderCheckboxGroup({ disabled: true });
    const [, green] = getCheckboxes(root);
    createCheckbox(green!);

    const group = createCheckboxGroup(root);

    green?.click();

    expect(group.getValue()).toEqual([]);
    expect(green?.getAttribute("aria-disabled")).toBe("true");
    expect(green?.getAttribute("aria-checked")).toBe("false");
  });

  it("supports controlled and programmatic value updates", () => {
    const root = renderCheckboxGroup();
    const group = createCheckboxGroup(root, { value: ["blue"] });
    const [, green, blue] = getCheckboxes(root);
    const listener = vi.fn();
    group.subscribe("valueChange", listener);

    green?.click();

    expect(group.getValue()).toEqual(["blue"]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        checkboxValue: "green",
        value: ["blue", "green"],
      }),
    );

    group.setValue(["green"], { emit: false });

    expect(group.getValue()).toEqual(["green"]);
    expect(green?.getAttribute("aria-checked")).toBe("true");
    expect(blue?.getAttribute("aria-checked")).toBe("false");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reverts pre-initialized child checkboxes when a controlled group does not update", () => {
    const root = renderCheckboxGroup();
    const [, green, blue] = getCheckboxes(root);
    createCheckbox(green!);

    const group = createCheckboxGroup(root, { value: ["blue"] });

    green?.click();

    expect(group.getValue()).toEqual(["blue"]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
    expect(blue?.getAttribute("aria-checked")).toBe("true");
  });

  it("keeps group changes wired when a child checkbox instance is recreated", () => {
    const root = renderCheckboxGroup();
    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    const child = createCheckbox(green!);

    child.destroy();
    createCheckbox(green!);
    green?.click();

    expect(group.getValue()).toEqual(["green"]);
    expect(green?.getAttribute("aria-checked")).toBe("true");
  });

  it("updates disabled state without resetting uncontrolled value", () => {
    const root = renderCheckboxGroup({ defaultValue: ["red"] });
    const group = createCheckboxGroup(root);
    const [, green, blue] = getCheckboxes(root);

    green?.click();
    group.setDisabled(true);
    blue?.click();

    expect(group.getValue()).toEqual(["red", "green"]);
    expect(blue?.getAttribute("aria-disabled")).toBe("true");

    group.setDisabled(false);
    blue?.click();

    expect(group.getValue()).toEqual(["red", "green", "blue"]);
    expect(blue?.getAttribute("aria-disabled")).toBe(null);
    expect(blue?.getAttribute("aria-checked")).toBe("true");
  });

  it("submits selected child values and omits disabled group values", () => {
    const form = document.createElement("form");
    const enabledGroup = renderCheckboxGroup({ defaultValue: ["red", "blue"] });
    const disabledGroup = renderCheckboxGroup({ defaultValue: ["green"], disabled: true });
    form.append(enabledGroup, disabledGroup);
    document.body.append(form);

    createCheckboxGroup(enabledGroup);
    createCheckboxGroup(disabledGroup);

    const data = new FormData(form);

    expect(data.getAll("colors")).toEqual(["red", "blue"]);
  });

  it("restores the initial uncontrolled group value on form reset", async () => {
    const form = document.createElement("form");
    const root = renderCheckboxGroup({ defaultValue: ["red"] });
    form.append(root);
    document.body.append(form);
    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);

    green?.click();
    expect(group.getValue()).toEqual(["red", "green"]);

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));

    expect(group.getValue()).toEqual(["red"]);
    expect(green?.getAttribute("aria-checked")).toBe("false");
  });

  it("binds reset through native-button sibling inputs", async () => {
    const form = document.createElement("form");
    form.id = "native-group-form";
    const root = renderNativeCheckboxGroup(["red"]);
    form.append(root);
    document.body.append(form);
    const checkboxes = getCheckboxes(root);
    checkboxes.forEach((checkbox) => createCheckbox(checkbox, { form: form.id }));
    const group = createCheckboxGroup(root);

    checkboxes[1]?.click();
    expect(group.getValue()).toEqual(["red", "green"]);
    expect(checkboxes[0]?.nextElementSibling).toBeInstanceOf(HTMLInputElement);

    form.reset();
    await waitForReset();

    expect(group.getValue()).toEqual(["red"]);
    expect(checkboxes[1]?.getAttribute("aria-checked")).toBe("false");
  });

  it("resets only items associated with each relevant form", async () => {
    const firstForm = document.createElement("form");
    firstForm.id = "first-group-form";
    const secondForm = document.createElement("form");
    secondForm.id = "second-group-form";
    const root = renderCheckboxGroupWithForms({
      defaultValue: ["red", "green"],
      forms: [firstForm.id, secondForm.id, secondForm.id],
    });
    document.body.append(firstForm, secondForm, root);
    const group = createCheckboxGroup(root);
    const [red, , blue] = getCheckboxes(root);

    red?.click();
    blue?.click();
    expect(group.getValue()).toEqual(["green", "blue"]);

    firstForm.reset();
    await waitForReset();
    expect(group.getValue()).toEqual(["green", "blue", "red"]);

    secondForm.reset();
    await waitForReset();
    expect(group.getValue()).toEqual(["red", "green"]);
  });

  it("rebinds reset when a pre-initialized item's external form changes", async () => {
    const firstForm = document.createElement("form");
    firstForm.id = "original-group-form";
    const secondForm = document.createElement("form");
    secondForm.id = "rebound-group-form";
    const root = renderCheckboxGroupWithForms({
      defaultValue: ["red"],
      forms: [firstForm.id, firstForm.id, firstForm.id],
    });
    document.body.append(firstForm, secondForm, root);
    const [red] = getCheckboxes(root);
    const redCheckbox = createCheckbox(red!, { form: firstForm.id });
    const group = createCheckboxGroup(root);

    red?.click();
    expect(group.getValue()).toEqual([]);
    redCheckbox.setFormOptions({ form: secondForm.id });
    await waitForMutationObserver();

    firstForm.reset();
    await waitForReset();
    expect(group.getValue()).toEqual([]);

    secondForm.reset();
    await waitForReset();
    expect(group.getValue()).toEqual(["red"]);
  });

  it("keeps controlled pre-initialized state and emits nothing during reset", async () => {
    const form = document.createElement("form");
    form.id = "controlled-group-form";
    const root = renderNativeCheckboxGroup();
    form.append(root);
    document.body.append(form);
    const [, green] = getCheckboxes(root);
    createCheckbox(green!, { form: form.id });
    const group = createCheckboxGroup(root, { value: ["green"] });
    const listener = vi.fn();
    group.subscribe("valueChange", listener);

    form.reset();
    await waitForReset();

    expect(group.getValue()).toEqual(["green"]);
    expect(green?.getAttribute("aria-checked")).toBe("true");
    expect(listener).not.toHaveBeenCalled();
  });

  it("cancels pending reset work and removes form listeners on destroy", async () => {
    const form = document.createElement("form");
    const root = renderCheckboxGroup({ defaultValue: ["red"] });
    form.append(root);
    document.body.append(form);
    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    green?.click();

    form.reset();
    group.destroy();
    await waitForReset();
    expect(group.getValue()).toEqual(["red", "green"]);

    form.reset();
    await waitForReset();
    expect(group.getValue()).toEqual(["red", "green"]);
  });

  it("uses a group-level name for submitted selected values", () => {
    const form = document.createElement("form");
    const root = renderCheckboxGroup({ defaultValue: ["red", "blue"] });
    form.append(root);
    document.body.append(form);

    const group = createCheckboxGroup(root, { name: "palette" });

    let data = new FormData(form);
    expect(data.getAll("palette")).toEqual(["red", "blue"]);
    expect(data.getAll("colors")).toEqual([]);

    group.setName("tones");

    data = new FormData(form);
    expect(data.getAll("tones")).toEqual(["red", "blue"]);
    expect(data.getAll("palette")).toEqual([]);
  });

  it("refreshes dynamic checkboxes and prunes removed values", async () => {
    const root = renderCheckboxGroup();
    document.body.append(root);
    const group = createCheckboxGroup(root);
    const [, green] = getCheckboxes(root);
    const yellow = createCheckboxItem("yellow");

    root.append(yellow);
    await waitForMutationObserver();

    yellow.click();

    expect(group.getValue()).toEqual(["yellow"]);
    expect(yellow.getAttribute("aria-checked")).toBe("true");

    green?.setAttribute("data-disabled", "");
    await waitForMutationObserver();
    green?.click();

    expect(group.getValue()).toEqual(["yellow"]);
    expect(green?.getAttribute("aria-disabled")).toBe("true");

    yellow.remove();
    await waitForMutationObserver();

    expect(group.getValue()).toEqual([]);
    expect(root.getAttribute("data-value")).toBe("[]");
  });
});

function renderCheckboxGroup(
  options: { defaultValue?: string[]; disabled?: boolean } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-checkbox-group
      ${options.disabled ? "data-disabled" : ""}
      ${
        options.defaultValue === undefined
          ? ""
          : `data-default-value='${JSON.stringify(options.defaultValue)}'`
      }
    >
      <span data-sw-checkbox data-name="colors" data-value="red">
        <span data-sw-checkbox-indicator data-keep-mounted></span>
        <input data-sw-checkbox-input />
      </span>
      <span data-sw-checkbox data-name="colors" data-value="green">
        <span data-sw-checkbox-indicator data-keep-mounted></span>
        <input data-sw-checkbox-input />
      </span>
      <span data-sw-checkbox data-name="colors" data-value="blue">
        <span data-sw-checkbox-indicator data-keep-mounted></span>
        <input data-sw-checkbox-input />
      </span>
    </div>
  `;

  return wrapper.firstElementChild as HTMLElement;
}

function getCheckboxes(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-sw-checkbox]"));
}

function createCheckboxItem(value: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <span data-sw-checkbox data-name="colors" data-value="${value}">
      <span data-sw-checkbox-indicator data-keep-mounted></span>
      <input data-sw-checkbox-input />
    </span>
  `;

  return wrapper.firstElementChild as HTMLElement;
}

function renderNativeCheckboxGroup(defaultValue: string[] = []): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-checkbox-group
      data-default-value='${JSON.stringify(defaultValue)}'
    >
      ${["red", "green", "blue"]
        .map(
          (value) => `
            <button type="button" data-sw-checkbox data-name="colors" data-value="${value}"></button>
            <input data-sw-checkbox-input />
          `,
        )
        .join("")}
    </div>
  `;
  return wrapper.firstElementChild as HTMLElement;
}

function renderCheckboxGroupWithForms({
  defaultValue,
  forms,
}: {
  defaultValue: string[];
  forms: readonly [string, string, string];
}): HTMLElement {
  const root = renderCheckboxGroup({ defaultValue });
  getCheckboxes(root).forEach((checkbox, index) => {
    const form = forms[index];
    checkbox.setAttribute("data-form", form);
    checkbox.querySelector("[data-sw-checkbox-input]")?.setAttribute("form", form);
  });
  return root;
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForReset(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 10));
}
