import {
  avatarFallbackHidden,
  avatarRecipe,
  avatarRefresh,
  avatarRefreshInputs,
  avatarSubscription,
} from "../../shared-recipes/media/avatar.js";
import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterMediaStatusFacts,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteMediaStatusIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "media-status")
    throw new TypeError("Svelte media-status index requires media-status facts.");
  const f = file.family.facts;
  const members = [f.exports.root, f.exports.image, f.exports.fallback];
  return {
    path: file.path,
    contents: `${members.map((name) => `import ${name} from "./${name}.svelte";`).join("\n")}
const ${f.exports.namespace} = { ${Object.entries(f.parts)
      .map(([part, value]) => `${value.namespaceKey}: ${f.exports[part as keyof typeof f.parts]}`)
      .join(", ")} };
export { ${f.exports.namespace}, ${members.join(", ")} };
export default ${f.exports.namespace};
export type { ${f.state.type}, ${f.event.detailsType} } from "${f.runtime.importSource}";
`,
  };
}

export function printSvelteMediaStatusComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "media-status")
    throw new TypeError("Svelte media-status component requires media-status facts.");
  return {
    path: `${file.path}.svelte`,
    contents: family.part === "root" ? root(family.facts) : part(family.facts, family.part),
  };
}

function root(f: AdapterMediaStatusFacts): string {
  return `<script module lang="ts">
  import { getContext, setContext } from "svelte";
  import { ${f.runtime.factory} } from "${f.runtime.importSource}";
  const contextKey = Symbol("${f.displayName}");
  type Instance = ReturnType<typeof ${f.runtime.factory}>;
  type Context = { readonly instance: Instance | null; requestRefresh(): void };
  export function getMediaContext(): Context | undefined { return getContext(contextKey); }
</script>
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  type Props = HTMLAttributes<HTMLSpanElement> & { children?: Snippet; ref?: (element: HTMLSpanElement | null) => void };
  let { children, ref, ...rest }: Props = $props();
  let rootNode = $state.raw<HTMLSpanElement | null>(null);
  let instance = $state.raw<Instance | null>(null);
  let refreshPending = false;
  function requestRefresh(): void {
    ${avatarRefresh(f, { instance: "instance", root: "rootNode", pending: "refreshPending" }).replaceAll("\n", "\n    ")}
  }
  setContext<Context>(contextKey, {
    get instance() { return instance; },
    requestRefresh,
  });
  const attachRoot: Attachment<HTMLSpanElement> = (element) => {
    rootNode = element;
    return () => { rootNode = null; };
  };
  $effect(() => {
    const element = rootNode;
    if (!element) return;
    const controller = untrack(() => ${f.runtime.factory}(element));
    instance = controller;
    return () => { instance = null; controller.destroy(); };
  });
${printSvelteRefAttachment("HTMLSpanElement")}
</script>
<${f.parts.root.defaultElement} {...rest} ${f.parts.root.discoveryAttribute} ${f.attrs.rootStatus}="${avatarRecipe.initialStatus}" {@attach attachRoot} {@attach attachRef}>
  {@render children?.()}
</${f.parts.root.defaultElement}>
`;
}

function part(f: AdapterMediaStatusFacts, name: "image" | "fallback"): string {
  const image = name === "image";
  const element = image ? "HTMLImageElement" : "HTMLSpanElement";
  const native = image ? "HTMLImgAttributes" : "HTMLAttributes<HTMLSpanElement>";
  const facts = f.parts[name];
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { ${image ? "HTMLImgAttributes" : "HTMLAttributes"} } from "svelte/elements";
  import type { Attachment } from "svelte/attachments";
  import { getMediaContext } from "./${f.exports.root}.svelte";
${image ? `  import type { ${f.state.type}, ${f.event.detailsType} } from "${f.runtime.importSource}";` : ""}
  type Props = Omit<${native}, "children"${image ? ' | "alt"' : ""}> & {
    ref?: (element: ${element} | null) => void;
    ${image ? `${f.props.alt.name}: ${f.props.alt.type}; ${f.event.callbackProp}?: (status: ${f.state.type}, details: ${f.event.detailsType}) => void;` : `children?: Snippet; ${f.props.delay.name}?: ${f.props.delay.type};`}
  };
  let { ref, ${image ? `${f.props.alt.name}, style, ${f.event.callbackProp}` : `children, ${f.props.delay.name}`}, ...rest }: Props = $props();
  const context = getMediaContext();
  ${
    image
      ? `// Preserve Runtime's committed visibility when caller styles change.
  const initialStyle = untrack(() => style);
  const attachPart: Attachment<HTMLImageElement> = (element) => {
    untrack(() => context?.requestRefresh());
    $effect(() => {
      const value = style;
      untrack(() => {
        const visibility = element.style.${f.presence.imageConcealment.property};
        element.style.cssText = value ?? "";
        element.style.${f.presence.imageConcealment.property} = visibility;
      });
    });
    return () => context?.requestRefresh();
  };
  $effect(() => {
    const controller = context?.instance;
    if (!controller) return;
    const notify = (details: ${f.event.detailsType}) => untrack(() => ${f.event.callbackProp}?.(details.${f.event.valueProperty}, details));
    ${avatarSubscription({
      listen: `const unsubscribe = controller.subscribe("${f.event.name}", notify);`,
      read: `controller.${f.state.getter}()`,
      notify: `notify({ previousStatus: "${avatarRecipe.initialStatus}", status });`,
      untracked: (body) => `untrack(() => { ${body} });`,
    })}
    return unsubscribe;
  });`
      : `const attachPart: Attachment<HTMLSpanElement> = (element) => {
    $effect(() => { ${avatarRefreshInputs(f, "fallback")
      .map((name) => `void ${name};`)
      .join(" ")} untrack(() => context?.requestRefresh()); });
    return () => context?.requestRefresh();
  };`
  }
${printSvelteRefAttachment(element)}
</script>
<${facts.defaultElement} {...rest} ${facts.discoveryAttribute} ${image ? `${f.props.alt.name}={${f.props.alt.name}} ${f.attrs.imageStatus}="${avatarRecipe.initialStatus}" style={(initialStyle ?? "") + "; ${f.presence.imageConcealment.property}: ${f.presence.imageConcealment.value} !important"} hidden={false}` : `${f.attrs.fallbackDelay}={${f.props.delay.name}} ${f.attrs.fallbackStatus}="${avatarRecipe.initialStatus}" hidden={${avatarFallbackHidden(f.props.delay.name, '(rest.hidden === "" || Boolean(rest.hidden))')}}`} {@attach attachPart} {@attach attachRef}${image ? " />" : `>\n  {@render children?.()}\n</${facts.defaultElement}>`}
`;
}
