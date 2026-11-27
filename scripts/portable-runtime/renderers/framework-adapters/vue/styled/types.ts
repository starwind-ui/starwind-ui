import type {
  StyledOutputDestructureProp,
  StyledOutputPropExtend,
  StyledOutputPropField,
  StyledOutputRenderNode,
  StyledOutputTypeParameter,
} from "../../../styled-output-model/index.js";
import type { VueAttributeAccessProjection } from "../public-contract.js";
import type { VueComputedExpression } from "./expressions.js";

export type RenderVueComponentOptions = {
  directory: string;
  outputRoot: string;
  primitiveImportBase?: string;
  primitiveOutputRoot: string;
};

export type VueImportName = { kind: "type" | "value"; name: string };

export type VueModuleImport =
  | { kind: "default"; localName: string; source: string }
  | { kind: "framework"; names: VueImportName[] }
  | { importName: string; kind: "named"; localName?: string; source: string; typeOnly?: boolean }
  | { kind: "named-group"; names: string[]; source: string; typeOnly?: boolean }
  | { kind: "namespace"; localName: string; source: string }
  | { kind: "side-effect"; source: string };

export type VueImportsProjection = {
  entries: VueModuleImport[];
  primitiveAliases: Record<string, string>;
  primitiveSources: Record<string, string>;
};

export type VueComputedProjection = {
  expression: VueComputedExpression;
  name: string;
  state?: { acceptedFrom: string };
};

export type VuePropsProjection = {
  declared: {
    extendsPublic: boolean;
    fields: Array<{ name: string; optional: boolean; type: string }>;
    name: string;
    /** Replaces the public props type in the declared template props. */
    publicExtension?: string;
    replacedPublicSourceFields: string[];
  };
  destructure: StyledOutputDestructureProp[];
  public: {
    extends: StyledOutputPropExtend[];
    fields: StyledOutputPropField[];
    name: string;
  };
};

export type VueModelProjection = {
  name: string;
  type: string;
  updateEvent: string;
};

export type VueEmitProjection = {
  handlerName: string;
  name: string;
  parameters: ReadonlyArray<{ name: string; type: string }>;
};

export type VueSlotProjection = { name: string; signature: string };

export type VueExposedRefProjection = {
  bridge: "element" | "primitive-element" | "specialized";
  elementTypes: string[];
  primitiveElementType?: string;
};

export type VueRootBinding = {
  attribute: string;
  target: string;
};

export type VueNativeElementSemantics = {
  attributesType?: string;
  elementType?: string;
};

const VUE_NATIVE_ELEMENT_SEMANTICS = {
  a: { attributesType: "AnchorHTMLAttributes", elementType: "HTMLAnchorElement" },
  button: { attributesType: "ButtonHTMLAttributes", elementType: "HTMLButtonElement" },
  caption: { elementType: "HTMLTableCaptionElement" },
  div: { elementType: "HTMLDivElement" },
  form: { attributesType: "FormHTMLAttributes" },
  h1: { elementType: "HTMLHeadingElement" },
  h2: { elementType: "HTMLHeadingElement" },
  h3: { elementType: "HTMLHeadingElement" },
  h4: { elementType: "HTMLHeadingElement" },
  h5: { elementType: "HTMLHeadingElement" },
  h6: { elementType: "HTMLHeadingElement" },
  iframe: { elementType: "HTMLIFrameElement" },
  img: { attributesType: "ImgHTMLAttributes" },
  input: { attributesType: "InputHTMLAttributes", elementType: "HTMLInputElement" },
  kbd: { elementType: "HTMLElement" },
  label: { elementType: "HTMLLabelElement" },
  li: { elementType: "HTMLLIElement" },
  nav: { elementType: "HTMLElement" },
  ol: { elementType: "HTMLOListElement" },
  optgroup: {
    attributesType: "OptgroupHTMLAttributes",
    elementType: "HTMLOptGroupElement",
  },
  option: { attributesType: "OptionHTMLAttributes", elementType: "HTMLOptionElement" },
  p: { elementType: "HTMLParagraphElement" },
  select: { attributesType: "SelectHTMLAttributes", elementType: "HTMLSelectElement" },
  span: { elementType: "HTMLSpanElement" },
  svg: { elementType: "SVGSVGElement" },
  table: { elementType: "HTMLTableElement" },
  tbody: { elementType: "HTMLTableSectionElement" },
  td: { elementType: "HTMLTableCellElement" },
  textarea: {
    attributesType: "TextareaHTMLAttributes",
    elementType: "HTMLTextAreaElement",
  },
  tfoot: { elementType: "HTMLTableSectionElement" },
  th: { elementType: "HTMLTableCellElement" },
  thead: { elementType: "HTMLTableSectionElement" },
  tr: { elementType: "HTMLTableRowElement" },
  ul: { elementType: "HTMLUListElement" },
  video: { elementType: "HTMLVideoElement" },
} as const satisfies Readonly<Record<string, VueNativeElementSemantics>>;

export function getVueNativeElementSemantics(
  element: string,
): VueNativeElementSemantics | undefined {
  return (VUE_NATIVE_ELEMENT_SEMANTICS as Readonly<Record<string, VueNativeElementSemantics>>)[
    element
  ];
}

export type VueStyledSpecialization =
  | { kind: "generic" }
  | {
      kind: "alert-dialog-as-child";
      part: "Action" | "Cancel" | "Trigger";
      slots: Array<{ name: string; signature: string }>;
    }
  | {
      kind: "dialog-as-child";
      family: "Dialog" | "Sheet";
      part: "Close" | "Trigger";
      slots: Array<{ name: string; signature: string }>;
    }
  | {
      contextName: string;
      kind: "select-trigger";
      slots: Array<{ name: string; signature: string }>;
    }
  | {
      kind: "select-value";
      slots: Array<{ name: string; signature: string }>;
    };

export type VueStyledComponentProjection = {
  attributeAccess: VueAttributeAccessProjection | null;
  computed: VueComputedProjection[];
  emits: ReadonlyArray<VueEmitProjection>;
  exposedRefs: VueExposedRefProjection[];
  exportName: string;
  filtersComponentAttrs: boolean;
  manuallyForwardsAttrs: boolean;
  /** Component options from the contract, as name and code, for `defineOptions`. */
  componentOptions: Record<string, string>;
  imports: VueImportsProjection;
  models: ReadonlyArray<VueModelProjection>;
  props: VuePropsProjection;
  render: StyledOutputRenderNode[];
  rootBindings: VueRootBinding[];
  setup: string[];
  slots: VueSlotProjection[];
  specialization: VueStyledSpecialization;
  typeParameters?: readonly StyledOutputTypeParameter[];
  usesAttrs: boolean;
};
