<script lang="ts">
  import Group from "$lib/starwind-runtime/input-group";
  import { Button } from "$lib/starwind-runtime/button";
  import type { InputValue } from "@starwind-ui/svelte/input";
  let value = $state<InputValue | undefined>();
  let note = $state<string | null | undefined>();
  let events = $state(0),
    actions = $state(0);
  let search: HTMLInputElement | null = null;
</script>

<form class="grid gap-4" onsubmit={(event) => event.preventDefault()}>
  <div class="grid gap-2">
    <label for="group-search">Search</label>
    <Group.Root id="group-inline-start">
      <Group.Addon align="inline-start">
        <Group.Text>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </Group.Text>
      </Group.Addon>
      <Group.Input
        id="group-search"
        name="search"
        defaultValue="Astro"
        bind:value
        ref={(node) => {
          search = node;
        }}
        oninput={() => {
          events++;
        }}
      />
      <Group.Addon align="inline-end"
        ><Group.Button
          onclick={() => {
            actions++;
          }}>Go</Group.Button
        ></Group.Addon
      >
    </Group.Root>
  </div>
  <div class="grid gap-2">
    <label for="group-cost">Budget</label>
    <Group.Root id="group-inline-end"
      ><Group.Input id="group-cost" name="budget" value={24} /><Group.Addon align="inline-end"
        ><Group.Text>USD</Group.Text></Group.Addon
      ></Group.Root
    >
  </div>
  <div class="grid gap-2">
    <label for="group-note">Note</label>
    <Group.Root id="group-block-start"
      ><Group.Addon align="block-start"><Group.Text>Project note</Group.Text></Group.Addon
      ><Group.Textarea
        id="group-note"
        name="note"
        defaultValue="Add a short note."
        bind:value={note}
      /></Group.Root
    >
  </div>
  <div class="grid gap-2">
    <label for="group-message">Message</label>
    <Group.Root id="group-block-end"
      ><Group.Textarea
        id="group-message"
        name="message"
        placeholder="Write a message"
      /><Group.Addon align="block-end"
        ><Group.Text>Optional</Group.Text><Group.Button
          size="icon-sm"
          aria-label="Send message"
          onclick={() => {
            actions++;
          }}>↑</Group.Button
        ></Group.Addon
      ></Group.Root
    >
  </div>
  <div class="grid gap-2">
    <label for="group-disabled">Locked field</label>
    <Group.Root id="group-disabled-root"
      ><Group.Input id="group-disabled" disabled value="Locked" /><Group.Addon align="inline-end"
        ><Group.Text>Read only</Group.Text></Group.Addon
      ></Group.Root
    >
  </div>
  <p data-input-group-status>
    Search: {String(value ?? "Astro")}. Note: {note ?? "Add a short note."}. Input events: {events}.
    Actions: {actions}.
  </p>
  <div class="flex flex-wrap gap-3">
    <Button type="reset" variant="outline">Reset group</Button><Button
      variant="outline"
      onclick={() => search?.focus()}>Focus search</Button
    >
  </div>
</form>
