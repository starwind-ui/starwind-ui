import type {
  StyledOutputAttribute,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { projectVueModel } from "../public-contract.js";
import { renderVueExpression } from "./expressions.js";
import { renderVuePropKey } from "./props.js";
import { supportsVueScope } from "./scope.js";
import {
  getVueNativeElementSemantics,
  type VueEmitProjection,
  type VueModelProjection,
} from "./types.js";

type VueStyledPublicContract = {
  additionalBindings?: ReadonlyArray<{
    emits?: ReadonlyArray<VueEmitProjection>;
    models?: ReadonlyArray<VueModelProjection>;
    omittedTargetAttributes?: readonly string[];
    target:
      | { component: string; part: string; type: "primitive" }
      | { component: string; exportName: string; type: "component" };
  }>;
  attributeBindings?: Readonly<Record<string, string>>;
  declaredExtendsPublic?: boolean;
  declaredFieldTypes?: Readonly<Record<string, string>>;
  declaredPropNames?: Readonly<Record<string, string>>;
  emits?: ReadonlyArray<VueEmitProjection>;
  fields?: ReadonlyArray<{ name: string; optional: boolean; type: string }>;
  models?: ReadonlyArray<VueModelProjection>;
  omittedPropFields?: readonly string[];
  omittedRepeatIndexes?: readonly string[];
  omittedSetupBindings?: readonly string[];
  omittedTargetAttributes?: readonly string[];
  objectBoundTargetAttributes?: ReadonlyArray<{
    names: readonly string[];
    target: { component: string; part: string };
  }>;
  primitiveSpreadExpressions?: ReadonlyArray<{
    code: string;
    omittedNames?: readonly string[];
    target: { component: string; part: string };
  }>;
  spreadExpression?: string;
  componentSpreadExpressions?: ReadonlyArray<{
    code: string;
    target: { component: string; exportName: string };
  }>;
  target?: { component: string; part: string };
  retainedAttributes?: ReadonlyArray<{
    name: string;
    sourceNames: readonly string[];
    target:
      | { component: string; part: string; type: "primitive" }
      | { tag: string; type: "element" };
  }>;
};

type VueStyledTargetBinding = {
  emits?: ReadonlyArray<VueEmitProjection>;
  models?: ReadonlyArray<VueModelProjection>;
  omittedTargetAttributes?: readonly string[];
  target:
    | { component: string; part: string; type: "primitive" }
    | { component: string; exportName: string; type: "component" };
};

const EMPTY_CONTRACT: VueStyledPublicContract = {};
const accordionValueModel = projectVueModel("value");
const collapsibleOpenModel = projectVueModel("open");
const comboboxInputValueModel = projectVueModel("inputValue");
const comboboxOpenModel = projectVueModel("open");
const comboboxValueModel = projectVueModel("value");
const dialogOpenModel = projectVueModel("open");
const menuOpenModel = projectVueModel("open");
const menuValueModel = projectVueModel("value");
const navigationMenuValueModel = projectVueModel("value");
const popoverOpenModel = projectVueModel("open");
const timedFloatingOpenModel = projectVueModel("open");
const checkboxGroupValueModel = projectVueModel("value");
const colorPickerValueModel = projectVueModel("value");
const colorPickerFormatModel = projectVueModel("format");
const radioGroupValueModel = projectVueModel("value");
const inputOtpValueModel = projectVueModel("value");
const sliderValueModel = projectVueModel("value");
const sidebarOpenModel = projectVueModel("open");
const sidebarMobileOpenModel = projectVueModel("mobileOpen");
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
  "carousel:CarouselNext": {
    omittedTargetAttributes: ["aria-label"],
    spreadExpression: "({ ...attrs, 'aria-label': 'Next slide' } as Record<string, unknown>)",
    target: { component: "carousel", part: "Next" },
  },
  "carousel:CarouselPrevious": {
    omittedTargetAttributes: ["aria-label"],
    spreadExpression: "({ ...attrs, 'aria-label': 'Previous slide' } as Record<string, unknown>)",
    target: { component: "carousel", part: "Previous" },
  },
  "color-picker:ColorPicker": {
    attributeBindings: { format: "format" },
    additionalBindings: [
      {
        emits: [
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
        ],
        models: [
          {
            name: timedFloatingOpenModel.modelProp,
            type: "boolean",
            updateEvent: timedFloatingOpenModel.updateEvent,
          },
        ],
        omittedTargetAttributes: ["onOpenChange", "onCloseComplete"],
        target: { component: "popover", exportName: "Popover", type: "component" },
      },
    ],
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerColor | null',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerValueChangeDetails',
          },
        ],
      },
      {
        handlerName: "handleValueCommitted",
        name: "valueCommitted",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerColor | null',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerValueCommitDetails',
          },
        ],
      },
      {
        handlerName: "handleFormatChange",
        name: "formatChange",
        parameters: [
          {
            name: "format",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerFormat',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/color-picker").ColorPickerFormatChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: colorPickerValueModel.modelProp,
        type: 'import("@starwind-ui/vue/color-picker").ColorPickerValue',
        updateEvent: colorPickerValueModel.updateEvent,
      },
      {
        name: colorPickerFormatModel.modelProp,
        type: 'import("@starwind-ui/vue/color-picker").ColorPickerFormat',
        updateEvent: colorPickerFormatModel.updateEvent,
      },
    ],
    omittedPropFields: [
      "value",
      "onValueChange",
      "onValueCommitted",
      "onFormatChange",
      "onOpenChange",
      "onCloseComplete",
    ],
    omittedTargetAttributes: ["onValueChange", "onValueCommitted", "onFormatChange"],
    target: { component: "color-picker", part: "Root" },
  },
  "color-picker:ColorPickerChannelInput": {
    declaredExtendsPublic: false,
  },
  "color-picker:ColorPickerContent": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof PopoverContent>['$props'], 'class' | 'style'>",
        target: { component: "popover", exportName: "PopoverContent" },
      },
    ],
  },
  "color-picker:ColorPickerDefaultEditor": {
    omittedRepeatIndexes: ["swatchIndex"],
  },
  "color-picker:ColorPickerInput": {
    omittedRepeatIndexes: ["formatIndex"],
    primitiveSpreadExpressions: [
      {
        code: "({ 'aria-label': 'Color format' } as Record<string, unknown>)",
        omittedNames: ["aria-label"],
        target: { component: "color-picker", part: "FormatSelect" },
      },
    ],
  },
  "color-picker:ColorPickerTrigger": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof PopoverTrigger>['$props'], 'class' | 'style'>",
        target: { component: "popover", exportName: "PopoverTrigger" },
      },
    ],
  },
  "sidebar:SidebarProvider": {
    emits: [
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/sidebar").SidebarOpenChangeDetails',
          },
        ],
      },
      {
        handlerName: "handleMobileOpenChange",
        name: "mobileOpenChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/sidebar").SidebarMobileOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: sidebarOpenModel.modelProp,
        type: "boolean",
        updateEvent: sidebarOpenModel.updateEvent,
      },
      {
        name: sidebarMobileOpenModel.modelProp,
        type: "boolean",
        updateEvent: sidebarMobileOpenModel.updateEvent,
      },
    ],
    omittedPropFields: ["onOpenChange", "onMobileOpenChange"],
    omittedTargetAttributes: ["onOpenChange", "onMobileOpenChange"],
    target: { component: "sidebar", part: "Provider" },
  },
  "sidebar:SidebarGroupAction": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>",
        target: { component: "button", exportName: "Button" },
      },
    ],
  },
  "sidebar:SidebarInput": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Input>['$props'], 'class' | 'style'>",
        target: { component: "input", exportName: "Input" },
      },
    ],
  },
  "sidebar:SidebarMenuAction": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>",
        target: { component: "button", exportName: "Button" },
      },
    ],
  },
  "sidebar:SidebarRail": {
    omittedTargetAttributes: ["aria-label"],
    spreadExpression: "({ ...attrs, 'aria-label': 'Toggle Sidebar' } as Record<string, unknown>)",
    target: { component: "sidebar", part: "Rail" },
  },
  "sidebar:SidebarSeparator": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Separator>['$props'], 'class' | 'style'>",
        target: { component: "separator", exportName: "Separator" },
      },
    ],
  },
  "sidebar:SidebarTrigger": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>",
        target: { component: "button", exportName: "Button" },
      },
    ],
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
    omittedSetupBindings: ["value"],
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
  "combobox:Combobox": {
    emits: [
      {
        handlerName: "handleInputValueChange",
        name: "inputValueChange",
        parameters: [
          { name: "inputValue", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/combobox").ComboboxInputValueChangeDetails',
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
            type: 'import("@starwind-ui/vue/combobox").ComboboxOpenChangeDetails',
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
            type: 'import("@starwind-ui/vue/combobox").ComboboxValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: comboboxInputValueModel.modelProp,
        type: "string",
        updateEvent: comboboxInputValueModel.updateEvent,
      },
      {
        name: comboboxOpenModel.modelProp,
        type: "boolean",
        updateEvent: comboboxOpenModel.updateEvent,
      },
      {
        name: comboboxValueModel.modelProp,
        type: "string | null",
        updateEvent: comboboxValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["onInputValueChange", "onOpenChange", "onValueChange", "value"],
    omittedTargetAttributes: ["onInputValueChange", "onOpenChange", "onValueChange"],
    target: { component: "combobox", part: "Root" },
  },
  "combobox:ComboboxClear": {
    objectBoundTargetAttributes: [
      {
        names: ["aria-label", "disabled"],
        target: { component: "combobox", part: "Clear" },
      },
    ],
  },
  "combobox:ComboboxInput": {
    declaredExtendsPublic: false,
    objectBoundTargetAttributes: [
      { names: ["disabled"], target: { component: "combobox", part: "Input" } },
      { names: ["disabled"], target: { component: "combobox", part: "Trigger" } },
      {
        names: ["aria-label", "disabled"],
        target: { component: "combobox", part: "Clear" },
      },
    ],
  },
  "combobox:ComboboxInputGroup": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof InputGroup>['$props'], 'class' | 'style'>",
        target: { component: "input-group", exportName: "InputGroup" },
      },
    ],
  },
  "context-menu:ContextMenu": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/context-menu").ContextMenuCloseCompleteDetails',
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
            type: 'import("@starwind-ui/vue/context-menu").ContextMenuOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: menuOpenModel.modelProp,
        type: "boolean",
        updateEvent: menuOpenModel.updateEvent,
      },
    ],
    omittedPropFields: ["onCloseComplete", "onOpenChange"],
    omittedTargetAttributes: ["onCloseComplete", "onOpenChange"],
    target: { component: "context-menu", part: "Root" },
  },
  "context-menu:ContextMenuRadioGroup": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/context-menu").MenuValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: menuValueModel.modelProp,
        type: "string",
        updateEvent: menuValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["onValueChange", "value"],
    omittedTargetAttributes: ["onValueChange"],
    target: { component: "context-menu", part: "RadioGroup" },
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
  "dropdown:Dropdown": {
    emits: [
      {
        handlerName: "handleCloseComplete",
        name: "closeComplete",
        parameters: [
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/menu").MenuCloseCompleteDetails',
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
            type: 'import("@starwind-ui/vue/menu").MenuOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: menuOpenModel.modelProp,
        type: "boolean",
        updateEvent: menuOpenModel.updateEvent,
      },
    ],
    omittedPropFields: ["onCloseComplete", "onOpenChange"],
    omittedTargetAttributes: ["onCloseComplete", "onOpenChange"],
    target: { component: "menu", part: "Root" },
  },
  "dropdown:DropdownRadioGroup": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          { name: "value", type: "string" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/menu").MenuValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: menuValueModel.modelProp,
        type: "string",
        updateEvent: menuValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["onValueChange", "value"],
    omittedTargetAttributes: ["onValueChange"],
    target: { component: "menu", part: "RadioGroup" },
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
  "hover-card:HoverCard": {
    emits: [
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/preview-card").PreviewCardOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: timedFloatingOpenModel.modelProp,
        type: "boolean",
        updateEvent: timedFloatingOpenModel.updateEvent,
      },
    ],
    omittedPropFields: ["onOpenChange"],
    omittedTargetAttributes: ["onOpenChange"],
    target: { component: "preview-card", part: "Root" },
  },
  "input-group:InputGroupButton": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>",
        target: { component: "button", exportName: "Button" },
      },
    ],
  },
  "input-group:InputGroupInput": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Input>['$props'], 'class' | 'style'>",
        target: { component: "input", exportName: "Input" },
      },
    ],
  },
  "input-group:InputGroupTextarea": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Textarea>['$props'], 'class' | 'style'>",
        target: { component: "textarea", exportName: "Textarea" },
      },
    ],
  },
  "navigation-menu:NavigationMenu": {
    emits: [
      {
        handlerName: "handleValueChange",
        name: "valueChange",
        parameters: [
          {
            name: "value",
            type: 'import("@starwind-ui/vue/navigation-menu").NavigationMenuValue',
          },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/navigation-menu").NavigationMenuValueChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: navigationMenuValueModel.modelProp,
        type: 'import("@starwind-ui/vue/navigation-menu").NavigationMenuValue',
        updateEvent: navigationMenuValueModel.updateEvent,
      },
    ],
    omittedPropFields: ["onValueChange", "value"],
    omittedTargetAttributes: ["onValueChange"],
    target: { component: "navigation-menu", part: "Root" },
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
  "tooltip:Tooltip": {
    emits: [
      {
        handlerName: "handleOpenChange",
        name: "openChange",
        parameters: [
          { name: "open", type: "boolean" },
          {
            name: "detail",
            type: 'import("@starwind-ui/vue/tooltip").TooltipOpenChangeDetails',
          },
        ],
      },
    ],
    models: [
      {
        name: timedFloatingOpenModel.modelProp,
        type: "boolean",
        updateEvent: timedFloatingOpenModel.updateEvent,
      },
    ],
    omittedPropFields: ["onOpenChange"],
    omittedTargetAttributes: ["onOpenChange"],
    target: { component: "tooltip", part: "Root" },
  },
  "textarea:Textarea": {
    fields: [{ name: "data-slot", optional: true, type: "string" }],
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
  return getVueNativeElementSemantics(element)?.attributesType ?? "HTMLAttributes";
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
    bindNarrowTargetAttributes(node, contract);
    applyComponentSpreadExpression(node, contract);
    applyPrimitiveSpreadExpression(node, contract);
    if (contract.target) {
      applyTargetBinding(node, {
        emits: contract.emits,
        models: contract.models,
        omittedTargetAttributes: contract.omittedTargetAttributes,
        target: { ...contract.target, type: "primitive" },
      });
    }
    for (const binding of contract.additionalBindings ?? []) applyTargetBinding(node, binding);

    if (
      contract.target &&
      matchesTarget(node, { ...contract.target, type: "primitive" }) &&
      contract.spreadExpression
    ) {
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
    if (!contract.target || !matchesTarget(node, { ...contract.target, type: "primitive" })) return;
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
  });
}

function applyPrimitiveSpreadExpression(
  node: StyledOutputRenderNode,
  contract: VueStyledPublicContract,
): void {
  if (node.type !== "primitive") return;
  for (const binding of contract.primitiveSpreadExpressions ?? []) {
    if (node.component !== binding.target.component || node.part !== binding.target.part) continue;
    const firstOmittedIndex = node.attrs.findIndex((attribute) =>
      binding.omittedNames?.includes(attribute.name),
    );
    const insertionIndex = firstOmittedIndex < 0 ? node.attrs.length : firstOmittedIndex;
    node.attrs = node.attrs.filter((attribute) => !binding.omittedNames?.includes(attribute.name));
    node.attrs.splice(insertionIndex, 0, {
      name: "spread",
      targetScopes: ["vue"],
      value: { type: "raw", code: binding.code },
    });
  }
}

function applyTargetBinding(node: StyledOutputRenderNode, binding: VueStyledTargetBinding): void {
  if (!matchesTarget(node, binding.target)) return;
  if (binding.omittedTargetAttributes) {
    node.attrs = node.attrs.filter(
      (attribute) => !binding.omittedTargetAttributes?.includes(attribute.name),
    );
  }
  for (const model of binding.models ?? []) {
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
  for (const event of binding.emits ?? []) {
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
}

function matchesTarget(
  node: StyledOutputRenderNode,
  target: VueStyledTargetBinding["target"],
): node is Extract<StyledOutputRenderNode, { type: "component" | "primitive" }> {
  return target.type === "primitive"
    ? node.type === "primitive" && node.component === target.component && node.part === target.part
    : node.type === "component" &&
        node.component === target.component &&
        node.exportName === target.exportName;
}

export function collectVueStyledPublicModels(
  contract: VueStyledPublicContract,
): VueModelProjection[] {
  return [
    ...(contract.models ?? []),
    ...(contract.additionalBindings ?? []).flatMap((binding) => binding.models ?? []),
  ];
}

export function collectVueStyledPublicEmits(
  contract: VueStyledPublicContract,
): VueEmitProjection[] {
  return [
    ...(contract.emits ?? []),
    ...(contract.additionalBindings ?? []).flatMap((binding) => binding.emits ?? []),
  ];
}

function bindNarrowTargetAttributes(
  node: StyledOutputRenderNode,
  contract: VueStyledPublicContract,
): void {
  if (node.type !== "primitive") return;
  for (const binding of contract.objectBoundTargetAttributes ?? []) {
    if (node.component !== binding.target.component || node.part !== binding.target.part) continue;
    const bound = node.attrs.filter(
      (attribute) => binding.names.includes(attribute.name) && isForVue(attribute),
    );
    if (!bound.length) continue;
    const spread = node.attrs.find(
      (attribute) => attribute.name === "spread" && isForVue(attribute),
    );
    const entries = bound.map((attribute) => {
      const value = attribute.value ?? { type: "literal" as const, value: true };
      return `${renderVuePropKey(attribute.name)}: ${renderVueExpression(value)}`;
    });
    const spreadExpression = spread?.value
      ? spread.value.type === "variable" && spread.value.name === "rest"
        ? "attrs"
        : renderVueExpression(spread.value)
      : undefined;
    const value = {
      type: "raw" as const,
      code: `{ ${spreadExpression ? `...${spreadExpression}, ` : ""}${entries.join(", ")} }`,
    };
    if (spread) spread.value = value;
    const insertionIndex = spread ? -1 : node.attrs.indexOf(bound[0]!);
    node.attrs = node.attrs.filter((attribute) => !bound.includes(attribute));
    if (!spread && insertionIndex >= 0) {
      node.attrs.splice(insertionIndex, 0, { name: "spread", targetScopes: ["vue"], value });
    }
  }
}

function applyComponentSpreadExpression(
  node: StyledOutputRenderNode,
  contract: VueStyledPublicContract,
): void {
  if (node.type !== "component") return;
  for (const binding of contract.componentSpreadExpressions ?? []) {
    if (
      node.component !== binding.target.component ||
      node.exportName !== binding.target.exportName
    ) {
      continue;
    }
    const spread = node.attrs.find(
      (attribute) => attribute.name === "spread" && isForVue(attribute),
    );
    if (!spread) {
      throw new TypeError(
        `Vue Styled ${binding.target.component}.${binding.target.exportName} public contract requires an attrs spread.`,
      );
    }
    spread.value = { type: "raw", code: binding.code };
  }
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
