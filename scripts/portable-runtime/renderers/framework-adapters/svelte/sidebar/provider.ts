import { assertSidebarConnection } from "../../../primitive-output-model/sidebar-connection.js";
import { renderSidebarProvider } from "../../../shared-recipes/structured/sidebar/frame.js";
import type { AdapterSidebarFacts } from "../../types.js";

export function printSidebarContext(f: AdapterSidebarFacts): string {
  return `import { getContext } from "svelte";
export type ${f.context.typeName} = Readonly<{
  open: boolean;
  mobileOpen: boolean;
  state: "collapsed"|"expanded";
  expanded: boolean;
}>;
export const ${f.context.name}:symbol = Symbol("StarwindSidebarContext");
export function ${f.context.hook}():${f.context.typeName}|null {
  return getContext<${f.context.typeName}|undefined>(${f.context.name}) ?? null;
}
const expanded = { state: "expanded", expanded: false } as const;
/** Sidebar parts outside a Provider render state expanded with aria-expanded false, as React does. Not exported from the package. */
export function useSidebarState():Pick<${f.context.typeName},"state"|"expanded"> {
  return ${f.context.hook}() ?? expanded;
}
`;
}
export function printSidebarProvider(f: AdapterSidebarFacts): string {
  assertSidebarConnection(f);
  return renderSidebarProvider("svelte", f);
}
