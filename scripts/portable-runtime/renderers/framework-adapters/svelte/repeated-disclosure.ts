import { renderAccordionRoot as renderSharedAccordionRoot } from "../../shared-recipes/structured/accordion-root.js";
import {
  accordionDisabled,
  accordionPartPolicy,
  partAttributes,
} from "../../shared-recipes/structured/part-policy.js";
import type {
  AdapterComponentFile,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
  AdapterRepeatedDisclosureFacts,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

type RepeatedDisclosureHelperFamily = {
  facts: AdapterRepeatedDisclosureFacts;
  kind: "repeated-disclosure";
  role: "item-context";
};

export function projectSvelteRepeatedDisclosureOutput(
  model: AdapterOutputModel,
): AdapterOutputModel {
  const family = model.files
    .map((file) =>
      file.kind === "component"
        ? file.component.family
        : file.kind === "index"
          ? file.family
          : undefined,
    )
    .find((candidate) => candidate?.kind === "repeated-disclosure");
  if (family?.kind !== "repeated-disclosure") return model;

  const facts = family.facts;
  const contextName = `${facts.displayName}ItemContext`;
  const helper: AdapterHelperFile = {
    body: { code: "" },
    family: { facts, kind: "repeated-disclosure", role: "item-context" } as never,
    imports: [],
    kind: "helper",
    name: contextName,
    path: `${facts.exports.namespace.toLowerCase()}/${contextName}.ts`,
    target: "svelte",
  };
  return { files: [...model.files, helper] };
}

export function printSvelteRepeatedDisclosureComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "repeated-disclosure") {
    throw new TypeError(
      "Svelte repeated-disclosure projection requires repeated-disclosure facts.",
    );
  }
  switch (family.part) {
    case "root":
      return printRoot(file, family.facts);
    case "item":
      return printItem(file, family.facts);
    case "header":
      return printSimplePart(file, family.facts, "header");
    case "trigger":
      return printContextPart(file, family.facts, "trigger");
    case "panel":
      return printContextPart(file, family.facts, "panel");
  }
}

export function printSvelteRepeatedDisclosureIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "repeated-disclosure") {
    throw new TypeError("Svelte repeated-disclosure index requires repeated-disclosure facts.");
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
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
    path: file.path,
  };
}

export function printSvelteRepeatedDisclosureHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const family = file.family as unknown as RepeatedDisclosureHelperFamily | undefined;
  if (family?.kind !== "repeated-disclosure" || family.role !== "item-context") {
    throw new TypeError("Svelte repeated-disclosure helper requires item-context family facts.");
  }
  const { facts } = family;
  const context = `${facts.displayName}ItemContext`;
  return {
    contents: `import { getContext, setContext } from "svelte";

export type ${context}Value = Readonly<{
  disabled: boolean;
}>;

const ${lowerFirst(context)}Key: symbol = Symbol("Starwind${facts.displayName}Item");

export function set${context}(value: ${context}Value): void {
  setContext(${lowerFirst(context)}Key, value);
}

export function get${context}(componentName: string): ${context}Value {
  const context = getContext<${context}Value | undefined>(${lowerFirst(context)}Key);
  if (!context) throw new Error(\`${"${componentName}"} must be used within ${facts.exports.item}.\`);
  return context;
}
`,
    path: file.path,
  };
}

function printRoot(
  file: AdapterComponentFile,
  _facts: AdapterRepeatedDisclosureFacts,
): AdapterPrintedFile {
  return { path: `${file.path}.svelte`, contents: renderSharedAccordionRoot("svelte") };
}

