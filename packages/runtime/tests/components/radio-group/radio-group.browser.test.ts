import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRadio } from "../../../src/components/radio";
import { createRadioGroup } from "../../../src/components/radio-group/radio-group";
import { getFormValueRevision } from "../../../src/internal/form-value-revision";

describe("createRadioGroup", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes child radios from defaultValue and emits value changes", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const group = createRadioGroup(root);

    const [ssd, hdd, nvme] = getRadios(root);
    expect(group.getValue()).toBe("ssd");
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(nvme?.getAttribute("aria-checked")).toBe("false");
    expect(root.getAttribute("role")).toBe("radiogroup");
    expect(getInput(ssd!).name).toBe("storage");

    hdd?.click();

    expect(group.getValue()).toBe("hdd");
    expect(ssd?.getAttribute("aria-checked")).toBe("false");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          previousValue: "ssd",
          radioValue: "hdd",
          value: "hdd",
        }),
      }),
    );
  });

  it("disables all child radios when the group is disabled", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", disabled: true, name: "storage" });
    const group = createRadioGroup(root);
    const [, hdd] = getRadios(root);

    hdd?.click();

    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(group.getValue()).toBe("ssd");
    expect(hdd?.getAttribute("aria-disabled")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
  });

  it("forwards one revision from a child checked notification to the group value notification", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    createRadioGroup(root);
    const checkedEvents: Event[] = [];
    const valueEvents: Event[] = [];
    root.addEventListener("starwind:checked-change", (event) => checkedEvents.push(event));
    root.addEventListener("starwind:value-change", (event) => valueEvents.push(event));

    getRadios(root)[1]?.click();

    expect(checkedEvents).toHaveLength(1);
    expect(valueEvents).toHaveLength(1);
    expect(getFormValueRevision(valueEvents[0])).toBe(getFormValueRevision(checkedEvents[0]));
  });

  it("reflects group ARIA state and updates form, orientation, and required options live", () => {
    const root = renderRadioGroup({
      defaultValue: "ssd",
      disabled: true,
      name: "storage",
      readOnly: true,
      required: true,
    });
    const group = createRadioGroup(root);
    const [ssd] = getRadios(root);

    expect(root.getAttribute("aria-disabled")).toBe("true");
    expect(root.getAttribute("aria-readonly")).toBe("true");
    expect(root.getAttribute("aria-required")).toBe("true");
    expect(getInput(ssd!).name).toBe("storage");
    expect(getInput(ssd!).required).toBe(true);

    group.setDisabled(false);
    group.setReadOnly(false);
    group.setFormOptions({ form: "drive-form", name: "drive", required: false });
    group.setOrientation("horizontal");

    expect(root.hasAttribute("aria-disabled")).toBe(false);
    expect(root.hasAttribute("aria-readonly")).toBe(false);
    expect(root.hasAttribute("aria-required")).toBe(false);
    expect(root.getAttribute("aria-orientation")).toBe("horizontal");
    expect(root.getAttribute("data-orientation")).toBe("horizontal");
    expect(getInput(ssd!).getAttribute("form")).toBe("drive-form");
    expect(getInput(ssd!).name).toBe("drive");
    expect(getInput(ssd!).required).toBe(false);
  });

  it("supports controlled and programmatic value updates", () => {
    const root = renderRadioGroup({ name: "storage" });
    const group = createRadioGroup(root, { value: "nvme" });
    const [, hdd, nvme] = getRadios(root);
    const listener = vi.fn();
    group.subscribe("valueChange", listener);

    hdd?.click();

    expect(group.getValue()).toBe("nvme");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        radioValue: "hdd",
        value: "hdd",
      }),
    );

    group.setValue("hdd", { emit: false });

    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(nvme?.getAttribute("aria-checked")).toBe("false");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("updates only the previous and next checked radios during a large click change", async () => {
    const root = renderLargeRadioGroup(50, {
      defaultValue: "item-0",
      name: "storage",
    });
    const group = createRadioGroup(root);
    const radios = getRadios(root);
    const changedCheckedRadios = new Set<string>();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName !== "aria-checked" &&
          mutation.attributeName !== "data-checked" &&
          mutation.attributeName !== "data-unchecked"
        ) {
          return;
        }

        if (!(mutation.target instanceof HTMLElement)) return;

        const radioRoot = mutation.target.closest<HTMLElement>("[data-sw-radio]");
        const value = radioRoot?.getAttribute("data-value");
        if (value) {
          changedCheckedRadios.add(value);
        }
      });
    });

    observer.observe(root, {
      attributeFilter: ["aria-checked", "data-checked", "data-unchecked"],
      attributes: true,
      subtree: true,
    });

    radios[49]?.click();
    await waitForMutationObserver();
    observer.disconnect();

    expect(group.getValue()).toBe("item-49");
    expect([...changedCheckedRadios].sort()).toEqual(["item-0", "item-49"]);
    expect(radios[0]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[0]?.hasAttribute("data-unchecked")).toBe(true);
    expect(radios[0]?.tabIndex).toBe(-1);
    expect(radios[25]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[25]?.tabIndex).toBe(-1);
    expect(radios[49]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[49]?.hasAttribute("data-checked")).toBe(true);
    expect(radios[49]?.tabIndex).toBe(0);
    expect(root.getAttribute("data-value")).toBe("item-49");
  });

  it("keeps controlled large-group clicks anchored to the controlled value", () => {
    const root = renderLargeRadioGroup(20, { name: "storage" });
    const group = createRadioGroup(root, { value: "item-0" });
    const radios = getRadios(root);
    const listener = vi.fn();
    group.subscribe("valueChange", listener);

    radios[19]?.click();

    expect(group.getValue()).toBe("item-0");
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[0]?.tabIndex).toBe(0);
    expect(radios[19]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[19]?.tabIndex).toBe(-1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        previousValue: "item-0",
        radioValue: "item-19",
        value: "item-19",
      }),
    );

    group.setValue("item-19", { emit: false });

    expect(group.getValue()).toBe("item-19");
    expect(radios[0]?.getAttribute("aria-checked")).toBe("false");
    expect(radios[0]?.tabIndex).toBe(-1);
    expect(radios[19]?.getAttribute("aria-checked")).toBe("true");
    expect(radios[19]?.tabIndex).toBe(0);
    expect(root.getAttribute("data-value")).toBe("item-19");
  });

  it("falls back to full checked-state attributes for duplicate values", () => {
    const root = renderDuplicateValueRadioGroup({ defaultValue: "primary", name: "storage" });
    const group = createRadioGroup(root);
    const [primary, duplicateOne, duplicateTwo] = getRadios(root);

    duplicateTwo?.click();

    expect(group.getValue()).toBe("duplicate");
    expect(primary?.getAttribute("aria-checked")).toBe("false");
    expect(duplicateOne?.getAttribute("aria-checked")).toBe("true");
    expect(duplicateTwo?.getAttribute("aria-checked")).toBe("true");
    expect(duplicateOne?.hasAttribute("data-checked")).toBe(true);
    expect(duplicateTwo?.hasAttribute("data-checked")).toBe(true);
    expect(getInput(primary!).checked).toBe(false);
    expect(getInput(duplicateTwo!).checked).toBe(true);
    expect(root.getAttribute("data-value")).toBe("duplicate");
  });

  it("does not emit a value-change event when selecting the current controlled value", () => {
    const root = renderRadioGroup({ name: "storage" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const group = createRadioGroup(root, { value: "ssd" });
    const [ssd] = getRadios(root);

    ssd?.click();

    expect(group.getValue()).toBe("ssd");
    expect(listener).not.toHaveBeenCalled();
  });

  it("does not emit a value-change event when selecting the current uncontrolled value", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);
    const group = createRadioGroup(root);
    const [ssd] = getRadios(root);

    ssd?.click();

    expect(group.getValue()).toBe("ssd");
    expect(listener).not.toHaveBeenCalled();
  });

  it("lets disabled groups override radio instances that were initialized first", () => {
    const root = renderRadioGroup({ disabled: true });
    const [, hdd] = getRadios(root);
    createRadio(hdd!);

    const group = createRadioGroup(root);

    hdd?.click();

    expect(group.getValue()).toBeUndefined();
    expect(hdd?.getAttribute("aria-disabled")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
  });

  it("submits the selected value and omits disabled group values", () => {
    const form = document.createElement("form");
    const enabledGroup = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const disabledGroup = renderRadioGroup({
      defaultValue: "hdd",
      disabled: true,
      name: "disabled-storage",
    });
    form.append(enabledGroup, disabledGroup);
    document.body.append(form);

    createRadioGroup(enabledGroup);
    createRadioGroup(disabledGroup);

    const data = new FormData(form);

    expect(data.get("storage")).toBe("ssd");
    expect(data.get("disabled-storage")).toBeNull();
  });

  it("passes form and required options to child radios at initialization", () => {
    const root = renderRadioGroup({
      defaultValue: "ssd",
      form: "storage-form",
      name: "storage",
      required: true,
    });
    const group = createRadioGroup(root);
    const [ssd] = getRadios(root);
    const input = getInput(ssd!);

    expect(group.getValue()).toBe("ssd");
    expect(input.getAttribute("form")).toBe("storage-form");
    expect(input.name).toBe("storage");
    expect(input.required).toBe(true);
  });

  it("updates child radio names and readonly state without recreating the group", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);

    group.setName("drive");
    group.setReadOnly(true);
    hdd?.click();

    expect(getInput(ssd!).name).toBe("drive");
    expect(getInput(hdd!).name).toBe("drive");
    expect(hdd?.hasAttribute("data-readonly")).toBe(true);
    expect(group.getValue()).toBe("ssd");

    group.setReadOnly(false);
    hdd?.click();

    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
  });

  it("selects the next enabled radio with arrow keys", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(hdd);
  });

  it("skips readonly radios during keyboard navigation", () => {
    const root = renderRadioGroup({
      defaultValue: "ssd",
      name: "storage",
      readOnlyValues: ["hdd"],
    });
    const group = createRadioGroup(root);
    const [ssd, hdd, nvme] = getRadios(root);

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("nvme");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(nvme?.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(nvme);
  });

  it("updates readonly keyboard skipping after item attribute mutations", async () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [ssd, hdd, _nvme] = getRadios(root);

    hdd?.setAttribute("data-readonly", "");
    await waitForMutationObserver();
    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("nvme");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
  });

  it("uses RTL-aware horizontal arrow navigation and ignores Home and End", () => {
    const root = renderRadioGroup({
      defaultValue: "hdd",
      dir: "rtl",
      name: "storage",
      orientation: "horizontal",
    });
    const group = createRadioGroup(root);
    const [ssd, hdd, nvme] = getRadios(root);

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }),
    );

    expect(group.getValue()).toBe("nvme");
    expect(document.activeElement).toBe(nvme);

    nvme?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );

    expect(group.getValue()).toBe("hdd");

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" }),
    );

    expect(group.getValue()).toBe("hdd");
    expect(ssd?.getAttribute("aria-checked")).toBe("false");
  });

  it("keeps group click and keyboard selection working with native-button radio inputs", () => {
    const root = renderNativeButtonRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);

    expect(ssd?.querySelector("[data-sw-radio-input]")).toBeNull();
    expect(getInput(ssd!).previousElementSibling).toBe(ssd);

    hdd?.click();

    expect(group.getValue()).toBe("hdd");
    expect(getInput(hdd!).checked).toBe(true);

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("nvme");
  });

  it("initializes native-button groups from authored sibling inputs", () => {
    const form = document.createElement("form");
    const root = renderAuthoredNativeButtonRadioGroup();
    form.append(root);
    document.body.append(form);

    const group = createRadioGroup(root);
    const [, hdd] = getRadios(root);
    const input = getInput(hdd!);

    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(input.checked).toBe(true);
    expect(input.name).toBe("storage");
    expect(new FormData(form).get("storage")).toBe("hdd");
  });

  it("removes runtime-owned native-button inputs when radios leave the group", async () => {
    const form = document.createElement("form");
    const root = renderNativeButtonRadioGroup({ defaultValue: "hdd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root);
    const [, hdd] = getRadios(root);
    const hddInput = getInput(hdd!);

    expect(new FormData(form).get("storage")).toBe("hdd");

    hdd?.remove();
    await waitForMutationObserver();

    expect(group.getValue()).toBeUndefined();
    expect(hddInput.isConnected).toBe(false);
    expect(new FormData(form).get("storage")).toBeNull();
  });

  it("refreshes dynamic radios for insertion, removal, disablement, and reorder", async () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [ssd, hdd, nvme] = getRadios(root);
    const tape = createRadioItem("tape");

    root.append(tape);
    await waitForMutationObserver();

    nvme?.focus();
    nvme?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("tape");
    expect(tape.getAttribute("aria-checked")).toBe("true");

    tape.remove();
    await waitForMutationObserver();

    expect(group.getValue()).toBeUndefined();
    expect(ssd?.tabIndex).toBe(0);

    hdd?.setAttribute("data-disabled", "");
    await waitForMutationObserver();

    ssd?.focus();
    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("nvme");
    expect(hdd?.tabIndex).toBe(-1);

    root.insertBefore(nvme!, ssd!);
    await waitForMutationObserver();

    nvme?.focus();
    nvme?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);
  });
});

