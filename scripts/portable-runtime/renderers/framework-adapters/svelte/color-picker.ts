import type {
  AdapterComponentFile,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
} from "../types.js";
import { printColorPickerContext } from "./color-picker/context.js";
import { printColorPickerPart } from "./color-picker/parts.js";
import { printColorPickerRoot } from "./color-picker/root.js";

export function projectSvelteColorPickerOutput(model: AdapterOutputModel): AdapterOutputModel {
  if (!model.files.some((file) => file.kind === "index" && file.family?.kind === "color-picker"))
    return model;
  return {
    files: [
      ...model.files,
      {
        kind: "helper",
        name: "SvelteColorPickerContext",
        path: "color-picker/context.ts",
        target: "svelte",
        imports: [],
        body: { code: printColorPickerContext() },
      },
    ],
  };
}
export function printSvelteColorPickerHelper(file: AdapterHelperFile): AdapterPrintedFile {
  if (
    file.name !== "SvelteColorPickerContext" ||
    file.path !== "color-picker/context.ts" ||
    file.target !== "svelte"
  )
    throw new TypeError("Svelte Color Picker requires its target-local context helper.");
  return { path: file.path, contents: file.body.code };
}
export function printSvelteColorPickerComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "color-picker")
    throw new TypeError("Svelte Color Picker requires specialized Color Picker facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root"
        ? printColorPickerRoot(family.facts)
        : printColorPickerPart(family.facts, family.part),
  };
}
export function printSvelteColorPickerIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const family = file.family;
  if (family?.kind !== "color-picker")
    throw new TypeError("Svelte Color Picker index requires specialized Color Picker facts.");
  const { facts } = family;
  const names = Object.values(facts.exports.parts);
  return {
    path: file.path,
    contents: `${names.map((name) => `import ${name} from "./${name}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${Object.entries(facts.parts)
      .map(
        ([key, part]) =>
          `${part.namespaceKey}: ${facts.exports.parts[key as keyof typeof facts.exports.parts]}`,
      )
      .join(", ")} };
export { ${facts.exports.namespace}, ${names.join(", ")} };
export default ${facts.exports.namespace};
`,
  };
}
