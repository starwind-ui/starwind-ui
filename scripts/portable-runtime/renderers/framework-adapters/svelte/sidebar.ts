import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertSidebarConnection } from "../../primitive-output-model/sidebar-connection.js";
import { writeGeneratedFile } from "../../shared.js";
import { sidebarAttrs } from "../../shared-recipes/structured/sidebar/parts.js";
import type {
  AdapterComponentFile,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOutputModel,
  AdapterPrintedFile,
  AdapterSidebarFacts,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { printSvelteButtonChild } from "./button-child.js";
import { printSidebarMenuButton } from "./sidebar/menu-button.js";
import { printSidebarContext, printSidebarProvider } from "./sidebar/provider.js";

export function projectSvelteSidebarOutput(model: AdapterOutputModel): AdapterOutputModel {
  const file = model.files.find((file) => file.kind === "index" && file.family?.kind === "sidebar");
  if (file?.kind !== "index" || file.family?.kind !== "sidebar") return model;
  const facts = file.family.facts;
  assertSidebarConnection(facts);
  const helpers = [
    ["SvelteSidebarContext", "sidebar/SidebarContext.ts", printSidebarContext(facts)],
  ] as const;
  return {
    files: [
      ...model.files,
      ...helpers.map(
        ([name, path, code]): AdapterHelperFile => ({
          kind: "helper",
          name,
          path,
          target: "svelte",
          imports: [],
          body: { code },
        }),
      ),
    ],
  };
}
export function printSvelteSidebarHelper(file: AdapterHelperFile): AdapterPrintedFile {
  const paths: Record<string, string> = {
    SvelteSidebarContext: "sidebar/SidebarContext.ts",
  };
  if (file.target !== "svelte" || paths[file.name] !== file.path)
    throw new TypeError("Svelte Sidebar requires its owned helper output.");
  return { path: file.path, contents: file.body.code };
}
export function printSvelteSidebarComponent(file: AdapterComponentFile): AdapterPrintedFile {
  const f = file.component.family;
  if (f?.kind !== "sidebar")
    throw new TypeError("Svelte Sidebar requires specialized Sidebar facts.");
  assertSidebarConnection(f.facts);
  const contents =
    f.part === "provider"
      ? printSidebarProvider(f.facts)
      : f.part === "menuButton"
        ? printSidebarMenuButton(f.facts)
        : f.part === "trigger"
          ? printSvelteButtonChild({
              name: "Sidebar.Trigger",
              imports: 'import { useSidebarContext } from "./SidebarContext.js";',
              init: "const context = useSidebarContext();",
              attributes: `${sidebarAttrs(f.facts, "trigger", "svelte", "object")}, type:"button",`,
              register: "",
              omitEmptyRegistration: true,
              independentAttachments: true,
            })
          : printSidebarPart(f.facts, f.part);
  return { path: `${file.path}.svelte`, contents: contents.replace(/[ \t]+$/gm, "") };
}
export function printSvelteSidebarIndex(file: AdapterIndexFile): AdapterPrintedFile {
  const f = file.family;
  if (f?.kind !== "sidebar")
    throw new TypeError("Svelte Sidebar index requires specialized facts.");
  const names = f.facts.index.namespaceMembers.map(({ name }) => name);
  return {
    path: file.path,
    contents: `${names.map((name) => `import ${name} from "./${name === "SidebarComponent" ? f.facts.exports.sidebar : name}.svelte";`).join("\n")}
const Sidebar = { ${f.facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { Sidebar, ${names.join(", ")} };
export default Sidebar;
export { SidebarContext, useSidebarContext } from "./SidebarContext.js";
export type { SidebarContextValue } from "./SidebarContext.js";
export type { ButtonChildProps, ButtonChildPayload } from "../button/ButtonRoot.svelte";
export type { AnchorChildProps, SidebarMenuButtonChildPayload } from "./SidebarMenuButton.svelte";
export type { ${f.facts.index.typeExports.join(", ")} } from "${f.facts.runtime.typeImportSource}";
`,
  };
}
function printSidebarPart(f: AdapterSidebarFacts, part: "sidebar" | "rail"): string {
  const sidebar = part === "sidebar",
    element = sidebar ? "HTMLDivElement" : "HTMLButtonElement",
    tag = sidebar ? "div" : "button";
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
  import { useSidebarContext } from "./SidebarContext.js";
  type Props = Omit<${sidebar ? "HTMLAttributes<HTMLDivElement>" : "HTMLButtonAttributes"}, "children"> & { children?: Snippet; ref?: (element: ${element}|null)=>void; ${sidebar ? `side?: ${f.props.side.type}; variant?: ${f.props.variant.type}; collapsible?: ${f.props.collapsible.type};` : ""} };
  let { children, ref, ${sidebar ? `side=${f.props.side.defaultValue}, variant=${f.props.variant.defaultValue}, collapsible=${f.props.collapsible.defaultValue},` : ""} ...rest }:Props=$props();
  const context=useSidebarContext();
${printSvelteRefAttachment(element)}
</script>
<${tag} {...rest} ${sidebarAttrs(f, part, "svelte")} {@attach attachRef}>{@render children?.()}</${tag}>`;
}

/** Keep the existing root AnchorChildProps export and give Sidebar's local type a distinct root name. */
export async function writeSvelteSidebarRootExports(outputRoot: string): Promise<void> {
  const source = await readFile(path.join(outputRoot, "index.ts"), "utf8");
  const marker = 'export * from "./sidebar/index.js";';
  if (!source.includes(marker))
    throw new TypeError("Svelte Sidebar requires its root export owner.");
  await writeGeneratedFile(
    outputRoot,
    "index.ts",
    source.replace(
      marker,
      `export { Sidebar, SidebarComponent, SidebarProvider, SidebarTrigger, SidebarRail, SidebarMenuButton, SidebarContext, useSidebarContext } from "./sidebar/index.js";
export type { SidebarContextValue, SidebarMenuButtonChildPayload, AnchorChildProps as SidebarAnchorChildProps } from "./sidebar/index.js";`,
    ),
  );
}
