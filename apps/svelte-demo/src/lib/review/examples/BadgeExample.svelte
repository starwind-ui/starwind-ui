<script lang="ts">
  import Badge, { BadgeVariants, type BadgeProps } from "$lib/starwind-runtime/badge";
  import { Button } from "$lib/starwind-runtime/button";
  const variants = Object.keys(BadgeVariants.badge.variants.variant) as NonNullable<
    BadgeProps["variant"]
  >[];
  const appearances = ["solid", "soft", "outline", "text", "frosted"] as const;
  let linked = $state(false);
</script>

<div class="space-y-6">
  <div>
    <h3 class="mb-3 text-sm font-medium">Classic variants</h3>
    <div class="flex flex-wrap gap-2">
      {#each variants as variant (variant)}<Badge {variant}>{variant}</Badge>{/each}
    </div>
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Composed styles</h3>
    <div class="flex flex-wrap items-center gap-3">
      {#each appearances as appearance (appearance)}<Badge tone="success" {appearance}
          >{appearance}</Badge
        >{/each}
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <Badge size="sm" tone="primary" appearance="soft">Small</Badge><Badge
      size="md"
      tone="primary"
      appearance="soft">Medium</Badge
    ><Badge size="lg" tone="primary" appearance="soft">Large</Badge><Badge
      eyebrow
      tone="neutral"
      appearance="outline">New release</Badge
    >
  </div>
  <div class="flex flex-wrap items-center gap-3 border-t border-border pt-4">
    <Badge
      href={linked ? "#badge-review" : undefined}
      tone="info"
      appearance="outline"
      data-review-badge-link>Release notes</Badge
    ><Button size="sm" variant="ghost" onclick={() => (linked = !linked)}
      >{linked ? "Disable badge link" : "Enable badge link"}</Button
    >
    <p class="w-full text-sm text-muted-foreground" aria-live="polite">
      {linked
        ? "Release notes is now a link. Use Tab to reach it."
        : "Enable the link to check keyboard focus."}
    </p>
  </div>
</div>
