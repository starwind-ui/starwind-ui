import type {
  StyledOutputAttribute,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

import type { VueEmitProjection, VueModelProjection } from "./types.js";
import { projectVueModel } from "../public-contract.js";
import { supportsVueScope } from "./scope.js";

type VueStyledPublicContract = {
  attributeBindings?: Readonly<Record<string, string>>;
  declaredExtendsPublic?: boolean;
  declaredFieldTypes?: Readonly<Record<string, string>>;
  declaredPropNames?: Readonly<Record<string, string>>;
  emits?: ReadonlyArray<VueEmitProjection>;
  fields?: ReadonlyArray<{ name: string; optional: boolean; type: string }>;
  models?: ReadonlyArray<VueModelProjection>;
  omittedPropFields?: readonly string[];
  omittedTargetAttributes?: readonly string[];
  spreadExpression?: string;
  target?: { component: string; part: string };
  retainedAttributes?: ReadonlyArray<{
    name: string;
    sourceNames: readonly string[];
    target:
      | { component: string; part: string; type: "primitive" }
      | { tag: string; type: "element" };
  }>;
};

const EMPTY_CONTRACT: VueStyledPublicContract = {};
const accordionValueModel = projectVueModel("value");
const collapsibleOpenModel = projectVueModel("open");
const dialogOpenModel = projectVueModel("open");
const popoverOpenModel = projectVueModel("open");
const checkboxGroupValueModel = projectVueModel("value");
const radioGroupValueModel = projectVueModel("value");
const inputOtpValueModel = projectVueModel("value");
const sliderValueModel = projectVueModel("value");
const tabsValueModel = projectVueModel("value");
const toggleGroupValueModel = projectVueModel("value");

const PUBLIC_CONTRACTS: Readonly<Record<string, VueStyledPublicContract>> = {
  "accordion:Accordion": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/accordion").AccordionValue',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/accordion").AccordionValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: accordionValueModel.modelProp,
        type: 'import("@starwind-ui/vue/accordion").AccordionValue',
        updateEvent: accordionValueModel.updateEvent,
      },
    ],
    target: { component: "accordion", part: "Root" },
  },
  "alert-dialog:AlertDialog": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/alert-dialog").AlertDialogCloseCompleteDetails',
          },
        ],
      },
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/alert-dialog").AlertDialogOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: dialogOpenModel.modelProp,
        type: "boolean",
        updateEvent: dialogOpenModel.updateEvent,
      },
    ],
    target: { component: "alert-dialog", part: "Root" },
  },
  "sheet:Sheet": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/drawer").DrawerCloseCompleteDetails',
          },
        ],
      },
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/drawer").DrawerOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: dialogOpenModel.modelProp,
        type: "boolean",
        updateEvent: dialogOpenModel.updateEvent,
      },
    ],
    target: { component: "drawer", part: "Root" },
  },
  "tabs:Tabs": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/tabs").TabsValue',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/tabs").TabsValueChangeDetails',
          },
        ],
      },
    ],
    fields: [
      {
        name: "defaultValue",
        optional: true,
        type: 'import("@starwind-ui/vue/tabs").TabsValue',
      },
    ],
    models: [
      {
        name: tabsValueModel.modelProp,
        type: 'import("@starwind-ui/vue/tabs").TabsValue',
        updateEvent: tabsValueModel.updateEvent,
      },
    ],
    target: { component: "tabs", part: "Root" },
  },
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
  "button:Button": {
    declaredPropNames: { "data-slot": "dataSlot" },
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
  "checkbox-group:CheckboxGroup": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/checkbox-group").CheckboxGroupValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: checkboxGroupValueModel.modelProp,
        type: 'import("@starwind-ui/vue/checkbox-group").CheckboxGroupValue',
        updateEvent: checkboxGroupValueModel.updateEvent,
      },
    ],
    target: { component: "checkbox-group", part: "Root" },
  },
  "collapsible:Collapsible": {
    emits: [
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/collapsible").CollapsibleOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: collapsibleOpenModel.modelProp,
        type: "boolean",
        updateEvent: collapsibleOpenModel.updateEvent,
      },
    ],
    target: { component: "collapsible", part: "Root" },
  },
  "dialog:Dialog": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/dialog").DialogCloseCompleteDetails',
          },
        ],
      },
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/dialog").DialogOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: dialogOpenModel.modelProp,
        type: "boolean",
        updateEvent: dialogOpenModel.updateEvent,
      },
    ],
    target: { component: "dialog", part: "Root" },
  },
  "dropzone:Dropzone": {
    declaredExtendsPublic: false,
    declaredFieldTypes: {
      "aria-invalid": 'DropzoneProps["aria-invalid"]',
      id: 'DropzoneProps["id"]',
    },
    declaredPropNames: { "aria-invalid": "ariaInvalid" },
    emits: [
      {
        handlerName: "handleFilesChange",
        name: "filesChange",
        parameters: [
          { name: "files", type: "File[]" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/dropzone").DropzoneFilesChangeDetails',
          },
        ],
      },
    ],
    target: { component: "dropzone", part: "Root" },
  },
  "field:FieldControl": {
    declaredExtendsPublic: false,
    declaredFieldTypes: { size: '"sm" | "md" | "lg"' },
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/field").InputValueChangeDetails',
          },
        ],
      },
    ],
    fields: [
      {
        name: "defaultValue",
        optional: true,
        type: 'import("@starwind-ui/vue/field").InputValue',
      },
    ],
    models: [
      {
        name: "modelValue",
        type: 'import("@starwind-ui/vue/field").InputValue | undefined',
        updateEvent: "update:modelValue",
      },
    ],
    omittedPropFields: ["value"],
    target: { component: "field", part: "Control" },
  },
  "input:Input": {
    attributeBindings: { "data-slot": 'dataSlot ?? "input"' },
    declaredExtendsPublic: false,
    declaredFieldTypes: { size: '"sm" | "md" | "lg"' },
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/input").InputValueChangeDetails',
          },
        ],
      },
    ],
    fields: [
      {
        name: "defaultValue",
        optional: true,
        type: 'import("@starwind-ui/vue/input").InputValue',
      },
      {
        name: "data-slot",
        optional: true,
        type: "string",
      },
    ],
    models: [
      {
        name: "modelValue",
        type: 'import("@starwind-ui/vue/input").InputValue | undefined',
        updateEvent: "update:modelValue",
      },
    ],
    omittedPropFields: ["value"],
    target: { component: "input", part: "Root" },
  },
  "input-otp:InputOtp": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/input-otp").InputOtpValueChangeDetails',
          },
        ],
      },
    ],
    fields: [{ name: "defaultValue", optional: true, type: "string" }],
    models: [
      {
        name: inputOtpValueModel.modelProp,
        type: "string | undefined",
        updateEvent: inputOtpValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["value"],
    target: { component: "input-otp", part: "Root" },
  },
  "popover:Popover": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/popover").PopoverCloseCompleteDetails',
          },
        ],
      },
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/popover").PopoverOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: popoverOpenModel.modelProp,
        type: "boolean",
        updateEvent: popoverOpenModel.updateEvent,
      },
    ],
    target: { component: "popover", part: "Root" },
  },
  "radio-group:RadioGroup": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/radio-group").RadioGroupValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: radioGroupValueModel.modelProp,
        type: 'import("@starwind-ui/vue/radio-group").RadioGroupValue',
        updateEvent: radioGroupValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["value"],
    omittedTargetAttributes: ["aria-label"],
    spreadExpression: "{ ...(legend === undefined ? {} : { 'aria-label': legend }), ...attrs }",
    target: { component: "radio-group", part: "Root" },
  },
  "radio-group:RadioGroupItem": {
    emits: [
      {
        handlerName: "handleCheckedChange",
        name: "checkedChange",
        parameters: [
          { name: "value", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/radio").RadioCheckedChangeDetails',
          },
        ],
      },
    ],
    omittedPropFields: ["checked", "defaultChecked"],
    omittedTargetAttributes: ["checked", "defaultChecked"],
    target: { component: "radio", part: "Root" },
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
  "slider:Slider": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: 'import("@starwind-ui/vue/slider").SliderValue' },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/slider").SliderValueChangeDetails',
          },
        ],
      },
      {
        handlerName: "handleValueCommitted",
        name: "valueCommitted",
        parameters: [
          { name: "value", type: 'import("@starwind-ui/vue/slider").SliderValue' },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/slider").SliderValueCommitDetails',
          },
        ],
      },
    ],
    fields: [
      {
        name: "defaultValue",
        optional: true,
        type: 'import("@starwind-ui/vue/slider").SliderValue',
      },
    ],
    models: [
      {
        name: sliderValueModel.modelProp,
        type: 'import("@starwind-ui/vue/slider").SliderValue | undefined',
        updateEvent: sliderValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["value"],
    target: { component: "slider", part: "Root" },
  },
  "switch:Switch": {
    emits: [
      {
        handlerName: "handleCheckedChange",
        name: "checkedChange",
        parameters: [
          { name: "value", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/switch").SwitchCheckedChangeDetails',
          },
        ],
      },
    ],
    models: [{ name: "checked", type: "boolean", updateEvent: "update:checked" }],
    retainedAttributes: [
      {
        name: "style",
        sourceNames: ["style"],
        target: { component: "switch", part: "Root", type: "primitive" },
      },
      {
        name: "style",
        sourceNames: ["style"],
        target: { component: "switch", part: "Thumb", type: "primitive" },
      },
      {
        name: "for",
        sourceNames: ["for", "htmlFor"],
        target: { tag: "label", type: "element" },
      },
    ],
    spreadExpression: "{ ...attrs, 'aria-label': ariaLabel }",
    target: { component: "switch", part: "Root" },
  },
  "toggle:Toggle": {
    attributeBindings: { "data-slot": 'dataSlot ?? "toggle"' },
    declaredPropNames: { "data-slot": "dataSlot" },
    emits: [
      {
        handlerName: "handlePressedChange",
        name: "pressedChange",
        parameters: [
          { name: "value", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/toggle").TogglePressedChangeDetails',
          },
        ],
      },
    ],
    models: [{ name: "pressed", type: "boolean", updateEvent: "update:pressed" }],
    target: { component: "toggle", part: "Root" },
  },
  "toggle-group:ToggleGroup": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/toggle-group").ToggleGroupValue',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/toggle-group").ToggleGroupValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: toggleGroupValueModel.modelProp,
        type: 'import("@starwind-ui/vue/toggle-group").ToggleGroupValue',
        updateEvent: toggleGroupValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["value"],
    target: { component: "toggle-group", part: "Root" },
  },
  "toggle-group:ToggleGroupItem": {
    emits: [
      {
        handlerName: "handlePressedChange",
        name: "pressedChange",
        parameters: [
          { name: "value", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/toggle").TogglePressedChangeDetails',
          },
        ],
      },
    ],
    omittedPropFields: ["defaultPressed", "pressed"],
    omittedTargetAttributes: ["defaultPressed", "pressed"],
    target: { component: "toggle", part: "Root" },
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
    case "form":
      return "FormHTMLAttributes";
    case "img":
      return "ImgHTMLAttributes";
    case "input":
      return "InputHTMLAttributes";
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
  visitNodes(nodes, (node) => {
    retainCanonicalAttributes(node, contract);
    if (!contract.target) return;
    if (
      node.type !== "primitive" ||
      node.component !== contract.target?.component ||
      node.part !== contract.target.part
    ) {
      return;
    }
    if (contract.omittedTargetAttributes) {
      node.attrs = node.attrs.filter(
        (attribute) => !contract.omittedTargetAttributes?.includes(attribute.name),
      );
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
    for (const [name, code] of Object.entries(contract.attributeBindings ?? {})) {
      const attribute = node.attrs.find(
        (candidate) => candidate.name === name && isForVue(candidate),
      );
      if (!attribute) {
        throw new TypeError(
          `Vue Styled ${contract.target.component}.${contract.target.part} public contract requires ${name}.`,
        );
      }
      attribute.value = { type: "raw", code };
    }

    for (const model of contract.models ?? []) {
      const legacyValueBinding =
        model.name === "modelValue"
          ? node.attrs.find((attribute) => attribute.name === "value" && isForVue(attribute))
          : undefined;
      if (legacyValueBinding) {
        legacyValueBinding.name = model.name;
        legacyValueBinding.value = { type: "variable", name: model.name };
      } else if (
        !node.attrs.some((attribute) => attribute.name === model.name && isForVue(attribute))
      ) {
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

function retainCanonicalAttributes(
  node: StyledOutputRenderNode,
  contract: VueStyledPublicContract,
): void {
  if (!("attrs" in node)) return;
  for (const retained of contract.retainedAttributes ?? []) {
    const matches =
      (retained.target.type === "primitive" &&
        node.type === "primitive" &&
        node.component === retained.target.component &&
        node.part === retained.target.part) ||
      (retained.target.type === "element" &&
        node.type === "element" &&
        node.tag === retained.target.tag);
    if (
      !matches ||
      node.attrs.some((attribute) => attribute.name === retained.name && isForVue(attribute))
    ) {
      continue;
    }

    const source = node.attrs.find(
      (attribute) =>
        retained.sourceNames.includes(attribute.name) && attribute.value?.type === "variable",
    );
    if (!source) {
      throw new TypeError(
        `Vue Styled projection requires a variable-backed ${retained.name} attribute on its retained target.`,
      );
    }
    node.attrs.push({
      name: retained.name,
      targetScopes: ["vue"],
      value: structuredClone(source.value),
    });
  }
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
