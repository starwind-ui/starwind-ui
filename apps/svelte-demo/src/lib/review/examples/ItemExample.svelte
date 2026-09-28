<script lang="ts">
  import Item from "$lib/starwind-runtime/item";
  import { Button } from "$lib/starwind-runtime/button";
  import Badge from "$lib/starwind-runtime/badge";
  let followed = $state(false);
</script>

<div class="space-y-5">
  <Item.Root as="article" variant="outline">
    <Item.Header
      ><span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >Workspace</span
      ><Badge size="sm" tone="success" appearance="soft">Active</Badge></Item.Header
    >
    <Item.Media variant="icon" aria-label="Starwind initials"
      ><span class="text-xs font-semibold">SW</span></Item.Media
    >
    <Item.Content
      ><Item.Title>Starwind design system</Item.Title><Item.Description
        >Shared components for your projects.</Item.Description
      ></Item.Content
    >
    <Item.Actions
      ><Button size="sm" variant="outline" onclick={() => (followed = !followed)}
        >{followed ? "Following" : "Follow"}</Button
      ></Item.Actions
    >
    <Item.Footer
      ><p class="text-xs text-muted-foreground" aria-live="polite">
        {followed ? "Updates will appear in your feed." : "Updated today"}
      </p>
      <span class="text-xs whitespace-nowrap text-muted-foreground">12 members</span></Item.Footer
    >
  </Item.Root>
  <Item.Group aria-label="Project resources">
    <div role="listitem">
      <Item.Root as="a" href="#item-review" size="sm">
        <Item.Content
          ><Item.Title>Component guidelines</Item.Title><Item.Description
            >Review names, spacing, and usage examples.</Item.Description
          ></Item.Content
        >
        <Item.Actions><Badge size="sm" variant="outline">Guide</Badge></Item.Actions>
      </Item.Root>
    </div>
    <Item.Separator />
    <div role="listitem">
      <Item.Root as="a" href="#item-review" size="sm" variant="muted">
        <Item.Media variant="image" aria-label="Preview placeholder"
          ><div class="size-full bg-linear-to-br from-primary/30 to-secondary/30"></div></Item.Media
        >
        <Item.Content
          ><Item.Title>Release preview</Item.Title><Item.Description
            >See what is ready for the next update.</Item.Description
          ></Item.Content
        >
      </Item.Root>
    </div>
  </Item.Group>
</div>
