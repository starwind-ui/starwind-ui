<script>
  import { onMount, tick } from "svelte";
  import App from "./App.svelte";
  let { navigationHref } = $props();
  let app;
  onMount(() => {
    const owner = { app, destroyed: false };
    window.__hostOwners ??= [];
    window.__hostOwners.push(owner);
    tick().then(() => {
      document.documentElement.dataset.hostReady = "true";
    });
    return () => {
      owner.destroyed = true;
      delete document.documentElement.dataset.hostReady;
    };
  });
</script>

<App bind:this={app} {navigationHref} />
