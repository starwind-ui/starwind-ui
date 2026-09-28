<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/starwind-runtime/tooltip";
</script>

<div class="flex items-center justify-center">
  <Tooltip>
    <TooltipTrigger>
      {#snippet child({ props, children })}
        <Button {...props} variant="outline">{@render children?.()}</Button>
      {/snippet}
      Hover me
    </TooltipTrigger>
    <TooltipContent>Add to library</TooltipContent>
  </Tooltip>
</div>
