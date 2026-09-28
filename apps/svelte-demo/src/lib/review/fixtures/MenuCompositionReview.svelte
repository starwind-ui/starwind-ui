<script lang="ts">
  import Combobox from "$lib/starwind-runtime/combobox";
  import Sheet from "$lib/starwind-runtime/sheet";
  import Dropdown from "$lib/starwind-runtime/dropdown";
  import { Button } from "$lib/starwind-runtime/button";
  let checked = $state<boolean | undefined>(true);
</script>

<section
  id="menu-composition-review"
  class="review-card"
  aria-labelledby="menu-composition-heading"
>
  <h2 id="menu-composition-heading">Dropdown inside a Sheet</h2>
  <p>Use the workspace menu while the settings sheet stays open.</p>
  <Sheet.Root>
    <Sheet.Trigger
      >{#snippet child({ props, children })}<Button {...props} variant="outline"
          >{@render children?.()}</Button
        >{/snippet}Open menu sheet</Sheet.Trigger
    >
    <Sheet.Content>
      <Sheet.Header
        ><Sheet.Title>Workspace actions</Sheet.Title><Sheet.Description
          >Choose an action for this workspace.</Sheet.Description
        ></Sheet.Header
      >
      <div class="grid justify-items-start gap-4 px-4 py-6">
        <Dropdown.Root>
          <Dropdown.Trigger
            >{#snippet child({ props, children })}<Button {...props} variant="outline"
                >{@render children?.()}</Button
              >{/snippet}Nested workspace menu</Dropdown.Trigger
          >
          <Dropdown.Content class="w-56" sideOffset={8} data-nested-dropdown>
            <Dropdown.Label>Account actions</Dropdown.Label><Dropdown.Separator />
            <Dropdown.Item>Manage members</Dropdown.Item><Dropdown.Item
              >Workspace profile</Dropdown.Item
            >
            <Dropdown.CheckboxItem bind:checked>Show activity</Dropdown.CheckboxItem>
            <Dropdown.Separator /><Dropdown.Item disabled>Delete workspace</Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Root>
        <output class="text-sm text-muted-foreground"
          >Activity: {checked ? "shown" : "hidden"}</output
        >
      </div>
    </Sheet.Content>
  </Sheet.Root>
</section>

<section
  id="combobox-composition-review"
  class="review-card"
  aria-labelledby="combobox-composition-heading"
>
  <h2 id="combobox-composition-heading">Combobox inside a Sheet</h2>
  <p>Choose a framework in the project settings.</p>
  <Sheet.Root>
    <Sheet.Trigger
      >{#snippet child({ props, children })}<Button {...props} variant="outline"
          >{@render children?.()}</Button
        >{/snippet}Open framework sheet</Sheet.Trigger
    >
    <Sheet.Content>
      <Sheet.Header
        ><Sheet.Title>Project framework</Sheet.Title><Sheet.Description
          >Select the framework for this project.</Sheet.Description
        ></Sheet.Header
      >
      <div class="grid gap-4 px-4 py-6">
        <Combobox.Root name="nested-framework">
          <Combobox.Label>Nested framework</Combobox.Label><Combobox.Input
            placeholder="Search project frameworks"
            showClear
          />
          <Combobox.Content data-nested-combobox
            ><Combobox.Empty>No framework found.</Combobox.Empty><Combobox.Item value="astro"
              >Astro</Combobox.Item
            ><Combobox.Item value="react">React</Combobox.Item><Combobox.Item value="svelte"
              >Svelte</Combobox.Item
            ></Combobox.Content
          >
        </Combobox.Root>
      </div>
    </Sheet.Content>
  </Sheet.Root>
</section>