function printItem(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
): AdapterPrintedFile {
  const part = facts.parts.item;
  const context = `${facts.displayName}ItemContext`;
  return {
    contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { set${context}, type ${context}Value } from "./${context}";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ${facts.props.itemValue.name}?: ${facts.props.itemValue.type};
    ${facts.props.disabled.name}?: ${facts.props.disabled.type};
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, ${facts.props.itemValue.name}, ${facts.props.disabled.name} = false, ref, ...rest }: Props = $props();
  const context: ${context}Value = {
    get disabled() { return ${facts.props.disabled.name}; },
  };
  set${context}(context);
${printSvelteRefAttachment("HTMLDivElement")}
</script>

<${part.defaultElement}
  {...rest}
  ${facts.attrs.item}=""
  data-sw-part="${part.name}"
  ${partAttributes("svelte", accordionPartPolicy(facts, "item")).replace(/\n/g, "\n  ")}
  {@attach attachRef}
>
  {@render children?.()}
</${part.defaultElement}>
`,
    path: `${file.path}.svelte`,
  };
}

function printSimplePart(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
  partName: "header",
): AdapterPrintedFile {
  const part = facts.parts[partName];
  return {
    contents: printPartShell({
      imports: "",
      elementType: "HTMLElement",
      htmlType: "HTMLAttributes<HTMLElement>",
      part,
      bodyAttributes: `${facts.attrs.header}=""`,
    }),
    path: `${file.path}.svelte`,
  };
}

function printContextPart(
  file: AdapterComponentFile,
  facts: AdapterRepeatedDisclosureFacts,
  partName: "trigger" | "panel",
): AdapterPrintedFile {
  const part = facts.parts[partName];
  const context = `${facts.displayName}ItemContext`;
  const isTrigger = partName === "trigger";
  if (isTrigger)
    return {
      contents: `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { get${context} } from "./${context}";

  type Props = Omit<HTMLButtonAttributes, "children" | "type"> & { children?: Snippet; ref?: (element: HTMLButtonElement | null) => void };
  let { children, disabled = false, ref, ...rest }: Props = $props();
  const item = get${context}("${facts.exports.trigger}");
${printSvelteRefAttachment("HTMLButtonElement")}
</script>

<button
  {...rest}
  ${partAttributes("svelte", accordionPartPolicy(facts, "trigger"))}
  data-sw-part="${part.name}"
  disabled={${accordionDisabled("item.disabled", "disabled", 'rest["aria-disabled"]')}}
  {@attach attachRef}
>
  {@render children?.()}
</button>
`,
      path: `${file.path}.svelte`,
    };
  return {
    contents: printPartShell({
      imports: "",
      elementType: isTrigger ? "HTMLButtonElement" : "HTMLDivElement",
      htmlType: isTrigger ? "HTMLButtonAttributes" : "HTMLAttributes<HTMLDivElement>",
      part,
      bodyAttributes: `${partAttributes("svelte", accordionPartPolicy(facts, "panel"))}\n  style:animation=${JSON.stringify(accordionPartPolicy(facts, "panel").initialAnimation)}`,
    }),
    path: `${file.path}.svelte`,
  };
}

function printPartShell({
  imports,
  init = "",
  elementType,
  htmlType,
  part,
  bodyAttributes,
}: {
  imports: string;
  init?: string;
  elementType: string;
  htmlType: string;
  part: AdapterRepeatedDisclosureFacts["parts"][keyof AdapterRepeatedDisclosureFacts["parts"]];
  bodyAttributes: string;
}): string {
  const elementImport =
    htmlType === "HTMLButtonAttributes" ? "HTMLButtonAttributes" : "HTMLAttributes";
  return `<!-- ${NON_SHIPPING_COMMENT} -->
<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ${elementImport} } from "svelte/elements";
${imports ? `  ${imports}\n` : ""}
  type Props = Omit<${htmlType}, "children"> & { children?: Snippet; ref?: (element: ${elementType} | null) => void };
  let { children, ref, ...rest }: Props = $props();
${init ? `  ${init}\n` : ""}
${printSvelteRefAttachment(elementType)}
</script>

<${part.defaultElement}
  {...rest}
  ${bodyAttributes}
  data-sw-part="${part.name}"
  {@attach attachRef}
>
  {@render children?.()}
</${part.defaultElement}>
`;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
