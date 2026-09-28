import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const staticStyledRoots = ["alert", "card", "kbd", "table"] as const;
/** Expected public DOM anatomy, independent of the native printer. */
export const staticStyledParts = [
  {
    root: "alert",
    name: "Alert",
    member: "Root",
    tag: "DIV",
    element: "HTMLDivElement",
    slot: "alert",
  },
  {
    root: "alert",
    name: "AlertTitle",
    member: "Title",
    tag: "H5",
    element: "HTMLHeadingElement",
    slot: "alert-title",
  },
  {
    root: "alert",
    name: "AlertDescription",
    member: "Description",
    tag: "P",
    element: "HTMLParagraphElement",
    slot: "alert-description",
  },
  ...["", "Header", "Title", "Description", "Content", "Footer", "Action"].map((suffix) => ({
    root: "card",
    name: `Card${suffix}`,
    member: suffix || "Root",
    tag: "DIV",
    element: "HTMLDivElement",
    slot: `card${suffix ? `-${suffix.toLowerCase()}` : ""}`,
  })),
  { root: "kbd", name: "Kbd", member: "Root", tag: "KBD", element: "HTMLElement", slot: "kbd" },
  {
    root: "kbd",
    name: "KbdGroup",
    member: "Group",
    tag: "KBD",
    element: "HTMLElement",
    slot: "kbd-group",
  },
  {
    root: "table",
    name: "Table",
    member: "Root",
    tag: "TABLE",
    element: "HTMLTableElement",
    slot: "table",
  },
  {
    root: "table",
    name: "TableHeader",
    member: "Header",
    tag: "THEAD",
    element: "HTMLTableSectionElement",
    slot: "table-header",
  },
  {
    root: "table",
    name: "TableBody",
    member: "Body",
    tag: "TBODY",
    element: "HTMLTableSectionElement",
    slot: "table-body",
  },
  {
    root: "table",
    name: "TableFoot",
    member: "Foot",
    tag: "TFOOT",
    element: "HTMLTableSectionElement",
    slot: "table-foot",
  },
  {
    root: "table",
    name: "TableRow",
    member: "Row",
    tag: "TR",
    element: "HTMLTableRowElement",
    slot: "table-row",
  },
  {
    root: "table",
    name: "TableHead",
    member: "Head",
    tag: "TH",
    element: "HTMLTableCellElement",
    slot: "table-head",
  },
  {
    root: "table",
    name: "TableCell",
    member: "Cell",
    tag: "TD",
    element: "HTMLTableCellElement",
    slot: "table-cell",
  },
  {
    root: "table",
    name: "TableCaption",
    member: "Caption",
    tag: "CAPTION",
    element: "HTMLTableCaptionElement",
    slot: "table-caption",
  },
] as const;
export const staticStyledImports = staticStyledRoots
  .map((root) => {
    const name = root[0]!.toUpperCase() + root.slice(1);
    const parts = staticStyledParts.filter((part) => part.root === root);
    return `import ${name}Parts, { ${parts.flatMap((part) => [part.name, `type ${part.name}Props`]).join(", ")}, ${name}Variants } from "./${root}/index.js";`;
  })
  .join("\n");

export const createStyledStaticConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, staticStyledRoots);

const propsDeclarations = staticStyledParts
  .map(
    ({
      name,
      element,
      root,
      member,
    }) => `let ${name}Ref = $state<${element}>();
const ${name}Attrs: ${name}Props = { title: "${name}", ref: ${name}Ref, onpointerdown(event) { const owner: ${name === "TableCaption" ? "HTMLElement" : element} = event.currentTarget; void owner; } };
const ${name}FromNamespace: typeof ${name} = ${root[0]!.toUpperCase() + root.slice(1)}Parts.${member}; void ${name}FromNamespace;`,
  )
  .join("\n");

export const staticStyledPositive = `<script lang="ts">
${staticStyledImports}
${propsDeclarations}
void [AlertVariants.alert({ variant: "warning" }), CardVariants.card({ size: "sm" }), KbdVariants.kbd(), TableVariants.table()];
</script>
<Alert {...AlertAttrs} variant="success"><AlertTitle {...AlertTitleAttrs}>Saved</AlertTitle><AlertDescription {...AlertDescriptionAttrs}>Changes are available.</AlertDescription></Alert>
<Card {...CardAttrs} size="sm"><CardHeader {...CardHeaderAttrs}><CardTitle {...CardTitleAttrs}>Project</CardTitle><CardDescription {...CardDescriptionAttrs}>Details</CardDescription><CardAction {...CardActionAttrs}><button>Edit</button></CardAction></CardHeader><CardContent {...CardContentAttrs}>Content</CardContent><CardFooter {...CardFooterAttrs}>Footer</CardFooter></Card>
<KbdGroup {...KbdGroupAttrs}><Kbd {...KbdAttrs}>Ctrl</Kbd><span>+</span><KbdParts.Root>K</KbdParts.Root></KbdGroup>
<Table {...TableAttrs} aria-label="Projects"><TableCaption {...TableCaptionAttrs}>Current projects</TableCaption><TableHeader {...TableHeaderAttrs}><TableRow {...TableRowAttrs}><TableHead {...TableHeadAttrs} scope="col">Name</TableHead><TableParts.Head scope="col">Status</TableParts.Head></TableRow></TableHeader><TableBody {...TableBodyAttrs}><TableParts.Row><TableCell {...TableCellAttrs} colspan={2} headers="project-column">Starwind</TableCell></TableParts.Row></TableBody><TableFoot {...TableFootAttrs}><TableParts.Row><TableParts.Cell colspan={2}>One project</TableParts.Cell></TableParts.Row></TableFoot></Table>
<AlertParts.Root variant="info"><AlertParts.Title>Namespace composition</AlertParts.Title></AlertParts.Root><CardParts.Root><CardParts.Content>Namespace content</CardParts.Content></CardParts.Root>`;
