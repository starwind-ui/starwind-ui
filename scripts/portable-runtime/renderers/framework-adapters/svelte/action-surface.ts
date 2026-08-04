import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteActionSurfaceComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "action-surface") {
    throw new TypeError(
      "Svelte action-surface projection requires an action-surface component model.",
    );
  }

  const { facts } = family;
  const disabled = facts.props.disabled.name;
  const focusableWhenDisabled = facts.props.focusableWhenDisabled.name;
  const type = facts.props.type.name;
  const rootElement = facts.parts.root.defaultElement;
  const elementType = getSvelteElementType(rootElement);

  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = Omit<HTMLButtonAttributes, "children" | "disabled" | "type"> & {
    children?: Snippet;
    ${disabled}?: ${facts.props.disabled.type};
    ${focusableWhenDisabled}?: ${facts.props.focusableWhenDisabled.type};
    ${type}?: HTMLButtonAttributes["type"];
  };

  let allProps: Props = $props();
  let children = $derived(allProps.children);
  let ${disabled} = $derived(allProps.${disabled} ?? false);
  let ${focusableWhenDisabled} = $derived(allProps.${focusableWhenDisabled} ?? false);
  let ${type} = $derived(allProps.${type} ?? "button");
  let nativeProps = $derived.by(() => {
    const {
      children: _children,
      ${disabled}: _disabled,
      ${focusableWhenDisabled}: _focusableWhenDisabled,
      ${type}: _type,
      ...native
    } = allProps;
    return Object.fromEntries(Object.entries(native)) as HTMLButtonAttributes;
  });
  const forwardedAttachments = untrack(() => {
    const symbolProps = allProps as Props & Record<symbol, unknown>;
    return Object.getOwnPropertySymbols(symbolProps)
      .map((key) => symbolProps[key])
      .filter((value): value is Attachment<${elementType}> => typeof value === "function");
  });

  const attachForwarded: Attachment<${elementType}> = (root) => {
    const cleanups = forwardedAttachments
      .map((attachment) => attachment(root))
      .filter((cleanup): cleanup is () => void => typeof cleanup === "function");
    return () => {
      for (let index = cleanups.length - 1; index >= 0; index -= 1) cleanups[index]?.();
    };
  };

  function createRuntimeAttachment(
    getFocusableWhenDisabled: () => boolean,
    getDisabled: () => boolean,
  ): Attachment<${elementType}> {
    return (root) => {
      if (!getFocusableWhenDisabled()) return;

      let appliedDisabled = untrack(getDisabled);
      const instance = ${facts.runtime.factory}(root, {
        ${facts.runtime.disabledSetter.prop}: appliedDisabled,
      });

      $effect(() => {
        const nextDisabled = getDisabled();
        if (nextDisabled === appliedDisabled) return;
        appliedDisabled = nextDisabled;
        instance.${facts.runtime.disabledSetter.method}(nextDisabled);
      });

      return () => instance.destroy();
    };
  }

  const attachRuntime = createRuntimeAttachment(
    () => ${focusableWhenDisabled},
    () => ${disabled},
  );
</script>

<${rootElement}
  {...nativeProps}
  ${facts.attrs.type}={${type}}
  ${facts.attrs.root}
  ${facts.attrs.focusableWhenDisabled}={${focusableWhenDisabled} ? "${facts.runtime.conditionalInit.truthyValue}" : undefined}
  ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}
  ${facts.attrs.ariaDisabled}={${disabled} && ${focusableWhenDisabled} ? "true" : undefined}
  ${facts.attrs.disabled}={${disabled} && !${focusableWhenDisabled}}
  {@attach attachForwarded}
  {@attach attachRuntime}
>
  {@render children?.()}
</${rootElement}>
`,
    path: `${file.path}.svelte`,
  };
}

export function printSvelteActionSurfaceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "action-surface") {
    throw new TypeError("Svelte action-surface index requires action-surface family facts.");
  }
  return {
    contents: `${family.facts.index.importMembers
      .map((member) => `export { default as ${member.name} } from "${member.from}.svelte";`)
      .join("\n")}\n`,
    path: file.path,
  };
}

function getSvelteElementType(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };
  return elementTypes[tagName] ?? "HTMLElement";
}
