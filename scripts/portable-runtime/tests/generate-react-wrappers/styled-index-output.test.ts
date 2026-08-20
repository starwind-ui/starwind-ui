import path from "node:path";
import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { renderIndex } from "../../renderers/framework-adapters/react/styled/index-output.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

describe("React Styled index Primitive facade output", () => {
  it.each([
    ["package", "@starwind-ui/react", "@starwind-ui/react/toast"],
    ["local", undefined, "../../primitives/react/toast"],
  ])("renders deterministic %s-backed re-exports", (_label, primitiveImportBase, source) => {
    const group = projectStyledOutputComponentGroup(fixture());
    const outputRoot = "/workspace/components";
    const directory = path.join(outputRoot, group.component);
    const primitiveOutputRoot = "/workspace/primitives/react";

    const first = renderIndex(group, "", {
      directory,
      primitiveImportBase,
      primitiveOutputRoot,
    });
    const second = renderIndex(group, "", {
      directory,
      primitiveImportBase,
      primitiveOutputRoot,
    });

    expect(first).toBe(second);
    expect(first).toContain(`export { SharedName, createToast, toast } from "${source}";`);
    expect(first).toContain(`export type { ToastApi, ToastOptions } from "${source}";`);
    expect(first).not.toContain("export type { SharedName");
    expect(first).toMatch(/const FacadeProbeParts = \{\s+Root: FacadeProbe,?\s+\};/);
    expect(first).not.toMatch(/const FacadeProbeParts = \{[^}]*\btoast\b/);
  });
});

function fixture(): StyledAdapterContract {
  return {
    component: "facade-probe",
    components: [
      {
        exportName: "FacadeProbe",
        render: [{ selfClosing: true, tag: "div", type: "element" }],
      },
    ],
    defaultExport: { Root: "FacadeProbe" },
    primitiveFacadeExports: {
      component: "toast",
      types: ["ToastOptions", "SharedName", "ToastApi"],
      values: ["toast", "SharedName", "createToast"],
    },
    publicExports: ["FacadeProbe"],
  };
}
