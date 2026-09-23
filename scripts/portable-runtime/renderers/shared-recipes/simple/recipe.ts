/** Command-only recipes. No accepted-model cell or proposal channel is allocated. */
export type Target = "react" | "vue" | "svelte";
export type Expr = { input: string } | { object: Record<string, Expr> };
export interface CommandRecipe {
  component: string;
  rootName?: string;
  tag: string;
  element: string;
  native: string;
  factory: string;
  runtime: string;
  types?: string[];
  props: { name: string; type: string; default?: string; attribute?: string }[];
  constructor: Record<string, Expr>;
  enabledBy?: string;
  /** Ordered live groups, each emitted as one framework observer. */
  commands: { observe: string[]; method: string; args: Expr[] }[];
  /** SSR seeds for attributes that Runtime owns after connection. */
  initialInputs?: string[];
  attributes: { name: string; expression: string }[];
}
const input = (name: string): Expr => ({ input: name });
const object = (names: string[]): Expr => ({
  object: Object.fromEntries(names.map((n) => [n, input(n)])),
});
export const button: CommandRecipe = {
  component: "Button",
  tag: "button",
  element: "HTMLButtonElement",
  native: "HTMLButtonAttributes",
  factory: "createButton",
  runtime: "button",
  props: [
    { name: "disabled", type: "boolean", default: "false" },
    { name: "focusableWhenDisabled", type: "boolean", default: "false" },
    { name: "type", type: '"button" | "submit" | "reset"', default: '"button"' },
  ],
  constructor: { disabled: input("disabled") },
  enabledBy: "focusableWhenDisabled",
  commands: [{ observe: ["disabled"], method: "setDisabled", args: [input("disabled")] }],
  attributes: [
    { name: "data-sw-button", expression: '""' },
    { name: "type", expression: "type" },
    {
      name: "data-focusable-when-disabled",
      expression: 'focusableWhenDisabled ? "true" : undefined',
    },
    { name: "data-disabled", expression: 'disabled ? "" : undefined' },
    { name: "aria-disabled", expression: 'disabled && focusableWhenDisabled ? "true" : undefined' },
    { name: "disabled", expression: "disabled && !focusableWhenDisabled" },
  ],
};
export const fieldset: CommandRecipe = {
  component: "Fieldset",
  tag: "fieldset",
  element: "HTMLFieldSetElement",
  native: "HTMLFieldsetAttributes",
  factory: "createFieldset",
  runtime: "fieldset",
  props: [{ name: "disabled", type: "boolean", default: "false" }],
  initialInputs: ["disabled"],
  constructor: { disabled: input("disabled") },
  commands: [{ observe: ["disabled"], method: "setDisabled", args: [input("disabled")] }],
  attributes: [
    { name: "data-sw-fieldset", expression: '""' },
    { name: "disabled", expression: "disabled" },
    { name: "data-disabled", expression: 'disabled ? "" : undefined' },
  ],
};
export const progress: CommandRecipe = {
  component: "Progress",
  tag: "div",
  element: "HTMLDivElement",
  native: "HTMLAttributes<HTMLDivElement>",
  factory: "createProgress",
  runtime: "progress",
  types: ["ProgressValue"],
  props: [
    { name: "value", type: "ProgressValue", default: "null" },
    { name: "min", type: "number", default: "0" },
    { name: "max", type: "number", default: "100" },
    { name: "format", type: "Intl.NumberFormatOptions" },
    { name: "locale", type: "Intl.LocalesArgument" },
    {
      name: "getAriaValueText",
      type: "(formattedValue: string | null, value: ProgressValue) => string",
    },
    { name: "ariaValueText", attribute: "aria-valuetext", type: "string" },
  ],
  constructor: Object.fromEntries(
    ["value", "min", "max", "format", "locale", "getAriaValueText", "ariaValueText"].map((n) => [
      n,
      input(n),
    ]),
  ),
  commands: [
    {
      observe: ["ariaValueText", "format", "locale", "getAriaValueText"],
      method: "setFormatOptions",
      args: [object(["ariaValueText", "format", "locale", "getAriaValueText"])],
    },
    {
      observe: ["value", "min", "max"],
      method: "setValue",
      args: [input("value"), object(["min", "max"])],
    },
  ],
  attributes: [
    { name: "data-sw-progress", expression: '""' },
    { name: "data-value", expression: "value == null ? undefined : value" },
    { name: "data-min", expression: "min" },
    { name: "data-max", expression: "max" },
    { name: "data-indeterminate", expression: 'value == null ? "" : undefined' },
    { name: "role", expression: '"progressbar"' },
    { name: "aria-valuetext", expression: "ariaValueText" },
  ],
};
export const recipes = { button, fieldset, progress };
