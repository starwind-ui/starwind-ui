import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { Field } from "../src/field";
import Candidate from "../src/switch/SwitchRoot";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("Form recipe Field name ownership", () => {
  const Component = Candidate;
  it("retains Field name through unrelated render and Field rename", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const render = async (name: string, marker: number) => {
      await act(async () => {
        root.render(
          <form>
            <Field.Root name={name}>
              <div>
                <Component defaultChecked nativeButton value="enabled" data-marker={marker} />
              </div>
            </Field.Root>
          </form>,
        );
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    };
    try {
      await render("alerts", 0);
      const input = container.querySelector("input")!;
      const form = container.querySelector("form")!;
      expect(input.name).toBe("alerts");
      await render("alerts", 1);
      expect(input.name).toBe("alerts");
      expect(new FormData(form).get("alerts")).toBe("enabled");
      await render("renamed", 1);
      await render("renamed", 2);
      expect(input.name).toBe("renamed");
      expect(new FormData(form).get("renamed")).toBe("enabled");
    } finally {
      await act(() => root.unmount());
      container.remove();
    }
  });
});
