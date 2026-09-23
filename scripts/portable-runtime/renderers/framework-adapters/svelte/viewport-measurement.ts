import { scrollAreaRecipe, scrollAreaThresholds } from "../../shared-recipes/media/scroll-area.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
  AdapterViewportMeasurementFacts,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteViewportMeasurementIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "viewport-measurement")
    throw new TypeError("Svelte viewport-measurement index requires family facts.");
  const facts = file.family.facts;
  const keys = ["root", "viewport", "content", "scrollbar", "thumb", "corner"] as const;
  return {
    path: file.path,
    contents: `${keys.map((key) => `import ${facts.exports[key]} from "./${facts.exports[key]}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${keys.map((key) => `${facts.parts[key].namespaceKey}: ${facts.exports[key]}`).join(", ")} };
export { ${facts.exports.namespace}, ${keys.map((key) => facts.exports[key]).join(", ")} };
export type { ${facts.threshold.typeName} } from "./${facts.exports.root}.svelte";
export default ${facts.exports.namespace};
`,
  };
}

export function printSvelteViewportMeasurementComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "viewport-measurement")
    throw new TypeError("Svelte viewport-measurement component requires family facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root" ? printRoot(family.facts) : printPart(family.facts, family.part),
  };
}

function printRoot(facts: AdapterViewportMeasurementFacts): string {
  const threshold = facts.props.overflowEdgeThreshold;
  return `<script module lang="ts">
  export type ${facts.threshold.typeName} = number | Partial<{ xStart: number; xEnd: number; yStart: number; yEnd: number }>;
</script>
<script lang="ts">
  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; ${threshold.name}?: ${facts.threshold.typeName} };
  let { children, ref, ${threshold.name}, ...rest }: Props = $props();
  let instance = $state.raw<ReturnType<typeof ${facts.runtime.factory}> | null>(null);
${scrollAreaThresholds(facts)}
  let thresholds = $derived(${facts.threshold.helperName}(${threshold.name}));
  const attachRoot: Attachment<HTMLDivElement> = (element) => {
    const controller = untrack(() => ${facts.runtime.factory}(element));
    instance = controller;
    return () => { if (instance === controller) instance = null; controller.destroy(); };
  };
  $effect(() => {
    const controller = instance;
    void thresholds;
    if (controller) untrack(() => controller.refresh());
  });
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<${facts.parts.root.defaultElement} {...rest} ${facts.attrs.root} role="${facts.parts.root.role}"
  ${facts.attrs.overflowEdgeThreshold}={thresholds.shared}
  ${facts.attrs.overflowEdgeThresholdEdges.xStart}={thresholds.xStart}
  ${facts.attrs.overflowEdgeThresholdEdges.xEnd}={thresholds.xEnd}
  ${facts.attrs.overflowEdgeThresholdEdges.yStart}={thresholds.yStart}
  ${facts.attrs.overflowEdgeThresholdEdges.yEnd}={thresholds.yEnd}
  {@attach attachRoot} {@attach attachRef}>
  {@render children?.()}
</${facts.parts.root.defaultElement}>
`;
}

function printPart(
  facts: AdapterViewportMeasurementFacts,
  name: "viewport" | "content" | "scrollbar" | "thumb" | "corner",
): string {
  const part = facts.parts[name];
  const viewport = name === "viewport";
  const scrollbar = name === "scrollbar";
  const attrs = viewport
    ? ` role="${facts.parts.viewport.role}" tabindex={initialTabIndex} style={viewportStyle}`
    : name === "content"
      ? ` role="${facts.parts.content.role}"`
      : name === "corner"
        ? ` ${facts.attrs.cornerAriaHidden}="true"`
        : scrollbar
          ? ` ${facts.attrs.scrollbarAriaHidden}="true" ${facts.attrs.keepMounted}={${facts.props.keepMounted.name} ? "" : undefined} ${facts.attrs.orientation}={${facts.props.orientation.name}}`
          : "";
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = HTMLAttributes<HTMLDivElement> & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void; ${scrollbar ? `${facts.props.keepMounted.name}?: ${facts.props.keepMounted.type}; ${facts.props.orientation.name}?: ${facts.props.orientation.type};` : ""} };
  let { children, ref, ${viewport ? "style, tabindex, " : ""}${scrollbar ? `${facts.props.keepMounted.name} = ${facts.props.keepMounted.defaultValue}, ${facts.props.orientation.name} = ${facts.props.orientation.defaultValue}, ` : ""}...rest }: Props = $props();
${
  viewport
    ? `  let viewportStyle = $derived((style ?? "") + ";overflow:${scrollAreaRecipe.viewport.overflow}!important");
  const initialTabIndex = untrack(() => tabindex ?? ${scrollAreaRecipe.viewport.initialTabIndex});\n`
    : ""
}
${printSvelteRefAttachment("HTMLDivElement")}
</script>
${viewport ? "<!-- Runtime updates viewport focusability from measured overflow. -->\n<!-- svelte-ignore a11y_no_noninteractive_tabindex -->\n" : ""}<${part.defaultElement} {...rest} ${part.discoveryAttribute}${attrs} {@attach attachRef}>
  {@render children?.()}
</${part.defaultElement}>
`;
}
