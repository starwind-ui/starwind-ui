import type {
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterNotificationSystemFacts,
  AdapterNotificationSystemPartName,
  AdapterPrintedFile,
} from "../types.js";

const NON_SHIPPING_COMMENT =
  "Internal non-shipping Svelte proof output. Do not publish, expose through the CLI registry, claim in public docs, or copy into public demo dependencies.";

export function printSvelteNotificationSystemComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "notification-system") {
    throw new TypeError(
      "Svelte notification-system projection requires notification-system facts.",
    );
  }
  const contents =
    family.part === "viewport"
      ? printViewport(family.facts)
      : family.part === "template"
        ? printTemplate(family.facts)
        : family.part === "root"
          ? printRoot(family.facts)
          : family.part === "action" || family.part === "close"
            ? printButton(family.facts, family.part)
            : printSimplePart(family.facts, family.part);
  return { contents, path: `${file.path}.svelte` };
}

export function printSvelteNotificationSystemIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "notification-system") {
    throw new TypeError("Svelte notification-system index requires notification-system facts.");
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

function printViewport(facts: AdapterNotificationSystemFacts): string {
  const options = facts.viewportOptions;
  const semantics = facts.viewportSemantics;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Position = ${options.position.type};
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${options.duration.name}?: ${options.duration.type};
    ${options.gap.name}?: ${options.gap.type};
    ${options.limit.name}?: ${options.limit.type};
    ${options.peek.name}?: ${options.peek.type};
    ${options.position.name}?: Position;
    ref?: (element: HTMLDivElement | null) => void;
  };

  let { children, ${options.duration.name} = ${options.duration.defaultValue}, ${options.gap.name} = ${options.gap.defaultValue}, ${options.limit.name} = ${options.limit.defaultValue}, ${options.peek.name} = ${options.peek.defaultValue}, ${options.position.name} = ${options.position.defaultValue}, ref, ...rest }: Props = $props();

  const attachRuntime: Attachment<HTMLDivElement> = (viewport) => {
    const manager = ${facts.runtime.factory}(viewport);
    return () => manager.${facts.runtime.destroyMethod}();
  };
  const attachRef: Attachment<HTMLDivElement> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${facts.parts.viewport.defaultElement}
  role="${semantics.role}"
  ${semantics.ariaLiveAttribute}="${semantics.ariaLiveValue}"
  ${semantics.ariaAtomicAttribute}="${semantics.ariaAtomicValue}"
  ${semantics.ariaRelevantAttribute}="${semantics.ariaRelevantValue}"
  ${semantics.ariaLabelAttribute}="${semantics.ariaLabelValue}"
  tabindex="${semantics.tabIndexValue}"
  {...rest}
  ${facts.attrs.viewport}=""
  ${options.position.attribute}={${options.position.name}}
  ${options.limit.attribute}={${options.limit.name}}
  ${options.duration.attribute}={${options.duration.name}}
  style:${options.gap.cssVariable}={${options.gap.name}}
  style:${options.peek.cssVariable}={${options.peek.name}}
  {@attach attachRuntime}
  {@attach attachRef}
>
  {@render children?.()}
</${facts.parts.viewport.defaultElement}>
`;
}

function printTemplate(facts: AdapterNotificationSystemFacts): string {
  const variant = facts.template.variant;
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";

  type Variant = ${variant.type};
  type Props = Omit<HTMLAttributes<HTMLTemplateElement>, "children"> & {
    children?: Snippet;
    ${variant.name}?: Variant;
    ref?: (element: HTMLTemplateElement | null) => void;
  };
  let { children, ${variant.name} = ${variant.defaultValue}, ref, ...rest }: Props = $props();
  const sourceAttributes = rest as unknown as HTMLAttributes<HTMLDivElement>;
  let sourceElement = $state<HTMLDivElement>();
  let templateElement = $state<HTMLTemplateElement>();
  const attachTemplate: Attachment<HTMLDivElement> = (source) => {
    const template = document.createElement("template");
    template.content.replaceChildren(...Array.from(source.childNodes));
    source.before(template);
    sourceElement = source;
    templateElement = template;
    return () => {
      sourceElement = undefined;
      templateElement = undefined;
      template.remove();
    };
  };
  $effect(() => {
    const source = sourceElement;
    const template = templateElement;
    const currentVariant = ${variant.name};
    const forwardedAttributes = Object.entries(rest);
    if (!source || !template) return;
    void forwardedAttributes;
    const nextAttributes = new Map(
      Array.from(source.attributes)
        .filter(
          (attribute) =>
            !["aria-hidden", "data-sw-toast-template-source", "hidden"].includes(attribute.name),
        )
        .map((attribute) => [attribute.name, attribute.value]),
    );
    for (const attribute of Array.from(template.attributes)) {
      if (attribute.name !== "${facts.attrs.template}" && !nextAttributes.has(attribute.name)) {
        template.removeAttribute(attribute.name);
      }
    }
    for (const [name, value] of nextAttributes) template.setAttribute(name, value);
    template.setAttribute("${facts.attrs.template}", currentVariant);
  });
  $effect(() => {
    const callback = ref;
    const template = templateElement;
    if (!callback || !template) return;
    untrack(() => callback(template));
    return () => callback(null);
  });
</script>

<div
  {...sourceAttributes}
  hidden
  aria-hidden="true"
  data-sw-toast-template-source=""
  data-variant={${variant.name}}
  {@attach attachTemplate}
>
  {@render children?.()}
</div>
`;
}

