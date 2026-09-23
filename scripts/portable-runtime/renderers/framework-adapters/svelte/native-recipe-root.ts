import type { NativeRootProjection } from "../../shared-recipes/structured/native-frame-types.js";

/** Native overlay svelte projection. Portal transport is a named target exception. */
export const svelteNativeRootProjection: NativeRootProjection = {
  surfaceOperations: { "activate-placement": "", "connect-controller": "connectRuntime(root);" },
  readProp: (name) => name,
  initialCell: (expression) => `untrack(() => ${expression})`,
  attribute: (name, value) => (value === undefined ? `${name}=""` : `${name}={${value}}`),
  destructure: (props) =>
    props
      .map((prop) =>
        prop.name === "open"
          ? "open = $bindable()"
          : `${prop.name}${prop.defaultValue && prop.name !== "defaultOpen" ? ` = ${prop.defaultValue}` : ""}`,
      )
      .join(", "),
  runtimeImports: (component, portal) =>
    portal ? ", createPortalBinding, readyPortalBindingSnapshot" : "",
  printRoot({
    component,
    plan,
    portal,
    popup,
    props,
    fields,
    destructure,
    callbacks,
    imports,
    initial,
    accepted,
    controller,
    refresh,
    lifecycle,
    attributes,
    modelObserver,
    surfaceConnection,
  }) {
    return `<script module lang="ts">
import { getContext } from "svelte";
type DialogButtonContext = { readonly open: boolean; requestRefresh(): void; ${portal ? "readonly mounted: boolean; registerPortal(owner: symbol, element: HTMLElement | null, authoredParent?: HTMLElement, prepare?: () => () => void): void;" : ""} };
const dialogButtonContext = Symbol("Dialog button context");
export function getDialogButtonContext(): DialogButtonContext | undefined { return getContext(dialogButtonContext); }
${component === "AlertDialog" ? "export function getAlertDialogControlRefresh() { return getDialogButtonContext()?.requestRefresh; }" : ""}
</script>
<script lang="ts">
${imports}
import { setContext, untrack, type Snippet } from "svelte";
import type { Attachment } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";
import { createRefAttachment } from "../_internal/ref-attachment.js";
${portal ? 'import { discoverOverlayCaptures } from "../_internal/overlay-capture.js";' : ""}
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { children?: Snippet<[boolean]>; ${fields}\n${callbacks}\nref?: (element: HTMLDivElement | null) => void; };
let { children, ${destructure}, onOpenChange, onCloseComplete, ref, ...rest }: Props = $props();
${initial}
${accepted}
${controller}
${refresh}
${lifecycle}
${
  portal
    ? `let mounted = $state(false);
const portals = new Map<symbol, { wrapper: HTMLElement; authoredParent: HTMLElement; prepare?: () => () => void }>();
let scanParts: (() => void) | undefined;
let binding: ReturnType<typeof createPortalBinding> | undefined;
let bindingRoot: HTMLDivElement | undefined;`
    : ""
}
setContext<DialogButtonContext>(dialogButtonContext, {
get open() { return renderedOpen; }, requestRefresh() { untrack(refreshControls); },
${
  portal
    ? `get mounted() { return mounted; },
registerPortal(owner, element, authoredParent, prepare) {
if (element && authoredParent) portals.set(owner, { wrapper: element, authoredParent, prepare }); else portals.delete(owner);
if (binding && bindingRoot) binding.publish(readyPortalBindingSnapshot(bindingRoot, [...portals.values()]));
scanParts?.();
},`
    : ""
}
});
const attachRuntime: Attachment<HTMLDivElement> = root => {
${
  portal
    ? `bindingRoot = root;
binding = createPortalBinding(root);
binding.publish(readyPortalBindingSnapshot(root, [...portals.values()]));
mounted = true;
let captures = $state.raw<HTMLElement[]>([]);
const scan = () => {
const next = discoverOverlayCaptures(root, portals.values(), captures, ${JSON.stringify(plan.surface.captures.map((attr) => `[${attr}]`).join(", "))}, "[data-sw-alert-dialog-portal], [data-sw-drawer-portal]", "[data-sw-dialog], [data-sw-alert-dialog], [data-sw-drawer]");
if (next) captures = next;
};
scanParts = () => untrack(scan);
untrack(scan);`
    : ""
}
$effect(() => {
void [${plan.constructorInputs.join(", ")}];
${
  portal
    ? `const popup = captures.find(part => part.matches("[${popup}]"));
if (!popup?.isConnected) return;`
    : ""
}
untrack(() => {
${
  portal
    ? `const restorers = [...portals.values()].map(({ prepare }) => prepare?.());
try { ${surfaceConnection} } finally { for (const restore of restorers.reverse()) restore?.(); }`
    : surfaceConnection
}
});
return disconnectRuntime;
});
${modelObserver}
${portal ? "return () => { mounted = false; scanParts = undefined; binding?.destroy(); binding = undefined; bindingRoot = undefined; };" : ""}
};
const attachRef = createRefAttachment<HTMLDivElement>(() => ref);
</script>
<div {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>{@render children?.(renderedOpen)}</div>
`;
  },
};
