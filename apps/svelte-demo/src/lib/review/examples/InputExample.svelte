<script lang="ts">
  import Input from "$lib/starwind-runtime/input";
  import { Button } from "$lib/starwind-runtime/button";
  import type { InputValue } from "@starwind-ui/svelte/input";
  let value = $state<InputValue | undefined>();
  let events = $state(0);
  let input: HTMLInputElement | null = null;
</script>

<form class="grid gap-4" onsubmit={(event) => event.preventDefault()}>
  <label class="grid gap-2"
    >Name<Input
      name="name"
      defaultValue="Ada"
      bind:value
      ref={(node) => {
        input = node;
      }}
      oninput={() => {
        events++;
      }}
    /></label
  >
  <p data-input-status>Value: {String(value ?? "Ada")}. Native input events: {events}.</p>
  <div class="flex flex-wrap gap-3">
    <Button type="reset" size="sm">Reset input</Button><Button
      size="sm"
      onclick={() => input?.focus()}>Focus input</Button
    >
  </div>
  <label class="grid gap-2">Small<Input size="sm" placeholder="Small input" /></label>
  <label class="grid gap-2">Large<Input size="lg" placeholder="Large input" /></label>
  <label class="grid gap-2">Read only<Input readonly value="Read only value" /></label>
  <label class="grid gap-2">Disabled<Input disabled value="Disabled value" /></label>
  <label class="grid gap-2">Attachment<Input type="file" /></label>
</form>
