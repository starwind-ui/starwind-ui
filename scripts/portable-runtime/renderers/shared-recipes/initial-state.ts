/** Shared initial model precedence. Printers supply expressions and serialize the result. */
export function initialModelValue(value: string, defaultValue: string, fallback?: string): string {
  return `${value} ?? ${defaultValue}${fallback === undefined ? "" : ` ?? ${fallback}`}`;
}

/** Boolean controls have the same model/default precedence before optional group authority. */
export function initialCheckedValue(
  checked: string,
  defaultChecked: string,
  fallback?: string,
): string {
  return initialModelValue(checked, defaultChecked, fallback);
}

/** Nullable selections treat explicit null as a value. */
export function initialNullableModelValue(
  value: string,
  defaultValue: string,
  syntax: "missing-first" | "present-first" = "missing-first",
): string {
  return syntax === "present-first"
    ? `${value} !== undefined ? ${value} : ${defaultValue}`
    : `${value} === undefined ? ${defaultValue} : ${value}`;
}

/** An absent default list starts empty. Model authority is resolved by the owning recipe. */
export function initialListValue(defaultValue: string): string {
  return `${defaultValue} ?? []`;
}