function renderRadioGroup(
  options: {
    defaultValue?: string;
    dir?: "ltr" | "rtl";
    disabled?: boolean;
    form?: string;
    name?: string;
    orientation?: "horizontal" | "vertical";
    readOnly?: boolean;
    readOnlyValues?: string[];
    required?: boolean;
  } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-radio-group
      ${options.dir === undefined ? "" : `dir="${options.dir}"`}
      ${options.disabled ? "data-disabled" : ""}
      ${options.defaultValue === undefined ? "" : `data-default-value="${options.defaultValue}"`}
      ${options.form === undefined ? "" : `data-form="${options.form}"`}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
      ${options.orientation === undefined ? "" : `data-orientation="${options.orientation}"`}
      ${options.readOnly ? "data-readonly" : ""}
      ${options.required ? "data-required" : ""}
    >
      <span data-sw-radio data-value="ssd" ${options.readOnlyValues?.includes("ssd") ? "data-readonly" : ""}>
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="hdd" ${options.readOnlyValues?.includes("hdd") ? "data-readonly" : ""}>
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="nvme" ${options.readOnlyValues?.includes("nvme") ? "data-readonly" : ""}>
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function renderNativeButtonRadioGroup(
  options: { defaultValue?: string; name?: string } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-radio-group
      ${options.defaultValue === undefined ? "" : `data-default-value="${options.defaultValue}"`}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
    >
      <button data-sw-radio data-value="ssd">
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
      <button data-sw-radio data-value="hdd">
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
      <button data-sw-radio data-value="nvme">
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function renderLargeRadioGroup(
  count: number,
  options: { defaultValue?: string; name?: string } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  const items = Array.from(
    { length: count },
    (_, index) => `
      <span data-sw-radio data-value="item-${index}">
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
    `,
  ).join("");

  wrapper.innerHTML = `
    <div
      data-sw-radio-group
      ${options.defaultValue === undefined ? "" : `data-default-value="${options.defaultValue}"`}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
    >
      ${items}
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function renderDuplicateValueRadioGroup(
  options: { defaultValue?: string; name?: string } = {},
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div
      data-sw-radio-group
      ${options.defaultValue === undefined ? "" : `data-default-value="${options.defaultValue}"`}
      ${options.name === undefined ? "" : `data-name="${options.name}"`}
    >
      <span data-sw-radio data-value="primary">
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="duplicate">
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="duplicate">
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function renderAuthoredNativeButtonRadioGroup(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-radio-group>
      <button data-sw-radio>
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
      <input data-sw-radio-input name="storage" value="ssd" />
      <button data-sw-radio>
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
      <input data-sw-radio-input name="storage" value="hdd" checked />
      <button data-sw-radio>
        <span data-sw-radio-indicator data-keep-mounted></span>
      </button>
      <input data-sw-radio-input name="storage" value="nvme" />
    </div>
  `;

  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);

  return root;
}

function getInput(root: HTMLElement): HTMLInputElement {
  return (root.querySelector<HTMLInputElement>("[data-sw-radio-input]") ??
    (root.nextElementSibling instanceof HTMLInputElement
      ? root.nextElementSibling.matches("[data-sw-radio-input]")
        ? root.nextElementSibling
        : null
      : null))!;
}

function getRadios(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-sw-radio]"));
}

function createRadioItem(value: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <span data-sw-radio data-value="${value}">
      <span data-sw-radio-indicator data-keep-mounted></span>
      <input data-sw-radio-input />
    </span>
  `;

  return wrapper.firstElementChild as HTMLElement;
}

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
