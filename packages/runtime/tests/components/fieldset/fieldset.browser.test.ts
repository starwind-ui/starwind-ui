import { beforeEach, describe, expect, it, vi } from "vitest";

import { createField } from "../../../src/components/field";
import { createForm } from "../../../src/components/form";
import { createFieldset } from "../../../src/components/fieldset/fieldset";

describe("createFieldset", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("labels the root from its legend and propagates disabled state to owned fields", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Shipping</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const legend = document.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createFieldset(fieldset);
    createField(field);

    expect(fieldset.disabled).toBe(true);
    expect(fieldset.getAttribute("aria-labelledby")).toBe(legend.id);
    expect(legend).toHaveAttribute("data-disabled");
    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);

    instance.setDisabled(false);
    await waitForMacrotask();

    expect(fieldset.disabled).toBe(false);
    expect(legend).not.toHaveAttribute("data-disabled");
    expect(field).not.toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(false);
  });

  it("honors runtime disabled options when static markup starts enabled", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset>
        <div data-sw-fieldset-legend>Shipping</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const legend = document.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createFieldset(fieldset, { disabled: true });
    createField(field);

    expect(fieldset.disabled).toBe(true);
    expect(legend).toHaveAttribute("data-disabled");
    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);

    instance.setDisabled(false);
    await waitForMacrotask();

    expect(fieldset.disabled).toBe(false);
    expect(legend).not.toHaveAttribute("data-disabled");
    expect(field).not.toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(false);
  });

  it("does not refresh from attributes it stamps during initial render", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset>
        <div data-sw-fieldset-legend>Shipping</div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const instance = createFieldset(fieldset);
    const refresh = vi.spyOn(instance, "refresh");

    await waitForMacrotask();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("preserves caller-authored aria-labelledby when no managed legend exists", async () => {
    document.body.innerHTML = `
      <span id="external-label">Account settings</span>
      <fieldset data-sw-fieldset aria-labelledby="external-label"></fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const instance = createFieldset(fieldset);
    await waitForMacrotask();

    expect(fieldset.getAttribute("aria-labelledby")).toBe("external-label");

    instance.refresh();

    expect(fieldset.getAttribute("aria-labelledby")).toBe("external-label");
  });

  it("removes only runtime-owned legend labels when the managed legend is removed", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset>
        <div data-sw-fieldset-legend>Account settings</div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const legend = document.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;
    createFieldset(fieldset);

    expect(fieldset.getAttribute("aria-labelledby")).toBe(legend.id);

    legend.remove();
    await waitForMacrotask();

    expect(fieldset).not.toHaveAttribute("aria-labelledby");
  });

  it("restores caller-authored aria-labelledby when destroying a managed legend association", () => {
    document.body.innerHTML = `
      <span id="external-label">Account settings</span>
      <fieldset data-sw-fieldset aria-labelledby="external-label">
        <div data-sw-fieldset-legend>Managed settings</div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const legend = document.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;
    const instance = createFieldset(fieldset);

    expect(fieldset.getAttribute("aria-labelledby")).toBe(legend.id);

    instance.destroy();

    expect(fieldset.getAttribute("aria-labelledby")).toBe("external-label");
  });

  it("settles after applying disabled state to an initialized child field", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Shipping</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;

    createFieldset(fieldset);
    createField(field);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);
  });

  it("re-enables child fields after externally toggling fieldset disabled state", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset>
        <div data-sw-fieldset-legend>Shipping</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;

    createFieldset(fieldset);
    createField(field);

    fieldset.disabled = true;
    fieldset.toggleAttribute("data-disabled", true);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);

    fieldset.disabled = false;
    fieldset.toggleAttribute("data-disabled", false);
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-disabled");
    expect(input).not.toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(false);
  });

  it("preserves a child field's own disabled state when the fieldset becomes enabled", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Billing</div>
        <div data-sw-field data-disabled>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createFieldset(fieldset);
    createField(field);

    instance.setDisabled(false);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);
  });

  it("preserves a child field that becomes own-disabled while inherited disabled is active", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Billing</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createFieldset(fieldset);
    createField(field);
    await waitForMacrotask();

    field.removeAttribute("data-disabled");
    await waitForMacrotask();
    field.setAttribute("data-disabled", "");
    await waitForMacrotask();

    instance.setDisabled(false);
    await waitForMacrotask();

    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);
  });

  it("applies disabled state to fields added after initialization", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Account</div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    createFieldset(fieldset);

    fieldset.insertAdjacentHTML(
      "beforeend",
      `<div data-sw-field><input data-sw-field-control data-sw-input /></div>`,
    );
    await waitForMacrotask();

    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    createField(field);

    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);
  });

  it("propagates disabled state to runtime-backed fields inside a managed form", async () => {
    document.body.innerHTML = `
      <form data-sw-form>
        <fieldset data-sw-fieldset>
          <div data-sw-fieldset-legend>Preferences</div>
          <div data-sw-field data-name="email">
            <input data-sw-field-control data-sw-input />
          </div>
          <div data-sw-field data-name="accept">
            <span data-sw-checkbox data-value="yes"></span>
          </div>
          <div data-sw-field data-name="locked" data-disabled>
            <input data-sw-field-control data-sw-input />
          </div>
        </fieldset>
      </form>
    `;

    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const legend = document.querySelector<HTMLElement>("[data-sw-fieldset-legend]")!;
    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-sw-field]"));
    const emailInput = fields[0]!.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const checkboxRoot = fields[1]!.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const lockedInput = fields[2]!.querySelector<HTMLInputElement>("[data-sw-field-control]")!;

    createForm(form);
    const fieldsetInstance = createFieldset(fieldset);
    await waitForMacrotask();

    expect(fieldset.getAttribute("aria-labelledby")).toBe(legend.id);

    fieldsetInstance.setDisabled(true);
    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(emailInput.disabled).toBe(true);
      expect(checkboxRoot).toHaveAttribute("aria-disabled", "true");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(true);
      expect(lockedInput.disabled).toBe(true);
    });

    fieldsetInstance.setDisabled(false);
    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(emailInput.disabled).toBe(false);
      expect(checkboxRoot).not.toHaveAttribute("aria-disabled");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(false);
      expect(lockedInput.disabled).toBe(true);
    });
  });

  it("preserves runtime control own disabled state when inherited disabled clears", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Preferences</div>
        <div data-sw-field data-name="accept">
          <span data-sw-checkbox data-value="yes" data-disabled></span>
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const checkboxRoot = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const fieldsetInstance = createFieldset(fieldset);
    createField(field);

    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(checkboxRoot).toHaveAttribute("aria-disabled", "true");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(true);
    });

    fieldsetInstance.setDisabled(false);

    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(field).not.toHaveAttribute("data-disabled");
      expect(checkboxRoot).toHaveAttribute("aria-disabled", "true");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(true);
    });
  });

  it("propagates disabled state through nested fieldsets to runtime-backed fields", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Outer</div>
        <fieldset data-sw-fieldset>
          <div data-sw-fieldset-legend>Inner</div>
          <div data-sw-field data-name="accept">
            <span data-sw-checkbox data-value="yes"></span>
          </div>
        </fieldset>
      </fieldset>
    `;

    const fieldsets = Array.from(
      document.querySelectorAll<HTMLFieldSetElement>("[data-sw-fieldset]"),
    );
    const outer = fieldsets[0]!;
    const inner = fieldsets[1]!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const checkboxRoot = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;

    const outerInstance = createFieldset(outer);
    createFieldset(inner);
    createField(field);
    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(inner).toHaveAttribute("data-disabled");
      expect(field).toHaveAttribute("data-disabled");
      expect(checkboxRoot).toHaveAttribute("aria-disabled", "true");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(true);
    });

    outerInstance.setDisabled(false);
    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(inner).not.toHaveAttribute("data-disabled");
      expect(field).not.toHaveAttribute("data-disabled");
      expect(checkboxRoot).not.toHaveAttribute("aria-disabled");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(false);
    });
  });

  it("preserves a nested fieldset that becomes own-disabled while inherited disabled is active", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Outer</div>
        <fieldset data-sw-fieldset>
          <div data-sw-fieldset-legend>Inner</div>
          <div data-sw-field>
            <input data-sw-field-control data-sw-input />
          </div>
        </fieldset>
      </fieldset>
    `;

    const fieldsets = Array.from(
      document.querySelectorAll<HTMLFieldSetElement>("[data-sw-fieldset]"),
    );
    const outer = fieldsets[0]!;
    const inner = fieldsets[1]!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;

    const outerInstance = createFieldset(outer);
    const innerInstance = createFieldset(inner);
    createField(field);
    await waitForMacrotask();

    innerInstance.setDisabled(true);
    await waitForMacrotask();
    outerInstance.setDisabled(false);
    await waitForMacrotask();

    expect(inner).toHaveAttribute("data-disabled");
    expect(field).toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(true);
  });

  it("does not treat same-task inherited disabled toggles as child-owned disabled", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Outer</div>
        <div data-sw-field>
          <input data-sw-field-control data-sw-input />
        </div>
      </fieldset>
    `;

    const fieldset = document.querySelector<HTMLFieldSetElement>("[data-sw-fieldset]")!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const input = document.querySelector<HTMLInputElement>("[data-sw-field-control]")!;
    const instance = createFieldset(fieldset);
    createField(field);
    await waitForMacrotask();

    instance.setDisabled(false);
    instance.setDisabled(true);
    await waitForMacrotask();
    instance.setDisabled(false);
    await waitForMacrotask();

    expect(field).not.toHaveAttribute("data-disabled");
    expect(input.disabled).toBe(false);
  });

  it("does not treat same-task inherited disabled toggles as nested fieldset-owned disabled", async () => {
    document.body.innerHTML = `
      <fieldset data-sw-fieldset data-disabled>
        <div data-sw-fieldset-legend>Outer</div>
        <fieldset data-sw-fieldset>
          <div data-sw-fieldset-legend>Inner</div>
          <div data-sw-field data-name="accept">
            <span data-sw-checkbox data-value="yes"></span>
          </div>
        </fieldset>
      </fieldset>
    `;

    const fieldsets = Array.from(
      document.querySelectorAll<HTMLFieldSetElement>("[data-sw-fieldset]"),
    );
    const outer = fieldsets[0]!;
    const inner = fieldsets[1]!;
    const field = document.querySelector<HTMLElement>("[data-sw-field]")!;
    const checkboxRoot = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
    const instance = createFieldset(outer);
    createFieldset(inner);
    createField(field);
    await waitForMacrotask();

    instance.setDisabled(false);
    instance.setDisabled(true);
    await waitForMacrotask();
    instance.setDisabled(false);
    await waitFor(() => {
      const checkboxInput = checkboxRoot.querySelector<HTMLInputElement>(
        "[data-sw-checkbox-input]",
      );

      expect(inner).not.toHaveAttribute("data-disabled");
      expect(field).not.toHaveAttribute("data-disabled");
      expect(checkboxRoot).not.toHaveAttribute("aria-disabled");
      expect(checkboxInput).toBeTruthy();
      expect(checkboxInput!.disabled).toBe(false);
    });
  });
});

async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(assertion: () => void): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  throw lastError;
}
