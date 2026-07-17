type FrameworkScoped = {
  frameworks?: FrameworkTarget[];
};

export type StyledAdapterContract = {
  annotations?: StyledAdapterContractAnnotations;
  component: string;
  constants?: Record<string, string>;
  defaultExport: Record<string, string>;
  defaultExportMode?: "component" | "parts";
  dependencies?: StyledComponentDependenciesContract;
  frameworks?: FrameworkTarget[];
  publicExports: string[];
  styles?: StyledComponentStylesContract;
  variantAliases?: Record<string, StyledVariantAliasContract>;
  variantCollectionName?: string;
  variants?: Record<string, ClassVariantDefinition>;
  components: StyledComponentContract[];
};

export type StyledAdapterContractAnnotations = {
  behaviorOwnership?: string[];
  composition?: string[];
  portalGuidance?: string[];
};

export type StyledComponentDependenciesContract = {
  styledComponents?: string[];
};

export type StyledComponentStylesContract = {
  content: string[];
  fileName?: string;
  importFrom: string[];
};

export type StyledVariantAliasContract = {
  defaultVariants?: ClassVariantDefinition["defaultVariants"];
  importName: string;
  localName?: string;
  source: string;
};

export type FrameworkTarget = "astro" | "react";

export type ClassVariantDefinition = {
  base?: string | string[];
  variants?: Record<string, Record<string, string | string[]>>;
  defaultVariants?: Record<string, string | boolean | number>;
  compoundVariants?: Array<Record<string, unknown>>;
};

export type StyledComponentContract = {
  client?: StyledComponentClientContract;
  exportName: string;
  fileName?: string;
  forwardRef?: StyledComponentForwardRefContract;
  primitiveAliases?: Record<string, string>;
  props?: ComponentPropsContract;
  destructure?: DestructureContract;
  variables?: LocalVariableContract[];
  imports?: ImportContract[];
  render: RenderNode[];
};

export type StyledComponentForwardRefContract = {
  targetType: string;
};

export type StyledComponentClientContract = {
  astroScript?: string[];
  reactEffect?: string[];
  reactEffectDependencies?: string;
};

export type ComponentPropsContract = {
  declaration?: "interface" | "type";
  extends?: PropExtendContract[];
  fields?: PropFieldContract[];
};

export type PropExtendContract =
  | (ComponentPropsExtendContract & FrameworkScoped)
  | ({ type: "htmlAttributes"; element: string } & FrameworkScoped)
  | ({ type: "omitHtmlAttributes"; element: string; keys: string[] } & FrameworkScoped)
  | ({ code: string; type: "raw" } & FrameworkScoped)
  | ({ omit?: string[]; type: "variantProps"; variant: string } & FrameworkScoped);

export type ComponentPropsExtendContract = {
  component: string;
  exportName: string;
  keys?: string[];
  localName?: string;
  type: "componentProps";
};

export type PropFieldContract = {
  frameworks?: FrameworkTarget[];
  name: string;
  optional?: boolean;
  type: string;
};

export type DestructureContract = {
  props: DestructurePropContract[];
  rest?: string;
};

export type DestructurePropContract = {
  alias?: string;
  defaultValue?: string;
  frameworks?: FrameworkTarget[];
  name: string;
};

export type LocalVariableContract = {
  frameworks?: FrameworkTarget[];
  name: string;
  value: ValueExpression;
};

export type ImportContract =
  | {
      frameworks?: FrameworkTarget[];
      importName: string;
      source: string;
      type: "default";
    }
  | {
      frameworks?: FrameworkTarget[];
      importName: string;
      localName?: string;
      source: string;
      type: "named";
    };

export type RenderNode =
  | ComponentNode
  | ConditionalNode
  | ElementNode
  | FragmentNode
  | IconNode
  | PrimitiveNode
  | RepeatNode
  | SlotNode
  | TextNode;

// Branch-only render primitive. This is not a prop-merging Slot/asChild abstraction.
export type ConditionalNode = {
  condition: string;
  else: RenderNode[];
  then: RenderNode[];
  type: "conditional";
};

export type ComponentNode = {
  attrs?: AttributeContract[];
  children?: RenderNode[];
  component: string;
  exportName: string;
  localName?: string;
  selfClosing?: boolean;
  type: "component";
};

export type ElementNode = {
  attrs?: AttributeContract[];
  children?: RenderNode[];
  leadingComments?: CommentContract[];
  selfClosing?: boolean;
  tag: string;
  type: "element";
};

export type CommentContract = {
  frameworks?: FrameworkTarget[];
  value: string;
};

export type FragmentNode = {
  children: RenderNode[];
  type: "fragment";
};

export type IconNode = {
  attrs?: AttributeContract[];
  importName: string;
  type: "icon";
};

export type PrimitiveNode = {
  attrs?: AttributeContract[];
  children?: RenderNode[];
  component: string;
  part: string;
  selfClosing?: boolean;
  type: "primitive";
};

export type RepeatNode = {
  children: RenderNode[];
  each: string;
  index?: string;
  item: string;
  type: "repeat";
};

export type SlotNode = {
  fallback?: RenderNode[];
  name?: string;
  type: "slot";
};

export type TextNode = {
  type: "text";
  value: string;
};

export type AttributeContract =
  | {
      frameworks?: FrameworkTarget[];
      name: string;
      value?: ValueExpression;
    }
  | {
      frameworks?: FrameworkTarget[];
      name: "spread";
      value: ValueExpression;
    };

export type ValueExpression =
  | { type: "classJoin"; items: ValueExpression[] }
  | { type: "classVariant"; args?: Record<string, string>; variant: string }
  | { entries: Record<string, ValueExpression>; type: "object" }
  | { type: "literal"; value: boolean | number | string }
  | { code: string; type: "raw" }
  | { parts: Array<string | ValueExpression>; type: "template" }
  | { name: string; type: "variable" };
