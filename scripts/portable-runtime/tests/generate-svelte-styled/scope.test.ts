import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { getImplementedSvelteStyledRoots } from "../../renderers/framework-adapters/svelte/inventory.js";
import { describe, expect, it } from "vitest";

import { buttonStyledContract } from "../../contracts/styled/components/button.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import {
  selectSvelteStyledContracts,
  supportsSvelteScope,
} from "../../renderers/framework-adapters/svelte/styled/scope.js";

const contract = (component: string, dependency?: string): StyledAdapterContract => ({
  component,
  publicExports: ["Root"],
  defaultExport: { Root: "Root" },
  components: [
    {
      exportName: "Root",
      render: dependency
        ? [{ type: "component", component: dependency, exportName: "Root" }]
        : [{ type: "element", tag: "div" }],
    },
  ],
});

describe("Svelte Styled scope and dependency closure", () => {
  it("limits default scope to all implemented Styled roots and retains explicit framework filters", () => {
    expect(
      selectSvelteStyledContracts(starwindStyledContracts).map((entry) => entry.component),
    ).toEqual([...getImplementedSvelteStyledRoots()].sort());
    expect(supportsSvelteScope(undefined)).toBe(true);
    expect(supportsSvelteScope(["svelte"])).toBe(true);
    expect(supportsSvelteScope(["astro", "react", "vue"])).toBe(false);
    expect(supportsSvelteScope([])).toBe(false);
    expect(selectSvelteStyledContracts([buttonStyledContract], [])).toEqual([]);
  });

  it("accepts explicit Svelte scope in shared validation and diagnoses unsupported filters", () => {
    expect(
      validateStyledAdapterContracts([{ ...buttonStyledContract, frameworks: ["svelte"] }]),
    ).toEqual([]);
    expect(validateStyledAdapterContracts([{ ...buttonStyledContract, frameworks: [] }])).toEqual([
      expect.objectContaining({
        path: "frameworks",
        message: "Framework filter must include at least one target.",
      }),
    ]);
    expect(
      validateStyledAdapterContracts([
        { ...buttonStyledContract, frameworks: ["unknown" as never] },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "frameworks.unknown",
          message: 'Unsupported framework target "unknown".',
        }),
      ]),
    );
  });

  it("derives a transitive dependency once from structured component references", () => {
    const contracts = [contract("a", "b"), contract("b", "c"), contract("c")];
    contracts[0]!.dependencies = { styledComponents: ["c"] };
    const selected = selectSvelteStyledContracts(contracts, ["a"], ["a", "b", "c"]);
    expect(selected.map((entry) => entry.component)).toEqual(["a", "b", "c"]);
    expect(selected[0]).toBe(contracts[0]);
  });

  it.each([
    [
      "duplicate root",
      [buttonStyledContract],
      ["button", "button"],
      ["button"],
      /duplicate root.*button/,
    ],
    [
      "duplicate identity",
      [buttonStyledContract, buttonStyledContract],
      ["button"],
      ["button"],
      /duplicate contract "button"/,
    ],
    [
      "unknown root",
      [buttonStyledContract],
      ["unknown"],
      ["button"],
      /unknown or missing root "unknown"/,
    ],
    [
      "missing dependency",
      [contract("a", "b")],
      ["a"],
      ["a", "b"],
      /missing dependency "b" required by "a"/,
    ],
    [
      "unimplemented root",
      [contract("checkbox")],
      ["checkbox"],
      ["button"],
      /checkbox.*no implemented output owner/,
    ],
    [
      "unimplemented dependency",
      [contract("a", "b"), contract("b")],
      ["a"],
      ["a"],
      /dependency "b" required by "a".*no implemented output owner/,
    ],
    [
      "unsupported root scope",
      [{ ...buttonStyledContract, frameworks: ["vue"] }],
      ["button"],
      ["button"],
      /unsupported target scope.*button/,
    ],
    [
      "unsupported dependency scope",
      [contract("a", "b"), { ...contract("b"), frameworks: ["react"] }],
      ["a"],
      ["a", "b"],
      /unsupported target scope.*dependency "b" required by "a"/,
    ],
  ] as const)("rejects %s", (_label, contracts, roots, supported, diagnostic) => {
    expect(() =>
      selectSvelteStyledContracts(contracts as readonly StyledAdapterContract[], roots, supported),
    ).toThrow(diagnostic);
  });
});
