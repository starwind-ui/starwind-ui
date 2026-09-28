import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "../src/button";
import { Checkbox } from "../src/checkbox";
import { CheckboxGroup } from "../src/checkbox-group";
import { Switch } from "../src/switch";
import { Toggle } from "../src/toggle";
import { ToggleGroup } from "../src/toggle-group";

describe("React effective initial state", () => {
  it.each([false, true])(
    "keeps disabled Button focusability explicit (%s)",
    (focusableWhenDisabled) => {
      const html = renderToString(
        <Button.Root disabled focusableWhenDisabled={focusableWhenDisabled}>
          Save
        </Button.Root>,
      );
      expect(/\sdisabled(?:=|\s|>)/.test(html)).toBe(!focusableWhenDisabled);
      expect(html.includes('aria-disabled="true"')).toBe(focusableWhenDisabled);
    },
  );

  for (const [family, Control] of [
    ["checkbox", Checkbox.Root],
    ["switch", Switch.Root],
  ] as const) {
    it.each([true, false])(
      `${family} projects controlled %s to native and ARIA state`,
      (checked) => {
        const html = renderToString(
          <Control checked={checked} defaultChecked={!checked} name="setting" value="yes" />,
        );
        expect(html).toContain(`aria-checked="${checked}"`);
        const input = html.match(/<input\b[^>]*>/)![0];
        expect(/\schecked(?:=|\s|>)/.test(input)).toBe(checked);
        expect(html.includes('data-default-checked="true"')).toBe(!checked);
      },
    );
  }

  it("projects Checkbox Group membership ahead of individual control props", () => {
    const html = renderToString(
      <CheckboxGroup.Root value={["alpha"]}>
        <Checkbox.Root value="alpha" checked={false} />
        <Checkbox.Root value="beta" checked defaultChecked />
      </CheckboxGroup.Root>,
    );
    const inputs = html.match(/<input\b[^>]*>/g)!;
    expect(inputs).toHaveLength(2);
    expect(/\schecked(?:=|\s|>)/.test(inputs[0]!)).toBe(true);
    expect(/\schecked(?:=|\s|>)/.test(inputs[1]!)).toBe(false);
  });

  it.each([false, true])(
    "projects selected and disabled Toggle Group state (multiple=%s)",
    (multiple) => {
      const html = renderToString(
        <ToggleGroup.Root disabled multiple={multiple} value={["alpha", "beta"]}>
          <Toggle.Root value="alpha" pressed={false}>
            Alpha
          </Toggle.Root>
          <Toggle.Root value="beta" pressed nativeButton={false}>
            Beta
          </Toggle.Root>
          <Toggle.Root value="gamma" defaultPressed>
            Gamma
          </Toggle.Root>
        </ToggleGroup.Root>,
      );
      const roots = html.match(/<(?:button|span)\b[^>]*data-sw-toggle=""[^>]*>/g)!;
      expect(roots).toHaveLength(3);
      expect(roots[0]).toContain('aria-pressed="true"');
      expect(roots[0]).toContain('disabled=""');
      expect(roots[1]).toContain(`aria-pressed="${multiple}"`);
      expect(roots[1]).toContain('aria-disabled="true"');
      expect(roots[1]).toContain('tabindex="-1"');
      expect(roots[2]).toContain('aria-pressed="false"');
      expect(roots.every((root) => root.includes('data-disabled=""'))).toBe(true);
      expect(html).not.toContain("data-default-pressed");
    },
  );

  it("keeps standalone Toggle state and disabled props independent", () => {
    const html = renderToString(
      <>
        <Toggle.Root defaultPressed>On</Toggle.Root>
        <Toggle.Root pressed={false} defaultPressed disabled>
          Off
        </Toggle.Root>
      </>,
    );
    const roots = html.match(/<button\b[^>]*>/g)!;
    expect(roots[0]).toContain('aria-pressed="true"');
    expect(roots[0]).not.toContain('disabled=""');
    expect(roots[1]).toContain('aria-pressed="false"');
    expect(roots[1]).toContain('disabled=""');
  });
});