function printRoot(facts: AdapterNotificationSystemFacts): string {
  const state = facts.rootState;
  const variant = facts.template.variant;
  return printPart(
    facts,
    "root",
    `role="${state.role}"\n  ${state.ariaModalAttribute}="${state.ariaModalValue}"\n  {...rest}\n  ${facts.attrs.root}=""\n  ${state.stateAttribute}="${state.stateOpenValue}"\n  ${state.variantAttribute}={${variant.name}}`,
    `type Variant = ${variant.type};`,
    `${variant.name}?: Variant;`,
    `${variant.name} = ${variant.defaultValue},`,
  );
}

function printSimplePart(
  facts: AdapterNotificationSystemFacts,
  part: Exclude<
    AdapterNotificationSystemPartName,
    "action" | "close" | "root" | "template" | "viewport"
  >,
): string {
  return printPart(facts, part, `{...rest}\n  ${facts.attrs[part]}=""`);
}

function printButton(facts: AdapterNotificationSystemFacts, part: "action" | "close"): string {
  const defaults =
    part === "close"
      ? `${facts.actions.close.ariaLabelAttribute}="${facts.actions.close.ariaLabelValue}"\n  `
      : "";
  const action = facts.actions[part];
  return printPart(
    facts,
    part,
    `${defaults}{...rest}\n  ${action.typeAttribute}="${action.typeValue}"\n  ${facts.attrs[part]}=""`,
  );
}

function printPart(
  facts: AdapterNotificationSystemFacts,
  part: Exclude<AdapterNotificationSystemPartName, "template" | "viewport">,
  attributes: string,
  extraTypes = "",
  extraProps = "",
  extraDestructure = "",
): string {
  const element = facts.parts[part].defaultElement;
  const button = element === "button";
  const elementType = button
    ? "HTMLButtonElement"
    : element === "span"
      ? "HTMLSpanElement"
      : "HTMLDivElement";
  const htmlType = button ? "HTMLButtonAttributes" : `HTMLAttributes<${elementType}>`;
  const htmlImport = button ? "HTMLButtonAttributes" : "HTMLAttributes";
  const typeDeclaration = extraTypes ? `  ${extraTypes}\n` : "";
  const propDeclaration = extraProps ? `    ${extraProps}\n` : "";
  const destructuredProps = extraDestructure ? ` ${extraDestructure}` : " ";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${htmlImport} } from "svelte/elements";

${typeDeclaration}  type Props = Omit<${htmlType}, "children"> & {
    children?: Snippet;
${propDeclaration}    ref?: (element: ${elementType} | null) => void;
  };
  let { children,${destructuredProps}ref, ...rest }: Props = $props();
  const attachRef: Attachment<${elementType}> = (element) => {
    const callback = ref;
    untrack(() => callback?.(element));
    return () => callback?.(null);
  };
</script>

<${element} ${attributes} {@attach attachRef}>
  {@render children?.()}
</${element}>
`;
}
