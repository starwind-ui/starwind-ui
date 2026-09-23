<script lang="ts">
  import Avatar from "$lib/starwind-runtime/avatar";
  import { Button } from "$lib/starwind-runtime/button";
  let loaded = $state(false);
  let status = $state("idle");
  const portrait = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#166534"/><circle cx="40" cy="29" r="14" fill="#dcfce7"/><ellipse cx="40" cy="73" rx="28" ry="24" fill="#dcfce7"/></svg>');
</script>
<div class="flex flex-wrap items-center gap-4">
  <Avatar.Root size="lg" variant="success">
    <Avatar.Image alt="Example member portrait" src={loaded ? portrait : undefined} onLoadingStatusChange={(next) => { status = next; }} />
    <Avatar.Fallback delay={250}>SW</Avatar.Fallback>
  </Avatar.Root>
  <Button size="sm" onclick={() => { loaded = !loaded; }}>{loaded ? "Show fallback" : "Load portrait"}</Button>
  <p role="status">Image status: {status}</p>
  <Avatar.Root size="sm" variant="primary"><Avatar.Fallback>AB</Avatar.Fallback></Avatar.Root>
  <Avatar.Root size="md" variant="warning"><Avatar.Fallback>CD</Avatar.Fallback></Avatar.Root>
</div>
