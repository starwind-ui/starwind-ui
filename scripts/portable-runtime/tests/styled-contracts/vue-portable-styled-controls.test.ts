import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type {
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import { selectVueStyledContracts } from "../../renderers/framework-adapters/vue/styled.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

export const CONTROL_GROUPS = [
  "button-group",
  "input-group",
  "native-select",
  "pagination",
  "textarea",
] as const;

const EXPECTED_SELECTED_GROUPS = [
  "button",
  "button-group",
  "input",
  "input-group",
  "native-select",
  "pagination",
  "separator",
  "textarea",
];

export const CONTROL_OUTPUT_FILES = {
  "button-group": [
    "ButtonGroup.vue",
    "ButtonGroupSeparator.vue",
    "ButtonGroupText.vue",
    "index.ts",
    "variants.ts",
  ],
  "input-group": [
    "InputGroup.vue",
    "InputGroupAddon.vue",
    "InputGroupButton.vue",
    "InputGroupInput.vue",
    "InputGroupText.vue",
    "InputGroupTextarea.vue",
    "index.ts",
    "variants.ts",
  ],
  "native-select": [
    "NativeSelect.vue",
    "NativeSelectOptGroup.vue",
    "NativeSelectOption.vue",
    "index.ts",
    "variants.ts",
  ],
  pagination: [
    "Pagination.vue",
    "PaginationContent.vue",
    "PaginationEllipsis.vue",
    "PaginationItem.vue",
    "PaginationLink.vue",
    "PaginationNext.vue",
    "PaginationPrevious.vue",
    "index.ts",
    "variants.ts",
  ],
  textarea: ["Textarea.vue", "index.ts", "variants.ts"],
} as const;

const CONTROL_CONTRACT_ORACLE = {
  "button-group": {
    components: ["ButtonGroup", "ButtonGroupSeparator", "ButtonGroupText"],
    dataSlots: {
      ButtonGroup: ["button-group"],
      ButtonGroupSeparator: ["button-group-separator"],
      ButtonGroupText: ["button-group-text"],
    },
    slots: {
      ButtonGroup: ["default"],
      ButtonGroupSeparator: [],
      ButtonGroupText: ["default"],
    },
    variants: ["buttonGroup", "buttonGroupSeparator", "buttonGroupText"],
  },
  "input-group": {
    components: [
      "InputGroup",
      "InputGroupAddon",
      "InputGroupButton",
      "InputGroupInput",
      "InputGroupText",
      "InputGroupTextarea",
    ],
    dataSlots: {
      InputGroup: ["input-group"],
      InputGroupAddon: ["input-group-addon"],
      InputGroupButton: [],
      InputGroupInput: ["input-group-control"],
      InputGroupText: [],
      InputGroupTextarea: ["input-group-control"],
    },
    slots: {
      InputGroup: ["default"],
      InputGroupAddon: ["default"],
      InputGroupButton: ["default"],
      InputGroupInput: [],
      InputGroupText: ["default"],
      InputGroupTextarea: [],
    },
    variants: [
      "inputGroup",
      "inputGroupAddon",
      "inputGroupButton",
      "inputGroupInput",
      "inputGroupText",
      "inputGroupTextarea",
    ],
  },
  "native-select": {
    components: ["NativeSelect", "NativeSelectOptGroup", "NativeSelectOption"],
    dataSlots: {
      NativeSelect: ["native-select", "native-select-icon", "native-select-wrapper"],
      NativeSelectOptGroup: ["native-select-optgroup"],
      NativeSelectOption: ["native-select-option"],
    },
    slots: {
      NativeSelect: ["default", "icon"],
      NativeSelectOptGroup: ["default"],
      NativeSelectOption: ["default"],
    },
    variants: ["nativeSelect", "nativeSelectIcon", "nativeSelectWrapper"],
  },
  pagination: {
    components: [
      "Pagination",
      "PaginationContent",
      "PaginationEllipsis",
      "PaginationItem",
      "PaginationLink",
      "PaginationNext",
      "PaginationPrevious",
    ],
    dataSlots: {
      Pagination: ["pagination"],
      PaginationContent: ["pagination-content"],
      PaginationEllipsis: ["pagination-ellipsis"],
      PaginationItem: ["pagination-item"],
      PaginationLink: ["pagination-link"],
      PaginationNext: ["pagination-next"],
      PaginationPrevious: ["pagination-previous"],
    },
    slots: {
      Pagination: ["default"],
      PaginationContent: ["default"],
      PaginationEllipsis: ["default", "icon"],
      PaginationItem: ["default"],
      PaginationLink: ["default"],
      PaginationNext: ["default", "icon"],
      PaginationPrevious: ["default", "icon"],
    },
    variants: ["pagination", "paginationContent", "paginationEllipsis"],
  },
  textarea: {
    components: ["Textarea"],
    dataSlots: { Textarea: ["textarea"] },
    slots: { Textarea: [] },
    variants: ["textarea"],
  },
} as const;

export const CONTROL_ELEMENT_TARGETS = {
  "button-group": {
    ButtonGroup: null,
    ButtonGroupSeparator: null,
    ButtonGroupText: null,
  },
  "input-group": {
    InputGroup: null,
    InputGroupAddon: null,
    InputGroupButton: null,
    InputGroupInput: null,
    InputGroupText: null,
    InputGroupTextarea: null,
  },
  "native-select": {
    NativeSelect: "HTMLSelectElement",
    NativeSelectOptGroup: "HTMLOptGroupElement",
    NativeSelectOption: "HTMLOptionElement",
  },
  pagination: {
    Pagination: "HTMLElement",
    PaginationContent: "HTMLUListElement",
    PaginationEllipsis: "HTMLSpanElement",
    PaginationItem: "HTMLLIElement",
    PaginationLink: null,
    PaginationNext: null,
    PaginationPrevious: null,
  },
  textarea: { Textarea: "HTMLTextAreaElement" },
} as const;

const COMPOSITION_ORACLE = {
  "button-group": { ButtonGroupSeparator: ["separator.Separator"] },
  "input-group": {
    InputGroupButton: ["button.Button"],
    InputGroupInput: ["input.Input"],
    InputGroupTextarea: ["textarea.Textarea"],
  },
  pagination: {
    PaginationLink: ["button.Button"],
    PaginationNext: ["pagination.PaginationLink"],
    PaginationPrevious: ["pagination.PaginationLink"],
  },
} as const;

const SEMANTIC_CONTROL_ORACLE = [
  {
    component: "InputGroupButton",
    group: "input-group",
    kind: "component",
    target: "button.Button",
  },
  { component: "InputGroupInput", group: "input-group", kind: "component", target: "input.Input" },
  {
    component: "InputGroupTextarea",
    group: "input-group",
    kind: "component",
    target: "textarea.Textarea",
  },
  { component: "NativeSelect", group: "native-select", kind: "element", target: "select" },
  { component: "Textarea", group: "textarea", kind: "element", target: "textarea" },
] as const;

describe("Vue portable Styled control contracts", () => {
  const contracts = CONTROL_GROUPS.map(findContract);

  it("selects every control group with its declared dependency closure", () => {
    const selected = selectVueStyledContracts(starwindStyledContracts, CONTROL_GROUPS);

    expect(selected.map(({ component }) => component)).toEqual(EXPECTED_SELECTED_GROUPS);
    expect(() => validateStyledAdapterContracts(selected)).not.toThrow();
  });

  it("locks exact public outputs, lazy slots, variants, and data-slot values", () => {
    expect(collectContractSurface(contracts)).toEqual(CONTROL_CONTRACT_ORACLE);

    for (const contract of contracts) {
      const output = projectStyledOutputComponentGroup(contract);
      expect(output.components.map(({ exportName }) => `${exportName}.vue`).sort()).toEqual(
        CONTROL_OUTPUT_FILES[contract.component as keyof typeof CONTROL_OUTPUT_FILES]
          .filter((file) => file.endsWith(".vue"))
          .sort(),
      );
    }
  });

  it("keeps Input Group and Pagination composition with their established owners", () => {
    expect(collectComposition(contracts)).toEqual(COMPOSITION_ORACLE);
  });

  it("forwards attrs and native listeners once to each semantic form control owner", () => {
    for (const expected of SEMANTIC_CONTROL_ORACLE) {
      const component = findComponent(findContract(expected.group), expected.component);
      const target = findSemanticTarget(component.render, expected.kind, expected.target);

      expect(target).toBeDefined();
      expect(
        target && "attrs" in target ? target.attrs?.filter(({ name }) => name === "spread") : [],
      ).toHaveLength(1);
      expect(collectAttributes(component.render, "spread")).toHaveLength(1);
    }
  });

  it("records direct native control ref targets as framework-neutral facts", () => {
    expect(collectForwardRefTargets(contracts)).toEqual(CONTROL_ELEMENT_TARGETS);
  });
});

function findContract(component: (typeof CONTROL_GROUPS)[number]): StyledAdapterContract {
  const contract = starwindStyledContracts.find((candidate) => candidate.component === component);
  if (!contract) throw new TypeError(`Missing Styled contract ${component}.`);
  return contract;
}

function findComponent(
  contract: StyledAdapterContract,
  exportName: string,
): StyledComponentContract {
  const component = contract.components.find((candidate) => candidate.exportName === exportName);
  if (!component) throw new TypeError(`Missing ${contract.component}.${exportName}.`);
  return component;
}

function collectContractSurface(contracts: readonly StyledAdapterContract[]) {
  return Object.fromEntries(
    contracts.map((contract) => [
      contract.component,
      {
        components: contract.components.map(({ exportName }) => exportName).sort(),
        dataSlots: Object.fromEntries(
          contract.components.map((component) => [
            component.exportName,
            collectDataSlots(component).sort(),
          ]),
        ),
        slots: Object.fromEntries(
          contract.components.map((component) => [
            component.exportName,
            [...new Set(collectSlots(component.render))].sort(),
          ]),
        ),
        variants: Object.keys(contract.variants ?? {}).sort(),
      },
    ]),
  );
}

function collectDataSlots(component: StyledComponentContract): string[] {
  return collectNodes(component.render).flatMap((node) => {
    if (!("attrs" in node)) return [];
    const attribute = node.attrs?.find(({ name }) => name === "data-slot");
    if (attribute?.value?.type === "literal" && typeof attribute.value.value === "string") {
      return [attribute.value.value];
    }
    if (attribute?.value?.type !== "variable") return [];
    const variableName = attribute.value.name;
    const binding = component.destructure?.props.find(
      (prop) => (prop.alias ?? prop.name) === variableName,
    );
    if (!binding?.defaultValue) return [`$${variableName}`];
    return [JSON.parse(binding.defaultValue) as string];
  });
}

function collectSlots(nodes: readonly RenderNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.type === "slot" ? [node.name ?? "default"] : []),
    ...("children" in node ? collectSlots(node.children ?? []) : []),
    ...(node.type === "conditional" ? collectSlots([...node.then, ...node.else]) : []),
    ...(node.type === "slot" ? collectSlots(node.fallback ?? []) : []),
  ]);
}

