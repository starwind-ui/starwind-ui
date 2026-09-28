import { renderSimpleRoot } from "../../shared-recipes/simple/frame.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";

const NON_SHIPPING_COMMENT = "Svelte 5 public beta adapter output.";

export function printSvelteActionSurfaceComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (file.component.family?.kind !== "action-surface")
    throw new TypeError("Expected action surface facts.");
  return {
    path: file.path + ".svelte",
    contents: renderSimpleRoot("svelte", "button", file.component.family.facts),
  };
}

export function printSvelteActionSurfaceIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "action-surface") {
    throw new TypeError("Svelte action-surface index requires action-surface family facts.");
  }
  const { facts } = family;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.svelte";`)
    .join("\n");
  const members = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const names = facts.index.importMembers.map((member) => member.name).join(", ");
  return {
    contents: `${imports}

const ${facts.exports.namespace} = {
${members}
};

export { ${facts.exports.namespace}, ${names} };
export default ${facts.exports.namespace};
export type { ButtonChildProps, ButtonChildPayload } from "./${facts.exports.root}.svelte";
`,
    path: file.path,
  };
}
