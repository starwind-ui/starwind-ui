import type { RenderNode, StyledAdapterContract, StyledComponentContract } from "../types.js";
import { dropdownStyledContract } from "./dropdown.js";

export const contextMenuStyledContract = createContextMenuStyledContract();

function createContextMenuStyledContract(): StyledAdapterContract {
  const contract = deepReplace(dropdownStyledContract) as StyledAdapterContract;
  contract.component = "context-menu";

  contract.components.forEach((component) => {
    component.primitiveAliases = { "context-menu": "ContextMenuPrimitive" };
    retargetPrimitiveNodes(component.render);
  });

  normalizeRootSlot(contract);
  setRootPropDefault(contract, "modal", "true");
  removeRootProp(contract, "openOnHover");
  normalizeTriggerVariant(contract);
  replaceTrigger(contract);

  return contract;
}

function deepReplace(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => deepReplace(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        replaceString(key),
        deepReplace(entry),
      ]),
    );
  }

  if (typeof value === "string") return replaceString(value);

  return value;
}

function replaceString(value: string): string {
  return value
    .replaceAll("Dropdown", "ContextMenu")
    .replaceAll("dropdown-", "context-menu-")
    .replaceAll("dropdown", "contextMenu")
    .replaceAll("MenuCloseCompleteDetails", "ContextMenuCloseCompleteDetails")
    .replaceAll("MenuOpenChangeDetails", "ContextMenuOpenChangeDetails");
}

function normalizeRootSlot(contract: StyledAdapterContract): void {
  const root = getComponent(contract, "ContextMenu");
  const rootNode = root.render[0];
  if (rootNode?.type !== "primitive") {
    throw new Error("ContextMenu root contract must render a primitive root.");
  }

  const slotAttribute = rootNode.attrs?.find((attr) => attr.name === "data-slot");
  if (slotAttribute?.value && slotAttribute.value.type === "literal") {
    slotAttribute.value.value = "context-menu";
  }
}

function retargetPrimitiveNodes(nodes: RenderNode[]): void {
  for (const node of nodes) {
    if (node.type === "primitive" && node.component === "menu") {
      node.component = "context-menu";
    }

    if ("children" in node) {
      retargetPrimitiveNodes(node.children ?? []);
    }

    if (node.type === "conditional") {
      retargetPrimitiveNodes(node.then);
      retargetPrimitiveNodes(node.else);
    }

    if (node.type === "slot") {
      retargetPrimitiveNodes(node.fallback ?? []);
    }
  }
}

function removeRootProp(contract: StyledAdapterContract, propName: string): void {
  const root = getComponent(contract, "ContextMenu");

  root.props = {
    ...root.props,
    fields: root.props?.fields?.filter((field) => field.name !== propName),
  };
  root.destructure = {
    ...root.destructure!,
    props: root.destructure!.props.filter((prop) => prop.name !== propName),
  };

  const rootNode = root.render[0];
  if (rootNode?.type !== "primitive") {
    throw new Error("ContextMenu root contract must render a primitive root.");
  }

  rootNode.attrs = rootNode.attrs?.filter((attr) => attr.name !== propName);
}

function setRootPropDefault(
  contract: StyledAdapterContract,
  propName: string,
  defaultValue: string,
): void {
  const root = getComponent(contract, "ContextMenu");
  const destructuredProp = root.destructure?.props.find((prop) => prop.name === propName);
  if (!destructuredProp) {
    throw new Error(`ContextMenu root contract must destructure ${propName}.`);
  }

  destructuredProp.defaultValue = defaultValue;
}

function normalizeTriggerVariant(contract: StyledAdapterContract): void {
  const triggerVariant = contract.variants?.contextMenuTrigger;
  if (!Array.isArray(triggerVariant?.base)) return;

  triggerVariant.base = triggerVariant.base.map((classGroup) =>
    classGroup === "disabled:pointer-events-none"
      ? "data-disabled:pointer-events-none"
      : classGroup,
  );
}

function replaceTrigger(contract: StyledAdapterContract): void {
  const trigger = getComponent(contract, "ContextMenuTrigger");

  const replacement = {
    exportName: "ContextMenuTrigger",
    primitiveAliases: { "context-menu": "ContextMenuPrimitive" },
    props: {
      extends: [{ type: "htmlAttributes", element: "div" }],
      fields: [
        { name: "disabled", optional: true, type: "boolean" },
        {
          name: "ref",
          optional: true,
          type: "React.Ref<HTMLDivElement>",
          frameworks: ["react"],
        },
      ],
    },
    destructure: {
      props: [
        { name: "disabled", defaultValue: "false" },
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    variables: [],
    render: [
      {
        type: "primitive",
        component: "context-menu",
        part: "Trigger",
        attrs: [
          {
            name: "class",
            value: {
              type: "classVariant",
              variant: "contextMenuTrigger",
              args: { class: "className" },
            },
          },
          { name: "disabled", value: { type: "variable", name: "disabled" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "data-slot", value: { type: "literal", value: "context-menu-trigger" } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  } satisfies StyledComponentContract;

  Object.assign(trigger, replacement);
}

function getComponent(
  contract: StyledAdapterContract,
  exportName: string,
): StyledComponentContract {
  const component = contract.components.find((item) => item.exportName === exportName);
  if (!component) {
    throw new Error(`Missing ${exportName} styled contract.`);
  }

  return component;
}
