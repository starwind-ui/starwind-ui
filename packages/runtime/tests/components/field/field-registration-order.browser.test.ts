import { expect, it } from "vitest";

import { createCheckbox } from "../../../src/components/checkbox";

it("adopts a directly initialized control when Field loads later", async () => {
  document.body.innerHTML = `
    <form>
      <div data-sw-field data-name="terms" data-disabled>
        <span data-sw-checkbox data-value="accepted"></span>
      </div>
    </form>
  `;
  const fieldRoot = document.querySelector<HTMLElement>("[data-sw-field]")!;
  const control = document.querySelector<HTMLElement>("[data-sw-checkbox]")!;
  const checkbox = createCheckbox(control, { checked: true });
  const input = control.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")!;
  const { createField } = await import("../../../src/components/field");
  const field = createField(fieldRoot);

  try {
    expect(control.querySelector("[data-sw-checkbox-input]")).toBe(input);
    expect(input.name).toBe("terms");
    expect(input.disabled).toBe(true);
    expect(input.checked).toBe(true);
    field.setDisabled(false);
    expect(input.disabled).toBe(false);
    expect(new FormData(document.querySelector("form")!).get("terms")).toBe("accepted");
  } finally {
    field.destroy();
    checkbox.destroy();
    document.body.innerHTML = "";
  }
});
