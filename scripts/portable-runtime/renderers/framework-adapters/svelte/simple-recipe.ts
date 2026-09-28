import type { CommandOperations } from "../../shared-recipes/simple/operations.js";
export const simpleRecipeOperations: CommandOperations = {
  initialValue: (name, expression) => `const ${name} = untrack(() => ${expression});`,
  owner: "owned",
  readInput: (prop) => prop.name,
  fieldName: (prop) => prop.attribute ?? prop.name,
  attribute: (name, expression) => `${name}={${expression}}`,
  declareOwner: (factory) => `let owned: ReturnType<typeof ${factory}> | undefined;`,
  lifecycle({ recipe, declaration, dispose, create, condition, commands }) {
    return `const attachRuntime: Attachment<${recipe.element}> = (element) => {
    ${declaration}
    $effect(() => {
      ${condition ? `if (!${condition}) return;` : ""}
      untrack(() => { ${create} });
      ${commands.map((c) => `$effect(() => { const args = [${c.reads.join(", ")}]; void args; untrack(() => { ${c.body} }); });`).join("\n")}
      return () => untrack(() => { ${dispose} });
    });
  };`;
  },
  frame({ kind, recipe, name, imports, fields, destructure, attrs, code }) {
    const publicFields =
      kind === "button"
        ? fields.replace(/"type"\?: [^;]+/, '"type"?: HTMLButtonAttributes["type"]')
        : fields;
    return `${
      kind === "button"
        ? `<script module lang="ts">
import type {HTMLButtonAttributes as ChildButtonAttributes} from 'svelte/elements';
import type {Snippet as ChildSnippet} from 'svelte';
export type ButtonChildProps = Omit<ChildButtonAttributes, "children" | "disabled"> & {disabled?:boolean};
export type ButtonChildPayload = {props:ButtonChildProps; children?:ChildSnippet};
</script>`
        : ""
    }
<script lang="ts">
import { ${imports} } from '@starwind-ui/runtime/${recipe.runtime}';
import { untrack, type Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { ${recipe.native.split("<")[0]} } from 'svelte/elements';
import { createRefAttachment } from '../_internal/ref-attachment.js';
type Props = Omit<${recipe.native}, 'children' | ${recipe.props.map((p) => JSON.stringify(p.attribute ?? p.name)).join(" | ")}> & {children?:Snippet; ref?:(element:${recipe.element} | null)=>void; ${publicFields}};
let {children,ref,${destructure},...rest}:Props = $props();
${code}
const attachRef = createRefAttachment<${recipe.element}>(() => ref);
</script>
<${recipe.tag} {...rest} ${attrs} {@attach attachRuntime} {@attach attachRef}>{@render children?.()}</${recipe.tag}>`;
  },
};
