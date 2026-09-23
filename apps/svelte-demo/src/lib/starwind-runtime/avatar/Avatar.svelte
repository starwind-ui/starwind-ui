<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { AvatarRoot } from "@starwind-ui/svelte/avatar";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { avatar, avatarFallback, avatarImage } from "./variants.js";

  export type AvatarProps = ComponentProps<typeof AvatarRoot> & VariantProps<typeof avatar>;
</script>

<script lang="ts">
  let {
    "variant": variant,
    "size": size,
    "class": className,
    "children": children,
    ...rest
  }: AvatarProps = $props();
</script>

<AvatarRoot
  class={avatar({ "variant": variant, "size": size, "class": cx(className) })}
  {...rest}
  data-slot={"avatar"}
>
  {@render children?.()}
</AvatarRoot>
