import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const breadcrumbParts = [
  { name: "Breadcrumb", member: "Root", tag: "NAV", element: "HTMLElement", slot: "breadcrumb" },
  {
    name: "BreadcrumbList",
    member: "List",
    tag: "OL",
    element: "HTMLOListElement",
    slot: "breadcrumb-list",
  },
  {
    name: "BreadcrumbItem",
    member: "Item",
    tag: "LI",
    element: "HTMLLIElement",
    slot: "breadcrumb-item",
  },
  {
    name: "BreadcrumbLink",
    member: "Link",
    tag: "A",
    element: "HTMLAnchorElement",
    slot: "breadcrumb-link",
  },
  {
    name: "BreadcrumbPage",
    member: "Page",
    tag: "SPAN",
    element: "HTMLSpanElement",
    slot: "breadcrumb-page",
  },
  {
    name: "BreadcrumbSeparator",
    member: "Separator",
    tag: "LI",
    element: "HTMLLIElement",
    slot: "breadcrumb-separator",
  },
  {
    name: "BreadcrumbEllipsis",
    member: "Ellipsis",
    tag: "SPAN",
    element: "HTMLSpanElement",
    slot: "breadcrumb-ellipsis",
  },
] as const;
export const breadcrumbImports = `import BreadcrumbParts, { ${breadcrumbParts.flatMap((part) => [part.name, `type ${part.name}Props`]).join(", ")}, BreadcrumbVariants } from "./breadcrumb/index.js";`;
export const createStyledBreadcrumbConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["breadcrumb"]);
export const BREADCRUMB_ROUTER_LINK = `<script lang="ts">
import { untrack } from "svelte";
import type { HTMLAnchorAttributes } from "svelte/elements";
let { to, ref, children, ...props }: Omit<HTMLAnchorAttributes, "href"> & { to: string; ref?: (node: HTMLAnchorElement | null) => void } = $props();
function attachRef(node: HTMLAnchorElement) {
  const callback = ref;
  untrack(() => callback?.(node));
  return () => untrack(() => callback?.(null));
}
</script>
<a {...props} href={to} data-router-link {@attach attachRef}>{@render children?.()}</a>`;
const declarations = breadcrumbParts
  .map(
    ({
      name,
      element,
      member,
    }) => `let ${name}Ref = $state<${element}>();
const ${name}Attrs: ${name}Props = { title: "${name}", ref: ${name}Ref, onpointerdown(event) { const owner: ${element} = event.currentTarget; void owner; } };
const ${name}FromNamespace: typeof ${name} = BreadcrumbParts.${member}; void ${name}FromNamespace;`,
  )
  .join("\n");
export const breadcrumbPositive = `<script lang="ts">
${breadcrumbImports}
import RouterLink from "./BreadcrumbRouterLink.svelte";
${declarations}
const nativeAnchor: BreadcrumbLinkProps = { href: "#docs", download: "guide", target: "_self", onclick(event) { const anchor: HTMLAnchorElement = event.currentTarget; void anchor; } };
void [BreadcrumbVariants.breadcrumbLink(), BreadcrumbVariants.breadcrumbEllipsis(), BreadcrumbVariants.breadcrumbItem(), BreadcrumbVariants.breadcrumbList(), BreadcrumbVariants.breadcrumbPage(), BreadcrumbVariants.breadcrumbSeparator()];
</script>
<Breadcrumb {...BreadcrumbAttrs} aria-label="Documentation"><BreadcrumbList {...BreadcrumbListAttrs} start={1}><BreadcrumbItem {...BreadcrumbItemAttrs} value={1}><BreadcrumbLink {...BreadcrumbLinkAttrs} {...nativeAnchor}>Home</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator {...BreadcrumbSeparatorAttrs} /><BreadcrumbParts.Item><BreadcrumbEllipsis {...BreadcrumbEllipsisAttrs} /></BreadcrumbParts.Item><BreadcrumbParts.Separator>/</BreadcrumbParts.Separator><BreadcrumbParts.Item><BreadcrumbLink asChild><a href="#api" class={["rounded", { active: true }]} style="color: red">API</a></BreadcrumbLink></BreadcrumbParts.Item><BreadcrumbParts.Separator /><BreadcrumbParts.Item><BreadcrumbParts.Link asChild><RouterLink to="#components" class={BreadcrumbVariants.breadcrumbLink()} ref={node => { const anchor: HTMLAnchorElement | null = node; void anchor; }} onclick={event => { const anchor: HTMLAnchorElement = event.currentTarget; void anchor; }}>Components</RouterLink></BreadcrumbParts.Link></BreadcrumbParts.Item><BreadcrumbParts.Separator /><BreadcrumbParts.Item><BreadcrumbPage {...BreadcrumbPageAttrs}>Breadcrumb</BreadcrumbPage></BreadcrumbParts.Item></BreadcrumbList></Breadcrumb>
<BreadcrumbEllipsis>{#snippet icon()}<span>+</span>{/snippet}More pages</BreadcrumbEllipsis>`;
