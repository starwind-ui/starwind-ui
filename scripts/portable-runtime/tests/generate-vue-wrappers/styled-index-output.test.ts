import path from "node:path";
import { describe, expect, it } from "vitest";
import { badgeStyledContract } from "../../contracts/styled/components/badge.js";
import { buttonStyledContract } from "../../contracts/styled/components/button.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { renderIndex } from "../../renderers/framework-adapters/vue/styled/index-output.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { compactCode } from "../source-comparison.js";

describe("Vue Styled index output", () => {
  it("names aggregate defaults without adding the private binding to named exports", () => {
    const source = renderIndex(projectStyledOutputComponentGroup(buttonStyledContract));

    expect(compactCode(source)).toContain(compactCode("const ButtonParts = { Root: Button };"));
    expect(compactCode(source)).toContain(compactCode("export default ButtonParts;"));
    expect(source).not.toMatch(/export default\s*{/);
    expect(source).not.toMatch(/export\s*{[^}]*\bButtonParts\b/);
  });

  it("keeps direct component defaults direct", () => {
    const source = renderIndex(projectStyledOutputComponentGroup(badgeStyledContract));

    expect(compactCode(source)).toContain(compactCode("export default Badge;"));
    expect(compactCode(source)).not.toContain(compactCode("BadgeParts"));
  });

  it("uses the model-owned collision suffix in target output", () => {
    const contract: StyledAdapterContract = {
      ...structuredClone(buttonStyledContract),
      constants: { ButtonParts: '"reserved"' },
    };
    const source = renderIndex(projectStyledOutputComponentGroup(contract));

    expect(compactCode(source)).toContain(compactCode('const ButtonParts = "reserved";'));
    expect(compactCode(source)).toContain(compactCode("const ButtonParts2 = { Root: Button };"));
    expect(compactCode(source)).toContain(compactCode("export default ButtonParts2;"));
    expect(source).not.toMatch(/export\s*{[^}]*\bButtonParts2\b/);
  });

  it.each([
    ["package", "@starwind-ui/vue", "@starwind-ui/vue/toast"],
    ["local", undefined, "../../primitives/vue/toast"],
  ])(
    "renders deterministic %s-backed Primitive facade exports",
    (_label, primitiveImportBase, source) => {
      const contract: StyledAdapterContract = {
        ...structuredClone(buttonStyledContract),
        component: "facade-probe",
        primitiveFacadeExports: {
          component: "toast",
          types: ["ToastOptions", "SharedName", "ToastApi"],
          values: ["toast", "SharedName", "createToast"],
        },
      };
      const group = projectStyledOutputComponentGroup(contract);
      const options = {
        directory: path.join("/workspace/components", group.component),
        primitiveImportBase,
        primitiveOutputRoot: "/workspace/primitives/vue",
      };

      const first = renderIndex(group, options);

      expect(first).toBe(renderIndex(group, options));
      expect(first).toContain(`export { SharedName, createToast, toast } from "${source}";`);
      expect(first).toContain(`export type { ToastApi, ToastOptions } from "${source}";`);
      expect(first).not.toContain("export type { SharedName");
      expect(first).toContain("const FacadeProbeParts = { Root: Button };");
      expect(first).not.toContain("FacadeProbeParts = { Root: Button, toast");
    },
  );
});
