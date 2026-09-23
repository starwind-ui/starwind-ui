<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { AvatarFallback as PrimitivePart } from "@starwind-ui/svelte/avatar";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { avatar, avatarFallback, avatarImage } from "./variants.js";
  import { AvatarFallback } from "@starwind-ui/svelte/avatar";

  export type AvatarFallbackProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "delay": delay,
    "class": className,
    "children": children,
    ...rest
  }: AvatarFallbackProps = $props();
</script>

<AvatarFallback
  class={avatarFallback({ "class": cx(className) })}
  delay={delay}
  {...rest}
  data-slot={"avatar-fallback"}
>
  {@render children?.()}
</AvatarFallback>
