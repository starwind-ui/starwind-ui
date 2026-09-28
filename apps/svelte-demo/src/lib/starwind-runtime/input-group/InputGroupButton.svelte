<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { inputGroupButton } from "./variants.js";
  import { Button } from "../button/index.js";

  type GroupButtonProps<Props> = Props extends unknown ? Omit<Props, "size"> & ("type" extends keyof Props ? {} : {type?: never}) : never;
  export type InputGroupButtonProps = GroupButtonProps<ComponentProps<typeof Button>> & VariantProps<typeof inputGroupButton>;
</script>

<script lang="ts">
  let {
    "type": type = "button",
    "variant": variant = "ghost",
    "size": size,
    "class": className,
    "children": children,
    ...rest
  }: InputGroupButtonProps = $props();

  let ownerProps = $derived({ "type": type, "data-size": size, "size": size, "variant": variant, "class": inputGroupButton({ "size": size, "class": cx(className) }), ...(rest as Record<string, unknown>) } as ComponentProps<typeof Button>);
</script>

<Button
  {...ownerProps}
>
  {@render children?.()}
</Button>
