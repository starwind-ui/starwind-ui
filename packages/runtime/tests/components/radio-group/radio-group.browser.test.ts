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

  it("cancels a child click atomically from the group value handler", () => {
    const form = document.createElement("form");
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const observations: Array<{ inputChecked: boolean; value: string | undefined }> = [];
    const group = createRadioGroup(root, {
      onValueChange: (_value, details) => {
        observations.push({
          inputChecked: getInput(getRadios(root)[1]!).checked,
          value: group.getValue(),
        });
        details.cancel();
      },
    });
    const [ssd, hdd] = getRadios(root);

    hdd?.click();

    expect(observations).toEqual([{ inputChecked: false, value: "ssd" }]);
    expect(group.getValue()).toBe("ssd");
    expect(root.getAttribute("data-value")).toBe("ssd");
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(ssd!).checked).toBe(true);
    expect(getInput(hdd!).checked).toBe(false);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
    expect(new FormData(form).get("storage")).toBe("ssd");
  });

  it("lets child cancellation veto group selection before the group emits", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const [, hdd] = getRadios(root);
    createRadio(hdd!, {
      onCheckedChange: (_checked, details) => details.cancel(),
    });
    const listener = vi.fn();
    const group = createRadioGroup(root);
    group.subscribe("valueChange", listener);

    hdd?.click();

    expect(listener).not.toHaveBeenCalled();
    expect(group.getValue()).toBe("ssd");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(hdd!).checked).toBe(false);
  });

  it("maps preventDefault on the group event to atomic cancellation", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [, hdd] = getRadios(root);
    const listener = vi.fn((event: Event) => event.preventDefault());
    root.addEventListener("starwind:value-change", listener);

    hdd?.click();

    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail.isCanceled).toBe(true);
    expect(group.getValue()).toBe("ssd");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(hdd!).checked).toBe(false);
  });

  it("keeps group authority when the selected child is imperatively unchecked", () => {
    const form = document.createElement("form");
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);
    const radio = createRadio(ssd!);
    const checkedListener = vi.fn();
    const valueListener = vi.fn();
    radio.subscribe("checkedChange", checkedListener);
    group.subscribe("valueChange", valueListener);

    radio.setChecked(false);

    expect(checkedListener).toHaveBeenCalledOnce();
    expect(checkedListener).toHaveBeenCalledWith(
      expect.objectContaining({
        checked: false,
        isCanceled: true,
        previousChecked: true,
        reason: "imperative-action",
      }),
    );
    expect(valueListener).not.toHaveBeenCalled();
    expect(group.getValue()).toBe("ssd");
    expect(root.getAttribute("data-value")).toBe("ssd");
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(ssd!).checked).toBe(true);
    expect(getInput(hdd!).checked).toBe(false);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
    expect(new FormData(form).get("storage")).toBe("ssd");
  });

  it("handles canceled, accepted, and repeated imperative value changes", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root);
    const [, hdd] = getRadios(root);
    let shouldCancel = true;
    const listener = vi.fn((_details) => {
      if (shouldCancel) _details.cancel();
    });
    group.subscribe("valueChange", listener);

    group.setValue("hdd");

    expect(listener).toHaveBeenCalledOnce();
    expect(group.getValue()).toBe("ssd");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(hdd!).checked).toBe(false);

    shouldCancel = false;
    group.setValue("hdd");

    expect(listener).toHaveBeenCalledTimes(2);
    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(getInput(hdd!).checked).toBe(true);
    expect(hdd?.tabIndex).toBe(0);

    group.setValue("hdd");

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("publishes group and child acceptance only after every veto owner accepts", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const [, hdd] = getRadios(root);
    const child = createRadio(hdd!);
    const group = createRadioGroup(root);
    const observations: string[] = [];
    child.subscribe("checkedChange", (details) => {
      observations.push("child-proposed");
      details.onAccepted(() => observations.push("child-accepted"));
    });
    group.subscribe("valueChange", (details) => {
      observations.push("group-proposed");
      details.onAccepted(() => observations.push("group-accepted"));
    });

    hdd?.click();

    expect(observations).toEqual([
      "child-proposed",
      "group-proposed",
      "group-accepted",
      "child-accepted",
    ]);
    expect(group.getValue()).toBe("hdd");
  });

  it("completes group and child acceptance callbacks before surfacing an exception", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    const [, hdd] = getRadios(root);
    const child = createRadio(hdd!);
    const group = createRadioGroup(root);
    const error = new Error("group accepted callback failed");
    const laterGroupAcceptance = vi.fn();
    const childAcceptance = vi.fn();
    const groupSync = vi.fn();
    const childSync = vi.fn();
    group.subscribe("valueChange", (details) => {
      details.onAccepted(() => {
        throw error;
      });
      details.onAccepted(laterGroupAcceptance);
    });
    child.subscribe("checkedChange", (details) => details.onAccepted(childAcceptance));
    group.subscribe("stateSync", groupSync);
    child.subscribe("stateSync", childSync);

    expect(() => child.setChecked(true)).toThrow(error);

    expect(group.getValue()).toBe("hdd");
    expect(laterGroupAcceptance).toHaveBeenCalledOnce();
    expect(childAcceptance).toHaveBeenCalledOnce();
    expect(groupSync).toHaveBeenCalledOnce();
    expect(childSync).toHaveBeenCalledOnce();
  });

  it("suppresses child acceptance when a group proposal listener throws before commit", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    const [, hdd] = getRadios(root);
    const child = createRadio(hdd!);
    const group = createRadioGroup(root);
    const error = new Error("group proposal failed");
    const childAccepted = vi.fn();
    child.subscribe("checkedChange", (details) => details.onAccepted(childAccepted));
    group.subscribe("valueChange", () => {
      throw error;
    });

    expect(() => child.setChecked(true)).toThrow(error);

    expect(childAccepted).not.toHaveBeenCalled();
    expect(group.getValue()).toBe("ssd");
    expect(hdd).toHaveAttribute("aria-checked", "false");
    expect(getInput(hdd!).checked).toBe(false);
  });

  it("suppresses stale child acceptance when an accepted group transition is superseded", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    const [, hdd, nvme] = getRadios(root);
    const hddRadio = createRadio(hdd!);
    const nvmeRadio = createRadio(nvme!);
    const group = createRadioGroup(root);
    const hddAccepted = vi.fn();
    const nvmeAccepted = vi.fn();
    hddRadio.subscribe("checkedChange", (details) => details.onAccepted(hddAccepted));
    nvmeRadio.subscribe("checkedChange", (details) => details.onAccepted(nvmeAccepted));
    group.subscribe("valueChange", (details) => {
      if (details.value === "hdd") {
        details.onAccepted(() => nvme!.click());
      }
    });

    hddRadio.setChecked(true);

    expect(group.getValue()).toBe("nvme");
    expect(hddAccepted).not.toHaveBeenCalled();
    expect(nvmeAccepted).toHaveBeenCalledOnce();
    expect(hdd).toHaveAttribute("aria-checked", "false");
    expect(nvme).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the newest reentrant group transition authoritative for model publication", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    const group = createRadioGroup(root);
    let published = group.getValue();
    group.subscribe("valueChange", (details) => {
      if (details.value === "hdd") {
        details.onAccepted(() => group.setValue("nvme"));
      }
      details.onAccepted(() => {
        published = details.value;
      });
    });
    group.subscribe("stateSync", () => {
      published = group.getValue();
    });

    group.setValue("hdd");

    expect(group.getValue()).toBe("nvme");
    expect(published).toBe("nvme");
  });

  it("ignores group cancellation requested after acceptance", () => {
    const root = renderRadioGroup({ defaultValue: "ssd" });
    const group = createRadioGroup(root);
    let acceptedDetails: { readonly isCanceled: boolean } | undefined;
    group.subscribe("valueChange", (details) => {
      acceptedDetails = details;
      details.onAccepted(() => details.cancel());
    });

    group.setValue("hdd");

    expect(acceptedDetails?.isCanceled).toBe(false);
    expect(group.getValue()).toBe("hdd");
  });

  it("does not publish child or group acceptance for pointer, keyboard, or imperative vetoes", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const [ssd, hdd] = getRadios(root);
    const child = createRadio(hdd!);
    const group = createRadioGroup(root);
    const accepted = vi.fn();
    child.subscribe("checkedChange", (details) => details.onAccepted(accepted));
    group.subscribe("valueChange", (details) => {
      details.onAccepted(accepted);
      details.cancel();
    });

    hdd?.click();
    child.setChecked(true);
    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(accepted).not.toHaveBeenCalled();
    expect(group.getValue()).toBe("ssd");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
  });

  it("restores grouped value, form data, and roving state on native reset", () => {
    vi.useFakeTimers();
    const form = document.createElement("form");
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);
    const listener = vi.fn();
    const syncListener = vi.fn();
    group.subscribe("valueChange", listener);
    group.subscribe("stateSync", syncListener);
    hdd?.click();
    listener.mockClear();
    syncListener.mockClear();

    form.reset();
    vi.runAllTimers();

    expect(group.getValue()).toBe("ssd");
    expect(root.getAttribute("data-value")).toBe("ssd");
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(getInput(ssd!).checked).toBe(true);
    expect(getInput(hdd!).checked).toBe(false);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
    expect(new FormData(form).get("storage")).toBe("ssd");
    expect(listener).not.toHaveBeenCalled();
    expect(syncListener).toHaveBeenCalledOnce();
  });

  it("restores uncontrolled native-button sibling inputs on reset", () => {
    vi.useFakeTimers();
    const form = document.createElement("form");
    const root = renderNativeButtonRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root);
    const [ssd, hdd] = getRadios(root);
    hdd?.click();

    form.reset();
    vi.runAllTimers();

    expect(group.getValue()).toBe("ssd");
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(getInput(ssd!).checked).toBe(true);
    expect(getInput(hdd!).checked).toBe(false);
    expect(new FormData(form).get("storage")).toBe("ssd");
  });

  it("restores native-button sibling inputs and preserves controlled group state", () => {
    vi.useFakeTimers();
    const form = document.createElement("form");
    const root = renderNativeButtonRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root, { value: "ssd" });
    const [, hdd] = getRadios(root);
    group.setValue("hdd", { emit: false });

    form.reset();
    vi.runAllTimers();

    expect(group.getValue()).toBe("hdd");
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(getInput(hdd!).checked).toBe(true);
    expect(new FormData(form).get("storage")).toBe("hdd");
  });

  it("cancels pending grouped reset reconciliation when destroyed", () => {
    vi.useFakeTimers();
    const form = document.createElement("form");
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    form.append(root);
    document.body.append(form);
    const group = createRadioGroup(root);
    group.setValue("hdd", { emit: false });

    form.reset();
    group.destroy();
    vi.runAllTimers();

    expect(group.getValue()).toBe("hdd");
  });

  it("follows exact external form rebinding without stale reset listeners", () => {
    vi.useFakeTimers();
    const firstForm = document.createElement("form");
    firstForm.id = "first-group-form";
    const secondForm = document.createElement("form");
    secondForm.id = "second-group-form";
    document.body.append(firstForm, secondForm);
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root, { form: firstForm.id });
    group.setValue("hdd", { emit: false });

    group.setFormOptions({ form: secondForm.id, name: "storage", required: false });
    firstForm.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBe("hdd");

    secondForm.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBe("ssd");
    expect(getInput(getRadios(root)[0]!).checked).toBe(true);
  });

  it("resets multiple groups associated with the same form independently", () => {
    vi.useFakeTimers();
    const form = document.createElement("form");
    const firstRoot = renderRadioGroup({ defaultValue: "ssd", name: "primary" });
    const secondRoot = renderRadioGroup({ defaultValue: "nvme", name: "secondary" });
    form.append(firstRoot, secondRoot);
    document.body.append(form);
    const firstGroup = createRadioGroup(firstRoot);
    const secondGroup = createRadioGroup(secondRoot);
    firstGroup.setValue("hdd", { emit: false });
    secondGroup.setValue("ssd", { emit: false });

    form.reset();
    vi.runAllTimers();

    expect(firstGroup.getValue()).toBe("ssd");
    expect(secondGroup.getValue()).toBe("nvme");
    expect(new FormData(form).get("primary")).toBe("ssd");
    expect(new FormData(form).get("secondary")).toBe("nvme");
  });

  it("preserves per-item forms, applies explicit group precedence, and resets exact forms", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <form id="form-a"></form>
      <form id="form-b"></form>
      <div data-sw-radio-group data-default-value="ssd" data-name="storage">
        <span data-sw-radio data-value="ssd"><input data-sw-radio-input form="form-a" /></span>
        <span data-sw-radio data-value="hdd"><input data-sw-radio-input form="form-b" /></span>
        <span data-sw-radio data-value="nvme"><input data-sw-radio-input form="form-b" /></span>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const group = createRadioGroup(root);
    const [ssd, hdd, nvme] = getRadios(root);

    expect(getInput(ssd!).getAttribute("form")).toBe("form-a");
    expect(getInput(hdd!).getAttribute("form")).toBe("form-b");

    group.setFormOptions({ form: "form-a", name: "storage", required: false });
    expect(getInput(hdd!).getAttribute("form")).toBe("form-a");
    group.setFormOptions({ form: undefined, name: "storage", required: false });
    expect(getInput(ssd!).getAttribute("form")).toBe("form-a");
    expect(getInput(hdd!).getAttribute("form")).toBe("form-b");

    hdd!.click();
    document.querySelector<HTMLFormElement>("#form-a")!.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBe("hdd");

    document.querySelector<HTMLFormElement>("#form-b")!.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBeUndefined();
    expect(getInput(hdd!).checked).toBe(false);

    getInput(nvme!).setAttribute("form", "form-a");
    await vi.runAllTimersAsync();
    nvme!.click();
    document.querySelector<HTMLFormElement>("#form-b")!.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBe("nvme");
    document.querySelector<HTMLFormElement>("#form-a")!.reset();
    vi.runAllTimers();
    expect(group.getValue()).toBe("ssd");
  });

  it("keeps nested radio roots bound to their own inputs", () => {
    document.body.innerHTML = `
      <div data-sw-radio-group data-default-value="outer">
        <span data-sw-radio data-value="outer">
          <span data-sw-radio data-value="inner"><input data-sw-radio-input /></span>
          <input data-sw-radio-input />
        </span>
      </div>
    `;
    const root = document.querySelector<HTMLElement>("[data-sw-radio-group]")!;
    const group = createRadioGroup(root);
    const [outer, inner] = getRadios(root);

    const outerInput = Array.from(
      outer!.querySelectorAll<HTMLInputElement>("[data-sw-radio-input]"),
    ).find((input) => input.closest("[data-sw-radio]") === outer)!;
    const innerInput = getInput(inner!);
    expect(outerInput).not.toBe(innerInput);
    inner!.click();
    expect(group.getValue()).toBe("inner");
    expect(innerInput.checked).toBe(true);
    expect(outerInput.checked).toBe(false);
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

  it("accepts the current child proposal without claiming controlled value commitment", () => {
    const root = renderRadioGroup({ name: "storage" });
    const [, hdd] = getRadios(root);
    const hddRadio = createRadio(hdd!);
    const childAccepted = vi.fn();
    hddRadio.subscribe("checkedChange", (details) => details.onAccepted(childAccepted));
    const group = createRadioGroup(root, { value: "ssd" });

    hdd?.click();

    expect(childAccepted).toHaveBeenCalledOnce();
    expect(group.getValue()).toBe("ssd");
    expect(hdd).toHaveAttribute("aria-checked", "false");
    expect(getInput(hdd!).checked).toBe(false);
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

  it("moves focus for an accepted controlled keyboard selection before prop reconciliation", () => {
    const root = renderRadioGroup({ name: "storage" });
    const proposals: string[] = [];
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => proposals.push(value),
    });
    const [ssd, hdd] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(proposals).toEqual(["hdd"]);
    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(hdd);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);

    group.setValue("hdd", { emit: false });

    expect(group.getValue()).toBe("hdd");
    expect(document.activeElement).toBe(hdd);
    expect(ssd?.tabIndex).toBe(-1);
    expect(hdd?.tabIndex).toBe(0);
    expect(proposals).toEqual(["hdd"]);
  });

  it("moves controlled Home/End focus across disabled items before prop reconciliation", () => {
    const root = renderRadioGroup({ disabledValues: ["hdd"], name: "storage" });
    const proposals: string[] = [];
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => proposals.push(value),
    });
    const [ssd, hdd, nvme] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" }),
    );

    expect(proposals).toEqual(["nvme"]);
    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(nvme);
    group.setValue("nvme", { emit: false });

    nvme?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Home" }),
    );

    expect(proposals).toEqual(["nvme", "ssd"]);
    expect(group.getValue()).toBe("nvme");
    expect(document.activeElement).toBe(ssd);
    expect(hdd?.getAttribute("aria-disabled")).toBe("true");
  });

  it("keeps controlled keyboard focus unchanged when the proposal is canceled", () => {
    const root = renderRadioGroup({ name: "storage" });
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (_value, details) => details.cancel(),
    });
    const [ssd, hdd] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
  });

  it("keeps controlled keyboard focus unchanged when a proposal listener fails", () => {
    const root = renderRadioGroup({ name: "storage" });
    const error = new Error("controlled proposal failed");
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: () => {
        throw error;
      },
    });
    const [ssd, hdd] = getRadios(root);
    const errors: unknown[] = [];
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      errors.push(event.error);
    };
    window.addEventListener("error", handleError);
    ssd?.focus();

    try {
      ssd?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
      );
    } finally {
      window.removeEventListener("error", handleError);
    }

    expect(errors).toEqual([error]);
    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
  });

  it("focuses an accepted controlled keyboard target before surfacing an acceptance error", () => {
    const root = renderRadioGroup({ name: "storage" });
    const error = new Error("controlled acceptance failed");
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (_value, details) => {
        details.onAccepted(() => {
          throw error;
        });
      },
    });
    const [ssd, hdd] = getRadios(root);
    const errors: unknown[] = [];
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      errors.push(event.error);
    };
    window.addEventListener("error", handleError);
    ssd?.focus();

    try {
      ssd?.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
      );
    } finally {
      window.removeEventListener("error", handleError);
    }

    expect(errors).toEqual([error]);
    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(hdd);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
  });

  it("does not focus a stale controlled keyboard target after synchronous supersession", () => {
    const root = renderRadioGroup({ name: "storage" });
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value, details) => {
        if (value === "hdd") {
          details.onAccepted(() => group.setValue("nvme"));
        }
      },
    });
    const [ssd, hdd, nvme] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("nvme");
    expect(document.activeElement).toBe(ssd);
    expect(ssd?.tabIndex).toBe(-1);
    expect(hdd?.tabIndex).toBe(-1);
    expect(nvme?.tabIndex).toBe(0);
  });

  it("does not focus a controlled keyboard target superseded by silent prop reconciliation", () => {
    const root = renderRadioGroup({ name: "storage" });
    const proposals: string[] = [];
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => {
        proposals.push(value);
        if (value === "hdd") {
          group.setValue("nvme", { emit: false });
        }
      },
    });
    const [ssd, hdd, nvme] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(proposals).toEqual(["hdd"]);
    expect(group.getValue()).toBe("nvme");
    expect(document.activeElement).toBe(ssd);
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(hdd?.tabIndex).toBe(-1);
    expect(nvme?.getAttribute("aria-checked")).toBe("true");
    expect(nvme?.tabIndex).toBe(0);
  });

  it("does not focus a controlled keyboard target superseded by silent undefined reconciliation", () => {
    const root = renderRadioGroup({ name: "storage" });
    const proposals: string[] = [];
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => {
        proposals.push(value);
        if (value === "hdd") {
          group.setValue(undefined, { emit: false });
        }
      },
    });
    const [ssd, hdd] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(proposals).toEqual(["hdd"]);
    expect(group.getValue()).toBeUndefined();
    expect(document.activeElement).toBe(ssd);
    expect(root).not.toHaveAttribute("data-value");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
    expect(hdd?.tabIndex).toBe(-1);
  });

  it("focuses a controlled keyboard target confirmed by silent prop reconciliation", () => {
    const root = renderRadioGroup({ name: "storage" });
    const proposals: string[] = [];
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => {
        proposals.push(value);
        group.setValue(value, { emit: false });
      },
    });
    const [ssd, hdd] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(proposals).toEqual(["hdd"]);
    expect(group.getValue()).toBe("hdd");
    expect(document.activeElement).toBe(hdd);
    expect(hdd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.tabIndex).toBe(0);
  });

  it("does not accept a child superseded by silent controlled prop reconciliation", () => {
    const root = renderRadioGroup({ name: "storage" });
    const [, hdd, nvme] = getRadios(root);
    const hddRadio = createRadio(hdd!);
    const childAccepted = vi.fn();
    const proposals: string[] = [];
    hddRadio.subscribe("checkedChange", (details) => details.onAccepted(childAccepted));
    const group = createRadioGroup(root, {
      value: "ssd",
      onValueChange: (value) => {
        proposals.push(value);
        if (value === "hdd") {
          group.setValue("nvme", { emit: false });
        }
      },
    });

    hddRadio.setChecked(true);

    expect(proposals).toEqual(["hdd"]);
    expect(childAccepted).not.toHaveBeenCalled();
    expect(group.getValue()).toBe("nvme");
    expect(hdd).toHaveAttribute("aria-checked", "false");
    expect(nvme).toHaveAttribute("aria-checked", "true");
  });

  it("keeps keyboard focus and roving state unchanged when selection is canceled", () => {
    const root = renderRadioGroup({ defaultValue: "ssd", name: "storage" });
    const group = createRadioGroup(root, {
      onValueChange: (_value, details) => details.cancel(),
    });
    const [ssd, hdd] = getRadios(root);
    ssd?.focus();

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    );

    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);
    expect(ssd?.tabIndex).toBe(0);
    expect(hdd?.tabIndex).toBe(-1);
    expect(ssd?.getAttribute("aria-checked")).toBe("true");
    expect(hdd?.getAttribute("aria-checked")).toBe("false");
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

  it("uses RTL-aware horizontal arrows and Home/End boundary navigation", () => {
    const root = renderRadioGroup({
      defaultValue: "hdd",
      dir: "rtl",
      name: "storage",
      orientation: "horizontal",
      disabledValues: ["nvme"],
    });
    const group = createRadioGroup(root);
    const [ssd, hdd, nvme] = getRadios(root);

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }),
    );

    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);

    ssd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }),
    );

    expect(group.getValue()).toBe("hdd");

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" }),
    );

    expect(group.getValue()).toBe("hdd");
    expect(document.activeElement).toBe(hdd);

    hdd?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Home" }),
    );

    expect(group.getValue()).toBe("ssd");
    expect(document.activeElement).toBe(ssd);
    expect(nvme?.getAttribute("aria-disabled")).toBe("true");
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
    disabledValues?: string[];
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
      <span data-sw-radio data-value="ssd" ${options.disabledValues?.includes("ssd") ? "data-disabled" : ""} ${options.readOnlyValues?.includes("ssd") ? "data-readonly" : ""}>
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="hdd" ${options.disabledValues?.includes("hdd") ? "data-disabled" : ""} ${options.readOnlyValues?.includes("hdd") ? "data-readonly" : ""}>
        <span data-sw-radio-indicator data-keep-mounted></span>
        <input data-sw-radio-input />
      </span>
      <span data-sw-radio data-value="nvme" ${options.disabledValues?.includes("nvme") ? "data-disabled" : ""} ${options.readOnlyValues?.includes("nvme") ? "data-readonly" : ""}>
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
