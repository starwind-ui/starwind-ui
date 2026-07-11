import { astroLifecycleProjection } from "./lifecycle-projection.js";

type AstroSimpleSlottedRestPropsComponentArgs = {
  attributes: readonly (string | undefined)[];
  defaultElement: string;
};

type AstroScopedRuntimeSetupScriptArgs = {
  elementName?: string;
  factory: string;
  importSource: string;
  selectorAttribute: string;
  setupFunction: string;
};

export function printAstroSimpleSlottedRestPropsComponent({
  attributes,
  defaultElement,
}: AstroSimpleSlottedRestPropsComponentArgs): string {
  const attributeText = attributes.filter(Boolean).join(" ");
  if (!attributeText) {
    throw new Error(`${defaultElement} simple Astro part is missing attributes.`);
  }

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${defaultElement} ${attributeText} {...rest}>\n  <slot />\n</${defaultElement}>\n`;
}

export function printAstroScopedRuntimeSetupScript({
  elementName = "root",
  factory,
  importSource,
  selectorAttribute,
  setupFunction,
}: AstroScopedRuntimeSetupScriptArgs): string {
  return astroLifecycleProjection
    .printRuntimeSetup({
      elementName,
      factory,
      importSource,
      selectorAttribute,
      setupFunction,
    })
    .trimStart();
}
