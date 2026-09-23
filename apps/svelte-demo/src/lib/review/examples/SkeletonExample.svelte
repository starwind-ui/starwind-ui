<script lang="ts">
  import Skeleton from "$lib/starwind-runtime/skeleton";
</script>

<div role="status" aria-label="Loading profile" class="flex items-center gap-4">
  <Skeleton class="size-12 rounded-full" aria-hidden="true" />
  <div class="grid gap-2">
    <Skeleton class="h-4 w-40" aria-hidden="true" /><Skeleton class="h-4 w-28" aria-hidden="true" />
  </div>
</div>
