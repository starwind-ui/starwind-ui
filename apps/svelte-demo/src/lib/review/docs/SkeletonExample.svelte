<script lang="ts">
  import { Skeleton } from "$lib/starwind-runtime/skeleton";
</script>

<div>
  <div class="flex w-full max-w-[314px] items-center space-x-4">
    <Skeleton class="h-12 w-12 shrink-0 rounded-full" />
    <div class="min-w-0 space-y-2">
      <Skeleton class="h-4 w-[250px] max-w-full" />
      <Skeleton class="h-4 w-[200px] max-w-full" />
    </div>
  </div>
</div>
