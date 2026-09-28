import {
  collectStyledOutputVariantReferences,
  type StyledOutputComponent,
  type StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { nativeStyledOwners, specializeSvelteStyledNative } from "./native.js";
import { renderSvelteStyledValue } from "./render.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection } from "./types.js";

/** Group parts preserve the native/model owner in their existing Styled dependency. */
export function specializeSvelteStyledInputGroup(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
): Pick<
  SvelteStyledComponentProjection,
  | "imports"
  | "publicTypes"
  | "destructure"
  | "rest"
  | "setup"
  | "semanticNativeTag"
  | "semanticNativeSlot"
> {
  if (nativeStyledOwners[group.component]?.[component.exportName])
    return specializeSvelteStyledNative(group, component);
  const owners: Record<string, { component: string; name: string }> = {
    InputGroupButton: { component: "button", name: "Button" },
    InputGroupInput: { component: "input", name: "Input" },
    InputGroupTextarea: { component: "textarea", name: "Textarea" },
  };
  const owner = owners[component.exportName];
  const [root] = component.render;
  if (
    !owner ||
    component.render.length !== 1 ||
    root?.type !== "component" ||
    root.component !== owner.component ||
    root.exportName !== owner.name ||
    !component.destructure?.rest
  )
    throw new TypeError(
      `Svelte Styled input-group/${component.exportName} requires its declared Styled owner.`,
    );
  const bases =
    component.props?.extends?.filter((base) => supportsSvelteScope(base.targetScopes)) ?? [];
  const inherited = bases.find((base) => base.kind === "component-props");
  const button = owner.name === "Button",
    input = owner.name === "Input",
    textarea = owner.name === "Textarea";
  if (
    inherited?.kind !== "component-props" ||
    inherited.component !== owner.component ||
    inherited.exportName !== owner.name ||
    JSON.stringify(inherited.keys) !== JSON.stringify(button ? ["size"] : [])
  )
    throw new TypeError(
      `Svelte Styled input-group/${component.exportName} requires its component prop inheritance.`,
    );
  const destructure = component.destructure.props.filter((prop) =>
    supportsSvelteScope(prop.targetScopes),
  );
  if (button) destructure.push({ name: "children" });
  else destructure.push({ name: "value", defaultValue: "$bindable()" });
  if (input) destructure.push({ name: "value", alias: "commandValue" });
  if (textarea) {
    destructure.push({ name: "ref", defaultValue: "$bindable()" });
  }
  const buttonSetup: string[] = [];
  if (button) {
    // Public props retain Button's discriminated native refs. Compose its full prop object
    // before forwarding so destructuring does not widen that union in Svelte's template.
    const entries = root.attrs
      .filter((attr) => supportsSvelteScope(attr.targetScopes))
      .map((attr) =>
        attr.name === "spread"
          ? `...(${renderSvelteStyledValue(attr.value!)} as Record<string, unknown>)`
          : `${JSON.stringify(attr.name)}: ${attr.value ? renderSvelteStyledValue(attr.value) : "true"}`,
      );
    buttonSetup.push(
      `let ownerProps = $derived({ ${entries.join(", ")} } as ComponentProps<typeof Button>);`,
    );
    root.attrs = [{ name: "spread", value: { type: "variable", name: "ownerProps" } }];
  }
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps"], typeOnly: true },
      ...(input ? [{ source: "svelte", names: ["untrack"] }] : []),
      ...(button ? [{ source: "tailwind-variants", names: ["VariantProps"], typeOnly: true }] : []),
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: "./variants.js",
        names: collectStyledOutputVariantReferences(component, { target: "svelte" }),
      },
    ],
    publicTypes: button
      ? `type GroupButtonProps<Props> = Props extends unknown ? Omit<Props, "size"> & ("type" extends keyof Props ? {} : {type?: never}) : never;
export type InputGroupButtonProps = GroupButtonProps<ComponentProps<typeof Button>> & VariantProps<typeof inputGroupButton>;`
      : `export type ${component.exportName}Props = ComponentProps<typeof ${owner.name}>;`,
    destructure,
    rest: component.destructure.rest,
    setup: input
      ? [
          `// Observe incoming arrays even after the composed bindable value publishes locally.
const copyCommand = (next: InputGroupInputProps["value"]) => Array.isArray(next) ? [...next] : next;
let observedCommand = untrack(() => copyCommand(commandValue));
$effect(() => {
  const next = copyCommand(commandValue);
  untrack(() => {
    const previous = observedCommand;
    if (Array.isArray(next) && Array.isArray(previous) ? next.length === previous.length && next.every((entry, index) => entry === previous[index]) : Object.is(next, previous)) return;
    observedCommand = next;
    const current = value;
    if (Array.isArray(next) && Array.isArray(current) ? next.length === current.length && next.every((entry, index) => entry === current[index]) : Object.is(next, current)) return;
    value = next;
  });
});`,
        ]
      : buttonSetup,
  };
}
