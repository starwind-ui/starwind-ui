import type { StyledOutputNativeModel } from "../../styled-output-model/index.js";

type NativeValuePolicy = {
  tag: "textarea" | "select";
  name: "value";
  /** The native event that reports a new value. */
  updateEvent: "input" | "change";
  /** Selection controls can hold several values, which a value property cannot express. */
  writesThrough: "value-property" | "selected-options";
  typeOmissions: readonly string[];
  declarations: readonly string[];
  declarationType?: string;
  nativeDefaults: readonly string[];
};

export const textareaValuePolicy = {
  tag: "textarea",
  name: "value",
  updateEvent: "input",
  writesThrough: "value-property",
  typeOmissions: ["value", "defaultValue", "defaultvalue"],
  declarations: ["value", "defaultValue", "defaultvalue"],
  declarationType: "string | null",
  nativeDefaults: ["defaultValue", "defaultvalue"],
} as const satisfies NativeValuePolicy;

export const nativeSelectValuePolicy = {
  tag: "select",
  name: "value",
  updateEvent: "change",
  writesThrough: "selected-options",
  typeOmissions: ["defaultValue", "defaultvalue"],
  declarations: [],
  nativeDefaults: [],
} as const satisfies NativeValuePolicy;

/** Native defaults remain browser-owned; targets choose their binding syntax. */
export function nativeValuePolicy(
  nativeModel: StyledOutputNativeModel | undefined,
): NativeValuePolicy | undefined {
  if (!nativeModel) return undefined;
  return nativeModel.tag === "textarea" ? textareaValuePolicy : nativeSelectValuePolicy;
}

/** An omitted multiple value leaves selected options and reset with the browser. */
export function nativeSelectUsesBrowserValue(multiple: string, value: string): string {
  return `${multiple} && ${value} === undefined`;
}
