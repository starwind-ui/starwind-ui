import type {
  StyledOutputAttribute,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import type { VueEmitProjection, VueModelProjection } from "./types.js";
import { supportsVueScope } from "./scope.js";

type VueStyledPublicContract = {
  emits?: ReadonlyArray<VueEmitProjection>;
  models?: ReadonlyArray<VueModelProjection>;
  omittedPropFields?: readonly string[];
  spreadExpression?: string;
  target?: { component: string; part: string };
};

const EMPTY_CONTRACT: VueStyledPublicContract = {};

const PUBLIC_CONTRACTS: Readonly<Record<string, VueStyledPublicContract>> = {
  "avatar:AvatarImage": {
    emits: [
      {
        handlerName: "handleLoadingStatusChange",
        name: "loadingStatusChange",
        parameters: [
          {
            name: "status",
            type: 'import("@starwind-ui/vue/avatar").AvatarImageLoadingStatus',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/avatar").AvatarLoadingStatusChangeDetails',
          },
        ],
      },
    ],
    omittedPropFields: ["onLoadingStatusChange"],
    target: { component: "avatar", part: "Image" },
  },
  "checkbox:Checkbox": {
    emits: [
      {
        handlerName: "handleCheckedChange",
        name: "checkedChange",
        parameters: [
          { name: "value", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/checkbox").CheckboxCheckedChangeDetails',
          },
        ],
      },
    ],
    models: [{ name: "checked", type: "boolean", updateEvent: "update:checked" }],
    spreadExpression: "{ ...attrs, 'aria-label': ariaLabel }",
    target: { component: "checkbox", part: "Root" },
  },
  "select:Select": {
    emits: [
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/select").SelectOpenChangeDetails',
          },
        ],
      },
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string | null" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/select").SelectValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      { name: "modelValue", type: "string | null", updateEvent: "update:modelValue" },
      { name: "open", type: "boolean", updateEvent: "update:open" },
    ],
    target: { component: "select", part: "Root" },
  },
};

export function getVueStyledPublicContract(
  groupName: string,
  exportName: string,
): VueStyledPublicContract {
  return PUBLIC_CONTRACTS[`${groupName}:${exportName}`] ?? EMPTY_CONTRACT;
}

/**
 * Vue exports dedicated native attribute interfaces only for element families with additional
 * attributes. Generic elements deliberately use HTMLAttributes as the narrowest public fallback.
 */
export function getVueNativeAttributesType(element: string): string {
  switch (element) {
    case "a":
      return "AnchorHTMLAttributes";
    case "button":
      return "ButtonHTMLAttributes";
    case "img":
      return "ImgHTMLAttributes";
    default:
      return "HTMLAttributes";
  }
}

export function collectVueNativeAttributesTypes(
  propExtends: readonly StyledOutputPropExtend[],
): string[] {
  return [
    ...new Set(
      propExtends.flatMap((propExtend) =>
        propExtend.kind === "element-attributes" || propExtend.kind === "omit-element-attributes"
          ? [getVueNativeAttributesType(propExtend.element)]
          : [],
      ),
    ),
  ].sort();
}

export function applyVueStyledPublicContractBindings(
  nodes: StyledOutputRenderNode[],
  contract: VueStyledPublicContract,
): void {
  if (!contract.target) return;
  visitNodes(nodes, (node) => {
    if (
      node.type !== "primitive" ||
      node.component !== contract.target?.component ||
      node.part !== contract.target.part
    ) {
      return;
    }

    if (contract.spreadExpression) {
      const spread = node.attrs.find(
        (attribute) => attribute.name === "spread" && isForVue(attribute),
      );
      if (!spread) {
        throw new TypeError(
          `Vue Styled ${contract.target.component}.${contract.target.part} public contract requires an attrs spread.`,
        );
      }
      spread.value = { type: "raw", code: contract.spreadExpression };
    }

    for (const model of contract.models ?? []) {
      if (!node.attrs.some((attribute) => attribute.name === model.name && isForVue(attribute))) {
        node.attrs.push({ name: model.name, value: { type: "variable", name: model.name } });
      }
      node.attrs.push({
        name: `@${toKebabCase(model.updateEvent)}`,
        value: { type: "raw", code: `emit(${JSON.stringify(model.updateEvent)}, $event)` },
      });
    }
    for (const event of contract.emits ?? []) {
      const eventAttributeName = `@${toKebabCase(event.name)}`;
      const existing = node.attrs.find(
        (attribute) => attribute.name === eventAttributeName && isForVue(attribute),
      );
      const handler: StyledOutputAttribute = {
        name: eventAttributeName,
        value: { type: "variable", name: event.handlerName },
      };
      if (existing) Object.assign(existing, handler);
      else node.attrs.push(handler);
    }
  });
}

function visitNodes(
  nodes: StyledOutputRenderNode[],
  visitor: (node: StyledOutputRenderNode) => void,
): void {
  for (const node of nodes) {
    visitor(node);
    if ("children" in node) visitNodes(node.children, visitor);
    if (node.type === "condition") {
      visitNodes(node.then, visitor);
      visitNodes(node.else, visitor);
    }
    if (node.type === "slot") visitNodes(node.fallback, visitor);
  }
}

function toKebabCase(value: string): string {
  let output = "";
  for (const character of value) {
    const code = character.charCodeAt(0);
    output += code >= 65 && code <= 90 ? `-${character.toLowerCase()}` : character;
  }
  return output;
}

function isForVue(value: { targetScopes?: readonly string[] }): boolean {
  return supportsVueScope(value.targetScopes);
}
