import type {
  AdapterComponentFile,
  AdapterEngineViewportFacts,
  AdapterEngineViewportPartName,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteEngineViewportIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "engine-viewport") {
    throw new TypeError("Svelte engine-viewport index requires engine-viewport facts.");
  }
  const { facts } = family;
  const imports = facts.index.importMembers
    .map(({ from, name }) => `import ${name} from "${from}.svelte";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map(({ key, name }) => `  ${key}: ${name},`)
    .join("\n");
  const exports = facts.index.importMembers.map(({ name }) => name).join(",\n  ");
  return {
    contents: `// ${NON_SHIPPING_COMMENT}

${imports}

const ${facts.exports.namespace} = {
${members}
};

export {
  ${facts.exports.namespace},
  ${exports},
};

export default ${facts.exports.namespace};

export type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";
export { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";
`,
    path: file.path,
  };
}

export function printSvelteEngineViewportComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "engine-viewport") {
    throw new TypeError("Svelte engine-viewport projection requires engine-viewport facts.");
  }
  const contents =
    family.part === "root"
      ? printRoot(family.facts)
      : family.part === "item"
        ? printItem(family.facts)
        : family.part === "previous" || family.part === "next"
          ? printControl(family.facts, family.part)
          : printSimplePart(family.facts, family.part);
  return { contents, path: `${file.path}.svelte` };
}

function printRoot(facts: AdapterEngineViewportFacts): string {
  const props = facts.options;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { ${facts.runtime.factory}, type ${facts.runtime.instanceType}, type ${facts.runtime.optionsType} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${props.orientation.name}?: ${props.orientation.type};
    ${props.opts.name}?: ${props.opts.type};
    ${props.plugins.name}?: ${props.plugins.type};
    ${props.setApi.name}?: ${props.setApi.type};
    ref?: (element: HTMLDivElement | null) => void;
  };

  let { children, ${props.orientation.name} = ${props.orientation.defaultValue}, ${props.opts.name} = ${props.opts.defaultValue}, ${props.plugins.name}, ${props.setApi.name}, ref, ...rest }: Props = $props();

  function currentOptions(): ${facts.runtime.optionsType}["opts"] {
    return {
      axis: ${props.orientation.name} === "vertical" ? "${props.orientation.axisMap.vertical}" : "${props.orientation.axisMap.horizontal}",
      ...${props.opts.name},
    };
  }

  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    const instance: ${facts.runtime.instanceType} = untrack(() => ${facts.runtime.factory}(root, {
      ${props.orientation.name},
      ${props.opts.name},
      ${props.plugins.name},
      ${props.setApi.name}: (api) => ${props.setApi.name}?.(api),
    }));
    let initialOptions = true;
    let initialCallback = true;
    $effect(() => {
      const options = currentOptions();
      const nextPlugins = ${props.plugins.name};
      if (initialOptions) {
        initialOptions = false;
        return;
      }
      instance.reInit(options, nextPlugins);
    });
    $effect(() => {
      const callback = ${props.setApi.name};
      if (initialCallback) {
        initialCallback = false;
        return;
      }
      callback?.(instance.api);
    });
    return () => instance.destroy();
  };
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${facts.parts.root.defaultElement}
  {...rest}
  ${facts.attrs.root}=""
  ${facts.attrs.role}="${facts.semantics.rootRole}"
  ${facts.attrs.roledescription}="${facts.semantics.rootRoledescription}"
  ${facts.attrs.autoInit}="${props.autoInit.falseValue}"
  ${facts.attrs.axis}={${props.orientation.name} === "vertical" ? "${props.orientation.axisMap.vertical}" : "${props.orientation.axisMap.horizontal}"}
  ${facts.attrs.opts}={JSON.stringify(${props.opts.name})}
  data-sw-part="${facts.parts.root.name}"
  {@attach attachRuntime}
  {@attach attachRef}
>
  {@render children?.()}
</${facts.parts.root.defaultElement}>
`;
}

function printItem(facts: AdapterEngineViewportFacts): string {
  return printPart(
    facts,
    "item",
    `${facts.attrs.item}=""\n  ${facts.attrs.itemRole}="${facts.semantics.itemRole}"\n  ${facts.attrs.itemRoledescription}="${facts.semantics.itemRoledescription}"`,
  );
}

function printControl(facts: AdapterEngineViewportFacts, partName: "next" | "previous"): string {
  const control = facts.controls[partName];
  return printPart(
    facts,
    partName,
    `${facts.attrs[partName]}=""\n  ${control.typeAttribute}="${control.typeValue}"`,
  );
}

function printSimplePart(
  facts: AdapterEngineViewportFacts,
  partName: Exclude<AdapterEngineViewportPartName, "item" | "next" | "previous" | "root">,
): string {
  return printPart(facts, partName, `${facts.attrs[partName]}=""`);
}

function printPart(
  facts: AdapterEngineViewportFacts,
  partName: Exclude<AdapterEngineViewportPartName, "root">,
  attributes: string,
): string {
  const part = facts.parts[partName];
  const isButton = part.defaultElement === "button";
  const elementType = isButton ? "HTMLButtonElement" : "HTMLDivElement";
  const htmlType = isButton ? "HTMLButtonAttributes" : "HTMLAttributes<HTMLDivElement>";
  const htmlImport = isButton ? "HTMLButtonAttributes" : "HTMLAttributes";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${htmlImport} } from "svelte/elements";

  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
  const attachRef: Attachment<${elementType}> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${part.defaultElement} {...rest} ${attributes} data-sw-part="${part.name}" {@attach attachRef}>
  {@render children?.()}
</${part.defaultElement}>
`;
}
