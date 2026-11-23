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

/**
 * A `data-default-*` marker states the default prop as read once at mount, and only when it is
 * true. A held value, interaction, readback, a later prop write, and hydration never change it.
 * Printers capture the default at mount in their own syntax and pass that read here.
 */
export function defaultMarker(initialDefault: string): string {
  return `${initialDefault} ? "true" : undefined`;
}

/** A value marker such as `data-default-value` follows the same rule with the value itself. */
export function defaultValueMarker(initialDefault: string): string {
  return `${initialDefault} ?? undefined`;
}
