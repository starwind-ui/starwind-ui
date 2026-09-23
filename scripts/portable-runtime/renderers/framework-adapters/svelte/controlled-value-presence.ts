import { renderTabs as renderRecipeTabs } from "../../shared-recipes/selection/tabs.js";
import type {
  AdapterComponentFile,
  AdapterControlledValuePresenceFacts,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

const HEADER = "Svelte 5 public beta adapter output.";
export function projectSvelteControlledValuePresenceOutput(
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
    .find((family) => family?.kind === "controlled-value-presence");
  if (family?.kind !== "controlled-value-presence") return model;
  const helper: AdapterHelperFile = {
    kind: "helper",
    name: family.facts.context.componentName,
    path: `${family.facts.exports.namespace.toLowerCase()}/${family.facts.context.componentName}.ts`,
    target: "svelte",
    body: { code: "" },
    imports: [],
    family,
  };
  return { files: [...model.files, helper] };
}
export function printSvelteControlledValuePresenceIndex(
  file: AdapterIndexFile,
): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "controlled-value-presence")
    throw new TypeError("Svelte controlled-value-presence index requires matching facts.");
  const { facts } = family;
  return {
    path: file.path,
    contents: `// ${HEADER}\n${facts.index.importMembers.map(({ from, name }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { ${[facts.exports.namespace, ...facts.index.importMembers.map(({ name }) => name)].join(", ")} };
export default ${facts.exports.namespace};
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}
export function printSvelteControlledValuePresenceHelper(
  file: AdapterHelperFile,
): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "controlled-value-presence")
    throw new TypeError("Svelte controlled-value-presence helper requires matching facts.");
  const { facts } = family;
  return {
    path: file.path,
    contents: `// ${HEADER}
import {getContext,setContext} from "svelte";
import type {${facts.state.type},${facts.props.orientation.type}} from "${facts.runtime.importSource}";
export type ${facts.context.typeName} = Readonly<{
 value: ${facts.state.type};
 orientation: ${facts.props.orientation.type};
 refresh(): void;
}>;
const key: symbol = Symbol("Starwind${facts.displayName}");
export function getOptional${facts.context.componentName}(): ${facts.context.typeName} | undefined {return getContext<${facts.context.typeName} | undefined>(key);}
export function get${facts.context.componentName}(name: string): ${facts.context.typeName} {const context=getOptional${facts.context.componentName}();if(!context)throw new Error(\`\${name} must be used within ${facts.exports.root}.\`);return context;}
export function set${facts.context.componentName}(context: ${facts.context.typeName}): void {setContext(key,context);}
`,
  };
}
export function printSvelteControlledValuePresenceComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "controlled-value-presence") throw new Error("Expected Tabs family");
  return {
    path: file.path + ".svelte",
    contents: renderRecipeTabs("svelte", family.part, family.facts),
  };
}
