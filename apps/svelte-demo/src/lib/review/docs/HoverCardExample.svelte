<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "$lib/starwind-runtime/avatar";
  import { ButtonVariants } from "$lib/starwind-runtime/button";
  import { HoverCard, HoverCardContent, HoverCardTrigger } from "$lib/starwind-runtime/hover-card";
</script>

<div class="flex items-center justify-center py-6">
  <HoverCard>
    <HoverCardTrigger href="https://starwind.dev">
      {#snippet child({ props, children })}
        <a {...props} class={[ButtonVariants.button({ variant: "outline" }), props.class]}
          >{@render children?.()}</a
        >
      {/snippet}
      @starwind
    </HoverCardTrigger>
    <HoverCardContent class="w-80" align="start">
      <div class="flex justify-between gap-4">
        <Avatar class="shrink-0">
          <AvatarImage src="https://i.pravatar.cc/150?u=starwind" alt="Starwind UI" />
          <AvatarFallback>SW</AvatarFallback>
        </Avatar>
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">Starwind UI</h4>
          <p class="text-muted-foreground text-sm">
            Accessible Astro components styled with Tailwind CSS.
          </p>
          <span class="text-muted-foreground block pt-2 text-xs">Built for Astro developers</span>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</div>
