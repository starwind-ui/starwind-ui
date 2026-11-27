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
  primitiveFacadeExports?: StyledPrimitiveFacadeExportsContract;
  publicExports: string[];
  styles?: StyledComponentStylesContract;
  variantAliases?: Record<string, StyledVariantAliasContract>;
  variantCollectionName?: string;
  variants?: Record<string, ClassVariantDefinition>;
  components: StyledComponentContract[];
};

export type StyledPrimitiveFacadeExportsContract = {
  component: string;
  /** Extra values that one framework's Styled index re-exports, such as page-script helpers. */
  frameworkValues?: Partial<Record<FrameworkTarget, string[]>>;
  types: string[];
  values: string[];
};

export type StyledAdapterContractAnnotations = {
  behaviorOwnership?: string[];
  composition?: string[];
  portalGuidance?: string[];
};

export type StyledComponentDependenciesContract = {
  /**
   * Package floors that installs of this Styled component need. The CLI registry uses the
   * declared range in place of the range the demo app pins for the same package.
   */
  packages?: StyledPackageRequirementContract[];
  styledComponents?: string[];
};

export type StyledPackageRequirementContract = {
  name: string;
  range: string;
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

export type FrameworkTarget = "astro" | "react" | "vue" | "svelte";

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
  /** The native control whose value is this component's public framework model. */
  nativeModel?: StyledNativeModelContract;
  primitiveAliases?: Record<string, string>;
  props?: ComponentPropsContract;
  /**
   * Static properties on the component function, as property name and code. Only the React writer
   * prints them. A chart spec part carries its part kind, so the chart Root finds it in its children.
   */
  componentStatics?: Record<string, string>;
  /**
   * Component options, as option name and code. Only the Vue writer prints them, in
   * `defineOptions`. A chart spec part carries its part kind, so the chart Root finds it in its
   * slot.
   */
  componentOptions?: Record<string, string>;
  destructure?: DestructureContract;
  variables?: LocalVariableContract[];
  imports?: ImportContract[];
  render: RenderNode[];
  /**
   * Named slots that the component reads without rendering a slot node, such as a Vue
   * `$slots.name` check in an attribute value. Writers declare them with the rendered slots.
   */
  slots?: StyledSlotDeclarationContract[];
  /**
   * Type parameters of the generated component. Each target writer prints them on the component
   * and on its exported props type, so consumers keep type inference for typed props.
   */
  typeParameters?: StyledTypeParameterContract[];
};

export type StyledSlotDeclarationContract = {
  frameworks?: FrameworkTarget[];
  name: string;
};

export type StyledTypeParameterContract = {
  constraint?: string;
  default?: string;
  name: string;
};

export type StyledComponentForwardRefContract = {
  frameworks?: FrameworkTarget[];
  targetType: string;
};

export type StyledNativeModelContract = {
  name: "value";
  tag: "select" | "textarea";
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
  /** Line comment above the field, such as a lint disable with its reason. React prints it. */
  comment?: string;
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
  /**
   * Local state seeded once from value. It keeps the last accepted value of the named model, so a
   * later undefined model keeps that value, and it holds the value when no parent owns the model.
   */
  state?: { acceptedFrom: string };
  value: ValueExpression;
};

export type ImportContract =
  | {
      frameworks?: FrameworkTarget[];
      importName: string;
      source: string;
      svg?: SvgAsset;
      type: "default";
    }
  | {
      frameworks?: FrameworkTarget[];
      importName: string;
      localName?: string;
      source: string;
      svg?: SvgAsset;
      type: "named";
    };

export type SvgAsset = {
  attributes: SvgAssetAttribute[];
  children: SvgAssetElement[];
  omittedAttributes?: string[];
};

export type SvgAssetAttribute = {
  name: string;
  value: string;
};

export type SvgAssetElement = {
  attributes: SvgAssetAttribute[];
  tag: "path";
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
  /** Targets that omit generated children when a bound tag selects a void HTML element. */
  omitVoidChildrenIn?: FrameworkTarget[];
  attrs?: AttributeContract[];
  children?: RenderNode[];
  leadingComments?: CommentContract[];
  selfClosing?: boolean;
  tag: string;
  /** Treats `tag` as a runtime binding instead of a literal element name. */
  tagBinding?: true;
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