function collectComposition(contracts: readonly StyledAdapterContract[]) {
  return Object.fromEntries(
    contracts.flatMap((contract) => {
      const components = Object.fromEntries(
        contract.components.flatMap((component) => {
          const targets = collectNodes(component.render).flatMap((node) =>
            node.type === "component" ? [`${node.component}.${node.exportName}`] : [],
          );
          return targets.length ? [[component.exportName, targets]] : [];
        }),
      );
      return Object.keys(components).length ? [[contract.component, components]] : [];
    }),
  );
}

function findSemanticTarget(
  nodes: readonly RenderNode[],
  kind: "component" | "element",
  target: string,
): RenderNode | undefined {
  return collectNodes(nodes).find((node) =>
    kind === "element"
      ? node.type === "element" && node.tag === target
      : node.type === "component" && `${node.component}.${node.exportName}` === target,
  );
}

function collectAttributes(nodes: readonly RenderNode[], name: string) {
  return collectNodes(nodes).flatMap((node) =>
    "attrs" in node ? (node.attrs?.filter((attribute) => attribute.name === name) ?? []) : [],
  );
}

function collectNodes(nodes: readonly RenderNode[]): RenderNode[] {
  return nodes.flatMap((node): RenderNode[] => [
    node,
    ...("children" in node ? collectNodes(node.children ?? []) : []),
    ...(node.type === "conditional" ? collectNodes([...node.then, ...node.else]) : []),
    ...(node.type === "slot" ? collectNodes(node.fallback ?? []) : []),
  ]);
}

function collectForwardRefTargets(contracts: readonly StyledAdapterContract[]) {
  return Object.fromEntries(
    contracts.map((contract) => [
      contract.component,
      Object.fromEntries(
        contract.components.map((component) => [
          component.exportName,
          component.forwardRef?.targetType ?? null,
        ]),
      ),
    ]),
  );
}
