import type { ClassVariantDefinition } from "../../contracts/styled/types.js";

export type StyledOutputModel = {
  componentGroups: StyledOutputComponentGroup[];
};

export type StyledOutputTargetScope = string;

export type StyledOutputComponentGroup = {
  component: string;
  components: StyledOutputComponent[];
  constants: StyledOutputConstant[];
  defaultExport: StyledOutputDefaultExport;
  dependencies?: StyledOutputComponentDependencies;
  publicExports: string[];
  styles?: StyledOutputStyleSideEffect;
  targetScopes?: StyledOutputTargetScope[];
  variantAliases?: StyledOutputVariantAlias[];
  variantCollectionName?: string;
  variants: StyledOutputVariant[];
};

export type StyledOutputComponentDependencies = {
  styledComponents: string[];
};

export type StyledOutputComponent = {
  client?: StyledOutputClientBehavior;
  destructure?: StyledOutputDestructure;
  exportName: string;
  forwardRef?: StyledOutputForwardRef;
  imports: StyledOutputImport[];
  primitiveAliases: StyledOutputPrimitiveAlias[];
  props?: StyledOutputProps;
  render: StyledOutputRenderNode[];
  sourceFileName?: string;
  targetScopes?: StyledOutputTargetScope[];
  variables: StyledOutputVariable[];
};

export type StyledOutputForwardRef = {
  targetType: string;
};

export type StyledOutputDefaultExport = {
  mode: "component" | "parts";
  members: StyledOutputExportMember[];
};

export type StyledOutputExportMember = {
  exportName: string;
  localName: string;
};

export type StyledOutputConstant = {
  name: string;
  value: string;
};

export type StyledOutputVariant = {
  definition: ClassVariantDefinition;
  name: string;
};

export type StyledOutputVariantAlias = {
  defaultVariants?: ClassVariantDefinition["defaultVariants"];
  importName: string;
  localName?: string;
  name: string;
  source: string;
};

export type StyledOutputStyleSideEffect = {
  content: string[];
  importFrom: string[];
  sourceFileName?: string;
};

export type StyledOutputProps = {
  declaration?: "interface" | "type";
  extends: StyledOutputPropExtend[];
  fields: StyledOutputPropField[];
};

export type StyledOutputPropExtend =
  | {
      element: string;
      kind: "element-attributes";
      targetScopes?: StyledOutputTargetScope[];
    }
  | {
      element: string;
      kind: "omit-element-attributes";
      keys: string[];
      targetScopes?: StyledOutputTargetScope[];
    }
  | {
      code: string;
      kind: "raw";
      targetScopes?: StyledOutputTargetScope[];
    }
  | {
      component: string;
      exportName: string;
      kind: "component-props";
      keys: string[];
      localName?: string;
      targetScopes?: StyledOutputTargetScope[];
    }
  | {
      kind: "variant-props";
      omit?: string[];
      targetScopes?: StyledOutputTargetScope[];
      variant: string;
    };

export type StyledOutputPropField = {
  name: string;
  optional: boolean;
  targetScopes?: StyledOutputTargetScope[];
  type: string;
};

export type StyledOutputDestructure = {
  props: StyledOutputDestructureProp[];
  rest?: string;
};

export type StyledOutputDestructureProp = {
  alias?: string;
  defaultValue?: string;
  name: string;
  targetScopes?: StyledOutputTargetScope[];
};

export type StyledOutputVariable = {
  name: string;
  targetScopes?: StyledOutputTargetScope[];
  value: StyledOutputValueExpression;
};

export type StyledOutputImport =
  | {
      importName: string;
      kind: "default";
      source: string;
      targetScopes?: StyledOutputTargetScope[];
    }
  | {
      importName: string;
      kind: "named";
      localName?: string;
      source: string;
      targetScopes?: StyledOutputTargetScope[];
    };

export type StyledOutputPrimitiveAlias = {
  alias: string;
  component: string;
};

export type StyledOutputClientBehavior = {
  effectDependencies?: string;
  effects: string[];
  setup: string[];
};

export type StyledOutputRenderNode =
  | StyledOutputComponentNode
  | StyledOutputConditionNode
  | StyledOutputElementNode
  | StyledOutputFragmentNode
  | StyledOutputIconNode
  | StyledOutputPrimitiveNode
  | StyledOutputRepeatNode
  | StyledOutputSlotNode
  | StyledOutputTextNode;

export type StyledOutputConditionNode = {
  condition: string;
  else: StyledOutputRenderNode[];
  then: StyledOutputRenderNode[];
  type: "condition";
};

export type StyledOutputComponentNode = {
  attrs: StyledOutputAttribute[];
  children: StyledOutputRenderNode[];
  component: string;
  exportName: string;
  localName?: string;
  selfClosing: boolean;
  type: "component";
};

export type StyledOutputElementNode = {
  attrs: StyledOutputAttribute[];
  children: StyledOutputRenderNode[];
  comments: StyledOutputComment[];
  selfClosing: boolean;
  tag: string;
  type: "element";
};

export type StyledOutputFragmentNode = {
  children: StyledOutputRenderNode[];
  type: "fragment";
};

export type StyledOutputIconNode = {
  attrs: StyledOutputAttribute[];
  importName: string;
  type: "icon";
};

export type StyledOutputPrimitiveNode = {
  attrs: StyledOutputAttribute[];
  children: StyledOutputRenderNode[];
  component: string;
  part: string;
  selfClosing: boolean;
  type: "primitive";
};

export type StyledOutputRepeatNode = {
  children: StyledOutputRenderNode[];
  each: string;
  index?: string;
  item: string;
  type: "repeat";
};

export type StyledOutputSlotNode = {
  fallback: StyledOutputRenderNode[];
  name?: string;
  type: "slot";
};

export type StyledOutputTextNode = {
  type: "text";
  value: string;
};

export type StyledOutputComment = {
  targetScopes?: StyledOutputTargetScope[];
  value: string;
};

export type StyledOutputAttribute =
  | {
      name: string;
      targetScopes?: StyledOutputTargetScope[];
      value?: StyledOutputValueExpression;
    }
  | {
      name: "spread";
      targetScopes?: StyledOutputTargetScope[];
      value: StyledOutputValueExpression;
    };

export type StyledOutputValueExpression =
  | { items: StyledOutputValueExpression[]; type: "class-join" }
  | { args?: Record<string, string>; type: "class-variant"; variant: string }
  | { entries: Record<string, StyledOutputValueExpression>; type: "object" }
  | { type: "literal"; value: boolean | number | string }
  | { code: string; type: "raw" }
  | { parts: Array<string | StyledOutputValueExpression>; type: "template" }
  | { name: string; type: "variable" };
