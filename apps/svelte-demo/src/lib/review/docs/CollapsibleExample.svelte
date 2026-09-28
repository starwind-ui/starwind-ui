<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "$lib/starwind-runtime/collapsible";
</script>

<div>
  <Collapsible class="w-[350px] max-w-full space-y-2">
    <div class="flex items-center justify-between space-x-4 px-4">
      <h4 class="text-sm font-semibold">@starwind-ui starred 3 repositories</h4>
      <CollapsibleTrigger>
        {#snippet child({ props, children })}
          <Button {...props} variant="ghost" size="icon-sm">{@render children?.()}</Button>
        {/snippet}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-4"><path d="m8 9 4-4 4 4m-8 6 4 4 4-4" /></svg
        >
        <span class="sr-only">Toggle</span>
      </CollapsibleTrigger>
    </div>
    <div class="rounded-md border px-4 py-2 font-mono text-sm">astro</div>
    <CollapsibleContent class="space-y-2">
      <div class="rounded-md border px-4 py-2 font-mono text-sm">tailwindcss</div>
      <div class="rounded-md border px-4 py-2 font-mono text-sm">starwind-ui</div>
    </CollapsibleContent>
  </Collapsible>
</div>
