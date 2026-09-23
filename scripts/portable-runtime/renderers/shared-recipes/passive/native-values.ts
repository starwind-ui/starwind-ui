type NativeValuePolicy = {
  part: "Textarea" | "NativeSelect";
  tag: "textarea" | "select";
  name: "value";
  typeOmissions: readonly string[];
  declarations: readonly string[];
  declarationType?: string;
  nativeDefaults: readonly string[];
};

export const textareaValuePolicy = {
  part: "Textarea",
  tag: "textarea",
  name: "value",
  typeOmissions: ["value", "defaultValue", "defaultvalue"],
  declarations: ["value", "defaultValue", "defaultvalue"],
  declarationType: "string | null",
  nativeDefaults: ["defaultValue", "defaultvalue"],
} as const satisfies NativeValuePolicy;

export const nativeSelectValuePolicy = {
  part: "NativeSelect",
  tag: "select",
  name: "value",
  typeOmissions: ["defaultValue", "defaultvalue"],
  declarations: [],
  nativeDefaults: [],
} as const satisfies NativeValuePolicy;

/** Native defaults remain browser-owned; targets choose their binding syntax. */
export function nativeValuePolicy(component: string, part?: string): NativeValuePolicy | undefined {
  const policy =
    component === "textarea"
      ? textareaValuePolicy
      : component === "native-select"
        ? nativeSelectValuePolicy
        : undefined;
  return part === undefined || policy?.part === part ? policy : undefined;
}

/** An omitted multiple value leaves selected options and reset with the browser. */
export function nativeSelectUsesBrowserValue(multiple: string, value: string): string {
  return `${multiple} && ${value} === undefined`;
}
