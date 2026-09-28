import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import FieldsetRoot from "../src/fieldset/FieldsetRoot";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("restores a nested fieldset's own enabled state after its parent enables", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = async (outer: boolean, inner: boolean) => {
    await act(async () => {
      root.render(
        <form>
          <FieldsetRoot disabled={outer}>
            <FieldsetRoot disabled={inner}>
              <input name="choice" defaultValue="ready" />
            </FieldsetRoot>
          </FieldsetRoot>
        </form>,
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };
  try {
    await render(false, true);
    expect(new FormData(host.querySelector("form")!).has("choice")).toBe(false);
    await render(true, false);
    expect(host.querySelector("input")!.matches(":disabled")).toBe(true);
    await render(false, false);
    expect(host.querySelector("input")!.matches(":disabled")).toBe(false);
    expect(new FormData(host.querySelector("form")!).get("choice")).toBe("ready");
    await render(false, true);
    expect(new FormData(host.querySelector("form")!).has("choice")).toBe(false);
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});
