<script lang="ts">
  import Spinner from "$lib/starwind-runtime/spinner";
  import { Button } from "$lib/starwind-runtime/button";
  let saving = $state(true);
</script>

<div class="space-y-6">
  <div>
    <h3 class="mb-3 text-sm font-medium">Icon sizes</h3>
    <div class="flex items-center gap-6" data-spinner-sizes>
      <Spinner aria-hidden={false} />
      <Spinner class="size-6" />
      <Spinner class="size-8" />
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-4">
    <div role="status" class="flex items-center gap-2" data-loading-region>
      {#if saving}<Spinner />{/if}<span>{saving ? "Saving changes" : "Changes saved"}</span>
    </div>
    <Button variant="outline" size="sm" onclick={() => (saving = !saving)}
      >{saving ? "Finish saving" : "Save again"}</Button
    >
  </div>
</div>
