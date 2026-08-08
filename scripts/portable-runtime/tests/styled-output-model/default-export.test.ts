import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import {
  projectStyledOutputComponentGroup,
  validateStyledPartsIdentifier,
} from "../../renderers/styled-output-model/index.js";

describe("Styled Output Model parts defaults", () => {
  it("allocates a deterministic private identifier after every index binding collision", () => {
    const contract: StyledAdapterContract = {
      component: "collision-probe",
      components: [
        component("CollisionProbeParts"),
        component("CollisionProbeParts6"),
        component("CollisionProbeParts7"),
      ],
      constants: { CollisionProbeParts2: '"constant"' },
      defaultExport: { Root: "CollisionProbeParts7" },
      publicExports: ["CollisionProbeParts6"],
      variantAliases: {
        CollisionProbeParts4: {
          importName: "sourceVariant",
          source: "../source/variants",
        },
      },
      variantCollectionName: "CollisionProbeParts5",
      variants: {
        CollisionProbeParts3: { base: "fixture" },
      },
    };

    const group = projectStyledOutputComponentGroup(contract);

    expect(group.defaultExport).toMatchObject({
      identifier: "CollisionProbeParts8",
      mode: "parts",
    });
    expect(validateStyledPartsIdentifier(group)).toEqual([]);
  });

  it("reports a model identifier that collides with an index binding", () => {
    const group = projectStyledOutputComponentGroup({
      component: "collision-probe",
      components: [component("CollisionProbeParts")],
      defaultExport: { Root: "CollisionProbeParts" },
      publicExports: ["CollisionProbeParts"],
    });

    if (group.defaultExport.mode !== "parts") {
      throw new Error("The collision fixture must use parts mode.");
    }
    group.defaultExport.identifier = "CollisionProbeParts";

    expect(validateStyledPartsIdentifier(group)).toEqual([
      'Parts default export identifier "CollisionProbeParts" collides with an index binding.',
    ]);
  });

  it("reports a model identifier that is not valid TypeScript", () => {
    const group = projectStyledOutputComponentGroup({
      component: "invalid-probe",
      components: [component("Probe")],
      defaultExport: { Root: "Probe" },
      publicExports: ["Probe"],
    });

    if (group.defaultExport.mode !== "parts") {
      throw new Error("The invalid identifier fixture must use parts mode.");
    }
    group.defaultExport.identifier = "123Parts";

    expect(validateStyledPartsIdentifier(group)).toEqual([
      'Parts default export identifier "123Parts" is not a valid TypeScript identifier.',
    ]);
  });

  it.each(["eval", "arguments"])("rejects the strict-mode binding identifier %s", (identifier) => {
    const group = projectStyledOutputComponentGroup({
      component: "strict-mode-probe",
      components: [component("Probe")],
      defaultExport: { Root: "Probe" },
      publicExports: ["Probe"],
    });

    if (group.defaultExport.mode !== "parts") {
      throw new Error("The strict-mode identifier fixture must use parts mode.");
    }
    group.defaultExport.identifier = identifier;

    expect(validateStyledPartsIdentifier(group)).toEqual([
      `Parts default export identifier "${identifier}" is not a valid TypeScript identifier.`,
    ]);
  });

  it("prefixes a numeric-leading component name to form a valid identifier", () => {
    const group = projectStyledOutputComponentGroup({
      component: "123-probe",
      components: [component("Probe")],
      defaultExport: { Root: "Probe" },
      publicExports: ["Probe"],
    });

    expect(group.defaultExport).toMatchObject({
      identifier: "Styled123ProbeParts",
      mode: "parts",
    });
  });

  it("uses a deterministic fallback for a punctuation-only component name", () => {
    const group = projectStyledOutputComponentGroup({
      component: "---",
      components: [component("Probe")],
      constants: { StyledParts: '"reserved"' },
      defaultExport: { Root: "Probe" },
      publicExports: ["Probe"],
    });

    expect(group.defaultExport).toMatchObject({
      identifier: "StyledParts2",
      mode: "parts",
    });
  });

  it("keeps direct component defaults free of a private identifier", () => {
    const group = projectStyledOutputComponentGroup({
      component: "direct-probe",
      components: [component("DirectProbe")],
      defaultExport: { Root: "DirectProbe" },
      defaultExportMode: "component",
      publicExports: ["DirectProbe"],
    });

    expect(group.defaultExport).toEqual({
      members: [{ exportName: "Root", localName: "DirectProbe" }],
      mode: "component",
    });
    expect(validateStyledPartsIdentifier(group)).toEqual([]);
  });
});

function component(exportName: string): StyledAdapterContract["components"][number] {
  return {
    destructure: { props: [] },
    exportName,
    render: [{ selfClosing: true, tag: "div", type: "element" }],
  };
}
