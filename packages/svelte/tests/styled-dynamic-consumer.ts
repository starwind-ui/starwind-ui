import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const dynamicStyledRoots = ["aspect-ratio", "badge", "item"] as const;
/** Independent expectations for every public native owner. */
export const dynamicStyledParts = [
  {
    root: "aspect-ratio",
    name: "AspectRatio",
    member: "Root",
    tag: "DIV",
    element: "HTMLElement",
    slot: "aspect-ratio",
  },
  {
    root: "badge",
    name: "Badge",
    member: "Root",
    tag: "DIV",
    element: "HTMLDivElement | HTMLAnchorElement",
    slot: "badge",
  },
  { root: "item", name: "Item", member: "Root", tag: "DIV", element: "HTMLElement", slot: "item" },
  ...[
    "Actions",
    "Content",
    "Description",
    "Footer",
    "Group",
    "Header",
    "Media",
    "Separator",
    "Title",
  ].map((suffix) => ({
    root: "item",
    name: `Item${suffix}`,
    member: suffix,
    tag: suffix === "Description" ? "P" : "DIV",
    element: suffix === "Description" ? "HTMLParagraphElement" : "HTMLDivElement",
    slot: `item-${suffix.toLowerCase()}`,
  })),
] as const;
export const dynamicStyledImports = `import AspectRatioDefault, { AspectRatio, type AspectRatioProps, AspectRatioVariants } from "./aspect-ratio/index.js";
import BadgeDefault, { Badge, type BadgeProps, BadgeVariants } from "./badge/index.js";
import ItemParts, { ${dynamicStyledParts
  .filter((part) => part.root === "item")
  .flatMap((part) => [part.name, `type ${part.name}Props`])
  .join(", ")}, ItemVariants } from "./item/index.js";`;
export const createStyledDynamicConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, [...dynamicStyledRoots, "separator"]);
const declarations = dynamicStyledParts
  .map(
    ({
      name,
      element,
      root,
      member,
    }) => `let ${name}Ref = $state<${element}>();
const ${name}Attrs: ${name}Props = { title: "${name}", ref: ${name}Ref, onpointerdown(event) { const owner: HTMLElement = event.currentTarget; void owner; } };
const ${name}FromDefault: typeof ${name} = ${root === "item" ? `ItemParts.${member}` : `${name}Default`}; void ${name}FromDefault;`,
  )
  .join("\n");
export const dynamicStyledPositive = `<script lang="ts">
${dynamicStyledImports}
${declarations}
void [AspectRatioVariants.aspectRatio(), AspectRatioVariants.aspectRatioWrapper(), BadgeVariants.badge({ tone: "primary-accent", appearance: "frosted", eyebrow: true, size: "lg" }), ItemVariants.item({ variant: "outline", size: "sm" }), ItemVariants.itemMedia({ variant: "icon" })];
</script>
<AspectRatio {...AspectRatioAttrs} ratio={16 / 9} as="section" style="color: red">Photo</AspectRatio><AspectRatioDefault as="article" /><AspectRatio as="img" />
<Badge {...BadgeAttrs} href="#details" target="_self" download="file" tone="success" appearance="soft" eyebrow size="sm">Published</Badge><BadgeDefault variant="outline">Draft</BadgeDefault>
<ItemGroup {...ItemGroupAttrs}><Item {...ItemAttrs} as="a" href="#details" variant="outline" size="sm"><ItemHeader {...ItemHeaderAttrs}>Header</ItemHeader><ItemMedia {...ItemMediaAttrs} variant="image">Media</ItemMedia><ItemContent {...ItemContentAttrs}><ItemTitle {...ItemTitleAttrs}>Title</ItemTitle><ItemDescription {...ItemDescriptionAttrs}>Description</ItemDescription></ItemContent><ItemActions {...ItemActionsAttrs}>Actions</ItemActions><ItemFooter {...ItemFooterAttrs}>Footer</ItemFooter></Item><ItemSeparator {...ItemSeparatorAttrs} orientation="vertical" /><ItemParts.Root as="article"><ItemParts.Title>Namespace</ItemParts.Title></ItemParts.Root></ItemGroup>`;
