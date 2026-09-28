<script lang="ts">
  import Combobox from "$lib/starwind-runtime/combobox";
  import Form from "$lib/starwind-runtime/form";
  import Field from "$lib/starwind-runtime/field";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string | null | undefined>(undefined);
  let inputValue = $state<string | undefined>(undefined);
  let open = $state<boolean | undefined>(undefined);
  let submitted = $state("Choose a framework, then save.");
</script>

<Form.Root
  onsubmit={(event) => {
    event.preventDefault();
    submitted = `Saved: ${new FormData(event.currentTarget).get("project-framework") ?? "none"}`;
  }}
>
  <div class="grid w-full max-w-sm gap-4">
    <Field.Root name="project-framework">
      <Field.Label for="project-framework-input">Project framework</Field.Label>
      <Combobox.Root
        name="project-framework"
        defaultValue="astro"
        bind:value
        bind:inputValue
        bind:open
        required
      >
        <Combobox.Input id="project-framework-input" placeholder="Find a framework" showClear />
        <Combobox.Content>
          <Combobox.Empty>No matching framework.</Combobox.Empty>
          <Combobox.Group
            ><Combobox.GroupLabel>Frameworks</Combobox.GroupLabel>
            <Combobox.Item value="astro">Astro</Combobox.Item><Combobox.Item value="react"
              >React</Combobox.Item
            ><Combobox.Item value="svelte">Svelte</Combobox.Item>
          </Combobox.Group>
        </Combobox.Content>
      </Combobox.Root>
      <Field.Description>Search the list to choose one framework.</Field.Description><Field.Error />
    </Field.Root>
    <div class="flex flex-wrap gap-2">
      <Button type="submit">Save framework</Button><Button variant="outline" type="reset"
        >Reset framework</Button
      >
    </div>
    <output data-combobox-example-model
      >Selection: {value ?? "none"}. Text: {inputValue ?? ""}. Results: {open
        ? "open"
        : "closed"}.</output
    >
    <p data-combobox-example-submitted>{submitted}</p>
  </div>
</Form.Root>
