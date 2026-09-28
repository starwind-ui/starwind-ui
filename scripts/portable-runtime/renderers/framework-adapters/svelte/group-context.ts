import type { AdapterHelperFile, AdapterOutputModel, AdapterPrintedFile } from "../types.js";

type GroupContextKind = "checkbox" | "radio";
type GroupContextFamily = { kind: "svelte-group-context"; role: GroupContextKind };

export function projectSvelteGroupContextOutput(model: AdapterOutputModel): AdapterOutputModel {
  const helpers: AdapterHelperFile[] = [];
  if (model.files.some((file) => /^(checkbox|checkbox-group)\//.test(file.path))) {
    helpers.push(makeHelper("checkbox"));
  }
  if (model.files.some((file) => /^(radio|radio-group)\//.test(file.path))) {
    helpers.push(makeHelper("radio"));
  }
  return helpers.length ? { files: [...model.files, ...helpers] } : model;
}

export function printSvelteGroupContextHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const family = file.family as GroupContextFamily | undefined;
  if (family?.kind !== "svelte-group-context") {
    throw new TypeError("Svelte group context helper requires matching family metadata.");
  }
  return {
    path: file.path,
    contents:
      family.role === "checkbox"
        ? `export type CheckboxGroupContextValue = Readonly<{
  disabled: boolean;
  value: readonly string[];
}>;

export const CheckboxGroupContext: symbol = Symbol("Starwind Checkbox group context");
`
        : `export type RadioGroupContextValue = Readonly<{
  value: string | undefined;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  form: string | undefined;
  name: string | undefined;
}>;

export const RadioGroupContext = Symbol("Starwind Radio Group");
`,
  };
}

function makeHelper(role: GroupContextKind): AdapterHelperFile {
  const name = role === "checkbox" ? "CheckboxGroupContext" : "RadioGroupContext";
  return {
    body: { code: "" },
    family: { kind: "svelte-group-context", role } as never,
    imports: [],
    kind: "helper",
    name,
    path: `${role}/${name}.svelte.ts`,
    target: "svelte",
  };
}
