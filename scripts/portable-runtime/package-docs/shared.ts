import type {
  PrimitiveDataAttributeReferenceMetadata,
  PrimitiveDocsMetadata,
  PrimitivePartApiReferenceMetadata,
  PrimitivePropReferenceMetadata,
} from "../docs/layered-docs/types.js";
import { bulletList, codeFence, inlineCode, pascalCase, section, table } from "./markdown.js";

export type DocsFiles = Map<string, string>;

export const STARWIND_SITE = "https://starwind.dev";
export const ISSUE_TRACKER = "https://github.com/starwind-ui/starwind-ui/issues";

export const findApiPart = (primitive: PrimitiveDocsMetadata, partName: string) =>
  primitive.docsReference.apiReference.parts.find(
    (part) => pascalCase(part.part) === partName || part.part === partName,
  );

/** Looks up an authored prop description on any part when the prop name matches. */
export const findPropReference = (
  primitive: PrimitiveDocsMetadata,
  name: string,
  preferred?: PrimitivePartApiReferenceMetadata,
): PrimitivePropReferenceMetadata | undefined =>
  preferred?.props.find((prop) => prop.name === name) ??
  primitive.docsReference.apiReference.parts
    .flatMap((part) => part.props)
    .find((prop) => prop.name === name);

export const describeDataAttributes = (
  attributes: readonly PrimitiveDataAttributeReferenceMetadata[],
) =>
  table(
    ["Attribute", "Description"],
    attributes.map((attribute) => [
      inlineCode(attribute.value ? `${attribute.name}="${attribute.value}"` : attribute.name),
      attribute.description ?? "",
    ]),
  );

export const renderCssVariables = (primitive: PrimitiveDocsMetadata) =>
  section(
    "## CSS variables",
    table(
      ["Variable", "Parts", "Description"],
      (primitive.cssVariables ?? []).map((variable) => [
        inlineCode(variable.name),
        variable.parts.join(", "),
        variable.description,
      ]),
    ),
  );

export const renderGuidance = (primitive: PrimitiveDocsMetadata) => {
  const reference = primitive.docsReference;
  return [
    section("## Behavior notes", bulletList(reference.behaviorNotes)),
    section(
      "## Usage guidelines",
      bulletList(
        reference.usageGuidelines.map((guideline) =>
          guideline.description
            ? `**${guideline.title}** ${guideline.description}`
            : guideline.title,
        ),
      ),
    ),
    ...reference.sections.map((entry) =>
      section(`## ${entry.title}`, entry.content.replace(/^\s*::example\{id="[^"]+"\}\s*$/gm, "")),
    ),
  ];
};

export const renderRelatedStyled = (primitive: PrimitiveDocsMetadata) =>
  section(
    "## Related Styled components",
    "Install Styled components as editable source with the Starwind CLI.",
    bulletList(
      primitive.docsReference.apiReference.relatedStyledComponents.map(
        (component) => `[${component.title}](${STARWIND_SITE}${component.docsPath})`,
      ),
    ),
  );

export const exampleCode = (code: string, language: string) => codeFence(code, language);
