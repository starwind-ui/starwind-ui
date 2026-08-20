import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import {
  projectStyledOutputComponentGroup,
  toStyledAdapterContract,
} from "../../renderers/styled-output-model/index.js";

describe("Styled Output Model Primitive facade exports", () => {
  it("projects and round-trips a deterministic logical Primitive facade", () => {
    const contract = fixture({
      component: "toast",
      types: ["ToastPromiseOptions", "ToastApi", "ToastOptions"],
      values: ["toast", "createToast"],
    });

    const group = projectStyledOutputComponentGroup(contract);

    expect(group.primitiveFacadeExports).toEqual({
      component: "toast",
      types: ["ToastApi", "ToastOptions", "ToastPromiseOptions"],
      values: ["createToast", "toast"],
    });
    expect(toStyledAdapterContract(group).primitiveFacadeExports).toEqual(
      group.primitiveFacadeExports,
    );
    expect(projectStyledOutputComponentGroup(toStyledAdapterContract(group))).toEqual(group);
  });
});

function fixture(
  primitiveFacadeExports: NonNullable<StyledAdapterContract["primitiveFacadeExports"]>,
): StyledAdapterContract {
  return {
    component: "facade-probe",
    components: [
      {
        exportName: "FacadeProbe",
        render: [{ selfClosing: true, tag: "div", type: "element" }],
      },
    ],
    defaultExport: { Root: "FacadeProbe" },
    primitiveFacadeExports,
    publicExports: ["FacadeProbe"],
  };
}
