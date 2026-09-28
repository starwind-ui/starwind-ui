<script lang="ts">
  import Alert, { AlertVariants } from "$lib/starwind-runtime/alert";
  import type { VariantProps } from "tailwind-variants";
  const variants = Object.keys(AlertVariants.alert.variants.variant) as NonNullable<
    VariantProps<typeof AlertVariants.alert>["variant"]
  >[];
</script>

<div class="grid gap-4 md:grid-cols-2">
  {#each variants as variant (variant)}
    <Alert.Root {variant}>
      <Alert.Title>{variant[0].toUpperCase() + variant.slice(1)}</Alert.Title>
      <Alert.Description>
        {#if variant === "error"}The upload failed. Choose a smaller file and try again.
        {:else if variant === "warning"}Your storage is almost full. Review files before the next
          upload.
        {:else if variant === "success"}Your changes are saved and ready to share.
        {:else if variant === "info"}The next update is scheduled for Monday.
        {:else}Project settings apply to everyone in this workspace.{/if}
      </Alert.Description>
    </Alert.Root>
  {/each}
</div>
