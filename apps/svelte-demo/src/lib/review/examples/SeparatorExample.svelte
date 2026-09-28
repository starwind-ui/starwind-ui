<script lang="ts">
  import Separator from "$lib/starwind-runtime/separator";
</script>

<div class="space-y-4">
  <p class="font-medium">Project details</p>
  <Separator />
  <div class="flex h-6 items-center gap-4 text-sm">
    <span>Overview</span><Separator orientation="vertical" /><span>Activity</span>
  </div>
  <Separator data-slot="custom-divider" class="bg-primary" />
</div>
