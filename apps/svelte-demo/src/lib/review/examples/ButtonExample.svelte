<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  let message = $state("Ready to try.");
</script>

<Button variant="primary" onclick={() => (message = "Action complete.")}>Try Button</Button>
<p aria-live="polite">{message}</p>
<Button as="a" href="#button-sizes" variant="outline">Jump to sizes</Button>
<Button disabled>Unavailable action</Button>
