import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { sveltePrimitiveImport } from "./imports.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection, SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledInputOtp(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const part = (
    {
      InputOtp: "Root",
      InputOtpGroup: "Group",
      InputOtpSlot: "Slot",
      InputOtpSeparator: "Separator",
    } as Record<string, string>
  )[component.exportName];
  const [owner] = component.render;
  if (
    !part ||
    component.render.length !== 1 ||
    owner?.type !== "primitive" ||
    owner.component !== "input-otp" ||
    owner.part !== part ||
    !component.destructure?.rest
  )
    throw new TypeError("Styled Input OTP requires its contracted Primitive owner and forwarding.");
  // The structured icon node carries the contract SVG asset into Svelte output.
  if (part === "Separator") component.imports = [];
  const props = component.destructure.props.filter(
    (prop) => supportsSvelteScope(prop.targetScopes) && prop.name !== "value",
  );
  const ref = owner.attrs.find((attr) => attr.name === "ref");
  if (!ref) throw new TypeError("Styled Input OTP requires its native ref.");
  ref.targetScopes = ["svelte"];
  props.push({ name: "ref" });
  if (part === "Root") {
    owner.attrs = owner.attrs.filter((attr) => attr.name !== "value");
    const callback = owner.attrs.find((attr) => attr.name === "onValueChange");
    if (!callback) throw new TypeError("Styled Input OTP requires the proposal callback.");
    callback.targetScopes = ["svelte"];
    props.push(
      { name: "value", defaultValue: "$bindable()" },
      { name: "value", alias: "commandValue" },
      { name: "onValueChange" },
      { name: "children" },
    );
  } else if (part === "Group") props.push({ name: "children" });
  else if (part === "Separator") props.push({ name: "icon" });
  return {
    imports: [
      { source: "svelte", names: ["ComponentProps", "Snippet"], typeOnly: true },
      ...(part === "Root" ? [{ source: "svelte", names: ["untrack"] }] : []),
      { source: "tailwind-variants", names: ["VariantProps"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      {
        source: sveltePrimitiveImport("input-otp", options),
        names: [`InputOtp${part} as PrimitivePart`],
      },
      { source: "./variants.js", names: group.variants.map((variant) => variant.name) },
    ],
    publicTypes: `export type ${component.exportName}Props = ${
      part === "Root"
        ? 'ComponentProps<typeof PrimitivePart> & VariantProps<typeof inputOtp> & { size?: "sm" | "md" | "lg" }'
        : part === "Slot"
          ? 'Omit<ComponentProps<typeof PrimitivePart>, "caret">'
          : part === "Separator"
            ? 'Omit<ComponentProps<typeof PrimitivePart>, "children"> & { icon?: Snippet }'
            : "ComponentProps<typeof PrimitivePart>"
    };`,
    destructure: props,
    rest: component.destructure.rest,
    setup:
      part === "Root"
        ? [
            `// Observe incoming commands after local bindable publication shadows a plain prop.
let observedCommand = untrack(() => commandValue);
$effect(() => {
  const next = commandValue;
  untrack(() => {
    if (Object.is(next, observedCommand)) return;
    observedCommand = next;
    if (!Object.is(next, value)) value = next;
  });
});`,
          ]
        : [],
  };
}
