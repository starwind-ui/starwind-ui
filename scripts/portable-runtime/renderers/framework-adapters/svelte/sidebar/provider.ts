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
  isMobile: boolean;
  /** Accept a Sheet binding output through the Provider's silent public setter. */
  setMobileOpen(open: boolean): void;
}>;
export const ${f.context.name}:symbol = Symbol("StarwindSidebarContext");
export function ${f.context.hook}():${f.context.typeName} {
  const context=getContext<${f.context.typeName}|undefined>(${f.context.name});
  if(!context) throw new Error("Sidebar parts must be used within SidebarProvider.");
  return context;
}
`;
}
export function printSidebarProvider(f: AdapterSidebarFacts): string {
  assertSidebarConnection(f);
  return renderSidebarProvider("svelte", f);
}
