import type { StyledOutputValueExpression } from "../../../styled-output-model/index.js";

export type VueExpressionReference = {
  name: string;
  nonNullable?: boolean;
  unwrap?: boolean;
};

export type VueComputedExpression =
  | { code: string; type: "source" }
  | { parts: Array<string | VueExpressionReference>; type: "parts" }
  | { type: "shared"; value: StyledOutputValueExpression };

export function projectVueComputedExpression(
  value: StyledOutputValueExpression,
): VueComputedExpression {
  if (value.type !== "raw") return { type: "shared", value };

  switch (value.code) {
    case 'rest["aria-label"] ?? label':
      return parts({ name: "attrs", unwrap: false }, '["aria-label"] ?? label');
    case 'rest["id"]':
      return parts({ name: "attrs", unwrap: false }, '["id"]');
    case "Number.isFinite(min) ? min : 0":
    case "Number.isFinite(max) ? max : 100":
    case "pressed ?? defaultPressed ?? false":
      return { type: "source", code: value.code };
    case "Math.min(boundedMin, boundedMax)":
      return parts("Math.min(", ref("boundedMin"), ", ", ref("boundedMax"), ")");
    case "Math.max(boundedMin, boundedMax)":
      return parts("Math.max(", ref("boundedMin"), ", ", ref("boundedMax"), ")");
    case "value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), normalizedMin), normalizedMax)":
      return parts(
        "value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), ",
        ref("normalizedMin"),
        "), ",
        ref("normalizedMax"),
        ")",
      );
    case "progressValue === null":
      return parts(ref("progressValue"), " === null");
    case "isIndeterminate ? 0 : normalizedMax === normalizedMin ? progressValue >= normalizedMax ? 100 : 0 : Math.round(Math.min(Math.max(((progressValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100, 0), 100))":
      return parts(
        ref("isIndeterminate"),
        " ? 0 : ",
        ref("normalizedMax"),
        " === ",
        ref("normalizedMin"),
        " ? ",
        ref("progressValue", true),
        " >= ",
        ref("normalizedMax"),
        " ? 100 : 0 : Math.round(Math.min(Math.max(((",
        ref("progressValue", true),
        " - ",
        ref("normalizedMin"),
        ") / (",
        ref("normalizedMax"),
        " - ",
        ref("normalizedMin"),
        ")) * 100, 0), 100))",
      );
    case "isIndeterminate ? undefined : { transform: `translateX(-${100 - progressPercent}%)` }":
      return parts(
        ref("isIndeterminate"),
        " ? undefined : { transform: `translateX(-${100 - ",
        ref("progressPercent"),
        "}%)` }",
      );
    default:
      throw new Error(
        `Unsupported Vue computed raw expression ${JSON.stringify(value.code)}. Add an explicit target-local expression projection instead of rewriting source identifiers.`,
      );
  }
}

export function renderVueComputedExpression(expression: VueComputedExpression): string {
  switch (expression.type) {
    case "source":
      return expression.code;
    case "shared":
      return renderVueExpression(expression.value);
    case "parts":
      return expression.parts
        .map((part) =>
          typeof part === "string"
            ? part
            : `${part.name}${part.unwrap === false ? "" : ".value"}${part.nonNullable ? "!" : ""}`,
        )
        .join("");
  }
}

export function computedExpressionUsesReference(
  expression: VueComputedExpression,
  name: string,
): boolean {
  return (
    expression.type === "parts" &&
    expression.parts.some((part) => typeof part !== "string" && part.name === name)
  );
}

export function renderVueExpression(value: StyledOutputValueExpression): string {
  switch (value.type) {
    case "class-join":
      return `[${value.items.map(renderVueExpression).join(", ")}].filter(Boolean).join(" ")`;
    case "class-variant":
      return `${value.variant}(${renderVariantArgs(value.args)})`;
    case "literal":
      return JSON.stringify(value.value);
    case "object":
      return `{ ${Object.entries(value.entries)
        .map(([key, entry]) => `${key}: ${renderVueExpression(entry)}`)
        .join(", ")} }`;
    case "raw":
      return value.code;
    case "template":
      return `\`${value.parts
        .map((part) => (typeof part === "string" ? part : `\${${renderVueExpression(part)}}`))
        .join("")}\``;
    case "variable":
      return value.name;
  }
}

function ref(name: string, nonNullable = false): VueExpressionReference {
  return { name, nonNullable };
}

function parts(...expressionParts: Array<string | VueExpressionReference>): VueComputedExpression {
  return { type: "parts", parts: expressionParts };
}

function renderVariantArgs(args: Record<string, string> | undefined): string {
  if (!args || !Object.keys(args).length) return "";
  return `{ ${Object.entries(args)
    .map(([key, value]) => (key === value ? value : `${key}: ${value}`))
    .join(", ")} }`;
}
