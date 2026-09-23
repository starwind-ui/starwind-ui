<script lang="ts">
  import Toggle from "$lib/starwind-runtime/toggle";
  let pressed = $state<boolean | undefined>();
</script>

<Toggle bind:pressed>Bold</Toggle>
