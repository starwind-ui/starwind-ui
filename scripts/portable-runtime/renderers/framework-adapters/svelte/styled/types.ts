import type {
  StyledOutputAttribute,
  StyledOutputComponentGroup,
  StyledOutputDestructureProp,
  StyledOutputTypeParameter,
  StyledOutputValueExpression,
  StyledOutputVariantAlias,
} from "../../../styled-output-model/index.js";

export type SvelteStyledRenderNode =
  | {
      type: "element" | "component";
      name: string;
      attrs: StyledOutputAttribute[];
      children: SvelteStyledRenderNode[];
      attachment?: string;
      bindings?: { name: string; expression: string }[];
      selfClosing: boolean;
    }
  | {
      type: "condition";
      condition: string;
      then: SvelteStyledRenderNode[];
      else: SvelteStyledRenderNode[];
    }
  | {
      type: "each";
      each: string;
      item: string;
      index: string;
      key: string;
      children: SvelteStyledRenderNode[];
    }
  | { type: "fragment"; children: SvelteStyledRenderNode[] }
  | {
      type: "snippet-definition";
      name: string;
      parameters: string[];
      children: SvelteStyledRenderNode[];
    }
  | { type: "snippet"; name: string; fallback: SvelteStyledRenderNode[] }
  | { type: "text" | "expression"; value: string };

export type SvelteStyledImport = { source: string; names: string[]; typeOnly?: boolean };
export type SvelteStyledComponentProjection = {
  // Instance script type parameters, and the arguments the props annotation passes.
  generics?: { declaration: string; arguments: string };
  semanticNativeTag?: string;
  semanticNativeSlot?: string;
  typeExports?: string[];
  exportName: string;
  fileName: string;
  imports: SvelteStyledImport[];
  publicTypes: string;
  destructure: StyledOutputDestructureProp[];
  rest?: string;
  // Svelte markup that precedes the projected render tree, such as a shared snippet.
  templatePrelude?: string;
  // SSR evaluates derived expressions eagerly, so their state must be initialized first.
  initialization?: string[];
  setup: string[];
  /** Printed on the instance script `generics` attribute and on the public props type. */
  typeParameters?: StyledOutputTypeParameter[];
  variables: {
    name: string;
    state?: { acceptedFrom: string };
    value: StyledOutputValueExpression;
  }[];
  render: SvelteStyledRenderNode[];
};
export type SvelteStyledVariantAlias = StyledOutputVariantAlias & { localName: string };
export type SvelteStyledGroupProjection = {
  variantAliases: SvelteStyledVariantAlias[];
  primitiveFacade?: { source: string; types: string[]; values: string[] };
  group: StyledOutputComponentGroup;
  components: SvelteStyledComponentProjection[];
};
export type SvelteStyledFile = { relativePath: string; content: string };
export type SvelteStyledRenderOptions = { primitiveImportBase: string };
