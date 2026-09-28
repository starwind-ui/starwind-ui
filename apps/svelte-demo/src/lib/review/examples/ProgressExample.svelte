<script lang="ts">
  import Progress from "$lib/starwind-runtime/progress";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<number | null>(35);
</script>
<div class="grid gap-4">
  <div class="flex flex-wrap items-center gap-3">
    <Button size="sm" onclick={() => { value = value === null ? 25 : Math.min(value + 25, 100); }}>Advance</Button>
    <Button size="sm" onclick={() => { value = value === null ? 35 : null; }}>{value === null ? "Use value" : "Use indeterminate"}</Button>
    <span>{value === null ? "Waiting for a total" : `${value} of 100`}</span>
  </div>
  <Progress {value} label="Upload progress" variant="primary" />
  <Progress value={100} label="Completed task" variant="success" />
  <Progress value={30} min={20} max={60} label="Custom range progress" variant="warning" />
</div>
