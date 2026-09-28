import type { Target } from "../operations.js";
import type { SidebarFacts } from "./recipe.js";
export type SidebarPart = "sidebar" | "trigger" | "rail" | "menuButton";
/** Shared semantic attributes. Callers provide only native prop/context access syntax. */
export function sidebarPartAttributes(
  f: SidebarFacts,
  part: SidebarPart,
  read: (name: string) => string,
  context: (name: string) => string,
): Record<string, string> {
  const attrs: Record<string, string> = {
    [f.parts[part].discoveryAttribute]: `''`,
    "data-sw-part": JSON.stringify(part),
  };
  if (part === "sidebar")
    Object.assign(attrs, {
      [f.attrs.sidebarState]: context("state"),
      [f.attrs.sidebarCollapsible]: `${context("state")}==='collapsed'?${read("collapsible")}:''`,
      [f.attrs.sidebarCollapsibleMode]: read("collapsible"),
      [f.attrs.sidebarVariant]: read("variant"),
      [f.attrs.sidebarSide]: read("side"),
    });
  else if (part === "menuButton") attrs[f.attrs.menuButtonState] = context("state");
  else
    Object.assign(attrs, {
      [f.attrs[`${part}State`]]: context("state"),
      [f.attrs[`${part}Expanded`]]: context("expanded"),
    });
  if (part === "rail")
    Object.assign(attrs, {
      [f.attrs.railType]: `'button'`,
      [f.attrs.railTabindex]: f.rail.tabIndexValue,
    });
  return attrs;
}
export function sidebarAttrs(
  f: SidebarFacts,
  part: SidebarPart,
  target: Target,
  format: "markup" | "object" = "markup",
): string {
  const read = (name: string) =>
    target === "vue"
      ? `props.${f.props[name as keyof typeof f.props].name}`
      : f.props[name as keyof typeof f.props].name;
  const context = (name: string) =>
    target === "react"
      ? `(sidebarContext?.${name} ?? ${name === "expanded" ? "false" : `'expanded'`})`
      : `context.${name}${target === "vue" ? ".value" : ""}`;
  const attrs = sidebarPartAttributes(f, part, read, context);
  return Object.entries(attrs)
    .map(([name, value]) =>
      format === "object"
        ? `${JSON.stringify(name)}:${value}`
        : target === "vue"
          ? `:${name}="${value.replaceAll('"', "'")}"`
          : `${target === "react" && name === "tabindex" ? "tabIndex" : name}={${value}}`,
    )
    .join(format === "object" ? ",\n" : " ");
}
