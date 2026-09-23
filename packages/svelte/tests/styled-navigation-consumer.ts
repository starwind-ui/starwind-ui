import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const navigationRoots = ["button-group", "pagination"] as const;
export const navigationParts = [
  {
    root: "button-group",
    name: "ButtonGroup",
    member: "Root",
    tag: "DIV",
    element: "HTMLDivElement",
    slot: "button-group",
  },
  {
    root: "button-group",
    name: "ButtonGroupSeparator",
    member: "Separator",
    tag: "DIV",
    element: "HTMLDivElement",
    slot: "button-group-separator",
  },
  {
    root: "button-group",
    name: "ButtonGroupText",
    member: "Text",
    tag: "DIV",
    element: "HTMLDivElement",
    slot: "button-group-text",
  },
  {
    root: "pagination",
    name: "Pagination",
    member: "Root",
    tag: "NAV",
    element: "HTMLElement",
    slot: "pagination",
  },
  {
    root: "pagination",
    name: "PaginationContent",
    member: "Content",
    tag: "UL",
    element: "HTMLUListElement",
    slot: "pagination-content",
  },
  {
    root: "pagination",
    name: "PaginationItem",
    member: "Item",
    tag: "LI",
    element: "HTMLLIElement",
    slot: "pagination-item",
  },
  {
    root: "pagination",
    name: "PaginationLink",
    member: "Link",
    tag: "A",
    element: "HTMLAnchorElement",
    slot: "pagination-link",
  },
  {
    root: "pagination",
    name: "PaginationPrevious",
    member: "Previous",
    tag: "A",
    element: "HTMLAnchorElement",
    slot: "pagination-previous",
  },
  {
    root: "pagination",
    name: "PaginationNext",
    member: "Next",
    tag: "A",
    element: "HTMLAnchorElement",
    slot: "pagination-next",
  },
  {
    root: "pagination",
    name: "PaginationEllipsis",
    member: "Ellipsis",
    tag: "SPAN",
    element: "HTMLSpanElement",
    slot: "pagination-ellipsis",
  },
] as const;
export const navigationImports = navigationRoots
  .map(
    (root, index) =>
      `import Parts${index}, { ${navigationParts
        .filter((part) => part.root === root)
        .flatMap((part) => [part.name, `type ${part.name}Props`])
        .join(
          ", ",
        )}, ${root === "pagination" ? "PaginationVariants" : "ButtonGroupVariants"} } from "./${root}/index.js";`,
  )
  .join("\n");
export const createStyledNavigationConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, [...navigationRoots, "button", "separator"]);
export const navigationPositive = `<script lang="ts">
${navigationImports}
import {Button, type ButtonProps} from "./button/index.js";
import type {SeparatorProps} from "./separator/index.js";
${navigationParts.map((part) => `let ${part.name}Ref=$state<${part.element}>();const ${part.name}Attrs:${part.name}Props={title:"${part.name}",ref:${["PaginationLink", "PaginationPrevious", "PaginationNext"].includes(part.name) ? `(node)=>{const owner:${part.element}|null=node;void owner;}` : `${part.name}Ref`},onpointerdown(event){const owner:${part.element}=event.currentTarget;void owner;}};const ${part.name}FromNamespace:typeof ${part.name}=Parts${part.root === "pagination" ? 1 : 0}.${part.member};void ${part.name}FromNamespace;`).join("\n")}
const buttonSize:ButtonProps["size"]="icon-sm", separatorOrientation:SeparatorProps["orientation"]="vertical";
const separator:ButtonGroupSeparatorProps={orientation:separatorOrientation};
const link:PaginationLinkProps={size:buttonSize,href:"#page",isActive:true,download:"page",target:"_self",disabled:false,focusableWhenDisabled:false,"data-slot":"custom-link",class:["custom",{selected:true}],style:"color:red",onclick(event){const owner:HTMLAnchorElement=event.currentTarget;void owner;}};
void [ButtonGroupVariants.buttonGroup({orientation:"vertical"}),ButtonGroupVariants.buttonGroupSeparator(),ButtonGroupVariants.buttonGroupText(),PaginationVariants.pagination(),PaginationVariants.paginationContent(),PaginationVariants.paginationEllipsis({size:"icon-lg"})];
</script>
<ButtonGroup {...ButtonGroupAttrs} orientation="vertical" aria-label="Tools"><Button>Action</Button><ButtonGroupSeparator {...ButtonGroupSeparatorAttrs} {...separator}/><ButtonGroupText {...ButtonGroupTextAttrs}>Saved</ButtonGroupText></ButtonGroup>
<Pagination {...PaginationAttrs} aria-label="Result pages"><PaginationContent {...PaginationContentAttrs}><PaginationItem {...PaginationItemAttrs} value={2}><PaginationPrevious {...PaginationPreviousAttrs} href="#previous">Previous</PaginationPrevious></PaginationItem><Parts1.Item><PaginationLink {...PaginationLinkAttrs} {...link}>1</PaginationLink></Parts1.Item><Parts1.Item><PaginationEllipsis {...PaginationEllipsisAttrs}/></Parts1.Item><Parts1.Item><PaginationNext {...PaginationNextAttrs} href="#next">Next</PaginationNext></Parts1.Item></PaginationContent></Pagination>
<PaginationPrevious href="#before">{#snippet icon()}<span>←</span>{/snippet}Back</PaginationPrevious>
<PaginationNext href="#after">{#snippet icon()}<span>→</span>{/snippet}Forward</PaginationNext>
<PaginationEllipsis size="icon-sm">{#snippet icon()}<span>+</span>{/snippet}<span class="sr-only">More results</span></PaginationEllipsis>`;
