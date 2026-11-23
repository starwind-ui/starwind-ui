<script lang="ts">
  import { onMount, tick } from "svelte";
  import App from "../App.svelte";
  // The project forces runes mode. A raw state keeps the component instance unproxied.
  let app = $state.raw<ReturnType<typeof App>>();
  onMount(() => {
    const owner = { app, destroyed: false };
    const host = window as unknown as { __hostOwners?: (typeof owner)[] };
    host.__hostOwners ??= [];
    host.__hostOwners.push(owner);
    tick().then(() => {
      document.documentElement.dataset.hostReady = "true";
    });
    return () => {
      owner.destroyed = true;
      delete document.documentElement.dataset.hostReady;
    };
  });
</script>

<svelte:head><title>Packed SvelteKit 3 controls</title></svelte:head>
<h1>Packed SvelteKit 3 controls</h1>
<App bind:this={app} navigationHref="/away" />
