<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { AvatarImage as PrimitivePart } from "@starwind-ui/svelte/avatar";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { avatar, avatarFallback, avatarImage } from "./variants.js";
  import { AvatarImage } from "@starwind-ui/svelte/avatar";

  export type AvatarImageProps = ComponentProps<typeof PrimitivePart>;
</script>

<script lang="ts">
  let {
    "class": className,
    "alt": alt,
    "onLoadingStatusChange": onLoadingStatusChange,
    ...rest
  }: AvatarImageProps = $props();
</script>

<AvatarImage
  class={avatarImage({ "class": cx(className) })}
  onLoadingStatusChange={onLoadingStatusChange}
  alt={alt}
  {...rest}
  data-slot={"avatar-image"}
/>
