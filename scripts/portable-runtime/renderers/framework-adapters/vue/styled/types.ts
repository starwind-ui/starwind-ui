import type {
  StyledOutputDestructureProp,
  StyledOutputPropExtend,
  StyledOutputPropField,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

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
  | { importName: string; kind: "named"; localName?: string; source: string }
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
};

export type VuePropsProjection = {
  declared: {
    fields: Array<{ name: string; optional: boolean; type: string }>;
    name: string;
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

export type VueStyledSpecialization =
  | { kind: "generic" }
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
  computed: VueComputedProjection[];
  emits: ReadonlyArray<VueEmitProjection>;
  exposedRefs: VueExposedRefProjection[];
  exportName: string;
  manuallyForwardsAttrs: boolean;
  imports: VueImportsProjection;
  models: ReadonlyArray<VueModelProjection>;
  props: VuePropsProjection;
  render: StyledOutputRenderNode[];
  rootBindings: VueRootBinding[];
  setup: string[];
  slots: VueSlotProjection[];
  specialization: VueStyledSpecialization;
  usesAttrs: boolean;
};
