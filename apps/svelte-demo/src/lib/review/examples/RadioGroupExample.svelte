<script lang="ts">
  import RadioGroup from "$lib/starwind-runtime/radio-group";
  import Label from "$lib/starwind-runtime/label";
  let delivery = $state<string | undefined>();
</script>

<RadioGroup.Root name="delivery" legend="Delivery" defaultValue="standard" bind:value={delivery}>
  <div class="flex items-center gap-3">
    <RadioGroup.Item
      id="example-standard"
      aria-labelledby="example-standard-label"
      value="standard"
    /><Label id="example-standard-label" for="example-standard">Standard</Label>
  </div>
  <div class="flex items-center gap-3">
    <RadioGroup.Item
      id="example-express"
      aria-labelledby="example-express-label"
      value="express"
    /><Label id="example-express-label" for="example-express">Express</Label>
  </div>
</RadioGroup.Root>
