import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { selectVueStyledContracts } from "../../renderers/framework-adapters/vue/styled.js";

describe("Vue Styled dependency closure", () => {
  it("selects the complete real Combobox dependency closure", () => {
    expect(
      selectVueStyledContracts(starwindStyledContracts, ["combobox"]).map(
        (contract) => contract.component,
      ),
    ).toEqual(["button", "combobox", "input", "input-group", "textarea"]);
  });

  it("reports a missing composed dependency with its requiring component", () => {
    expect(() => selectVueStyledContracts([createContract("root", ["missing"])], ["root"])).toThrow(
      'Missing Vue Styled dependency "missing" required by "root".',
    );
  });

  it("handles cycles and duplicate roots without duplicate output", () => {
    const contracts = [createContract("second", ["first"]), createContract("first", ["second"])];

    expect(
      selectVueStyledContracts(contracts, ["second", "first", "second"]).map(
        (contract) => contract.component,
      ),
    ).toEqual(["first", "second"]);
  });

  it("returns stable component order for shuffled roots and contracts", () => {
    const firstOrder = [
      createContract("third", ["second"]),
      createContract("first", ["second"]),
      createContract("second"),
    ];
    const secondOrder = [firstOrder[1], firstOrder[2], firstOrder[0]];

    const selectComponents = (contracts: StyledAdapterContract[], roots: string[]) =>
      selectVueStyledContracts(contracts, roots).map((contract) => contract.component);

    expect(selectComponents(firstOrder, ["third", "first"])).toEqual(["first", "second", "third"]);
    expect(selectComponents(secondOrder, ["first", "third"])).toEqual(["first", "second", "third"]);
  });

  it("ignores composed references outside the Vue target scope", () => {
    const root = createContract("root");
    root.components[0]?.props?.extends?.push({
      component: "react-only",
      exportName: "ReactOnly",
      frameworks: ["react"],
      type: "componentProps",
    });

    expect(
      selectVueStyledContracts([root], ["root"]).map((contract) => contract.component),
    ).toEqual(["root"]);
  });
});

function createContract(
  component: string,
  dependencies: readonly string[] = [],
): StyledAdapterContract {
  const exportName = `${component.replace(/(^|-)([a-z])/g, (_, _separator, letter: string) =>
    letter.toUpperCase(),
  )}Root`;

  return {
    component,
    components: [
      {
        exportName,
        props: { extends: [] },
        render: dependencies.map((dependency) => ({
          component: dependency,
          exportName: "Root",
          selfClosing: true,
          type: "component" as const,
        })),
      },
    ],
    defaultExport: { Root: exportName },
    publicExports: [exportName],
  };
}
