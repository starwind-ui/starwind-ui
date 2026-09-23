<script lang="ts">
  import DocsExample from "./DocsExample.svelte";
  import source from "./examples/DialogExample.svelte?raw";
  import Dialog from "$lib/starwind-runtime/dialog";
  import Select from "$lib/starwind-runtime/select";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(undefined);
  let value = $state<string | null | undefined>(undefined);
  let selectOpen = $state<boolean | undefined>(undefined);
</script>

<section
  data-styled-review="dialog"
  id="dialog-review"
  class="review-card"
  aria-labelledby="dialog-heading"
>
  <div class="section-heading">
    <div>
      <p class="eyebrow">Focused tasks</p>
      <h2 id="dialog-heading">Dialog</h2>
    </div>
    <span class="component-label hidden sm:inline-block">dialog</span>
  </div>
  <p>Open the dialog and choose a nested option. Escape closes the list first, then the dialog.</p>
  <DocsExample component="dialog" />
  <div data-additional-examples>
    <h3 class="review-subheading">Additional examples</h3>
    <div class="review-grid">
      <div class="scenario">
        <h3 class="review-subheading">Preferences with nested Select</h3>
        <Dialog.Root bind:open>
          <Dialog.Trigger>
            {#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button
              >{/snippet}
            Open preferences
          </Dialog.Trigger>
          <Dialog.Content class="max-sm:w-[calc(100%-2rem)]" aria-label="Preferences dialog">
            <Dialog.Header
              ><Dialog.Title>Preferences</Dialog.Title><Dialog.Description
                >Choose a default workspace and name.</Dialog.Description
              ></Dialog.Header
            >
            <div class="my-6 grid gap-5">
              <label class="grid gap-2 font-medium"
                >Display name<input
                  class="border-input focus-visible:ring-outline/50 h-10 rounded-md border bg-transparent px-3 font-normal outline-none focus-visible:ring-3"
                  value="Alex"
                /></label
              >
              <div class="grid gap-2">
                <span id="workspace-label" class="font-medium">Default workspace</span>
                <Select.Root
                  name="workspace"
                  defaultValue="personal"
                  bind:value
                  bind:open={selectOpen}
                >
                  <Select.Trigger aria-labelledby="workspace-label" class="w-full">
                    {#snippet child({ props, children })}<Button
                        {...props}
                        class={["w-full", props.class]}
                        variant="outline"
                        >{@render children?.()}<span aria-hidden="true">⌄</span></Button
                      >{/snippet}
                    <Select.Value placeholder="Choose workspace" />
                  </Select.Trigger>
                  <Select.Content aria-label="Workspace choices">
                    <Select.Group
                      ><Select.Label>Workspaces</Select.Label><Select.Item value="personal"
                        >Personal</Select.Item
                      ><Select.Item value="archived" disabled>Archived</Select.Item><Select.Item
                        value="team">Team</Select.Item
                      ><Select.Item value="research">Research</Select.Item></Select.Group
                    >
                  </Select.Content>
                </Select.Root>
              </div>
              <output class="review-output" aria-label="Nested Select state"
                >Workspace: {value ?? "personal"}</output
              >
            </div>
            <Dialog.Footer>
              <Dialog.Close
                >{#snippet child({ props, children })}<Button {...props}
                    >{@render children?.()}</Button
                  >{/snippet}Done</Dialog.Close
              >
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
        <output class="review-output" aria-live="polite" aria-label="Saved workspace"
          >Workspace: {value ?? "personal"}</output
        >
      </div>
      <div class="scenario">
        <h3 class="review-subheading">Keyboard guide</h3>
        <p>Press Tab to move between fields. The arrow keys move through the workspace options.</p>
        <p>
          Escape closes the workspace list and returns focus to its trigger. Press Escape again to
          close preferences.
        </p>
        <Dialog.Root>
          <Dialog.Trigger disabled>
            {#snippet child({ props, children })}
              <Button {...props} variant="outline">{@render children?.()}</Button>
            {/snippet}
            Unavailable dialog
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Unavailable action</Dialog.Title>
              <Dialog.Description>This action is currently disabled.</Dialog.Description>
            </Dialog.Header>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
    <p class="text-sm" data-example-overrides>
      Explicit layout overrides: the dialog keeps a viewport gutter on small screens, and nested
      controls fill their rows.
    </p>
    <details class="source-example">
      <summary>Source example</summary>
      <pre><code>{source}</code></pre>
    </details>
  </div>
</section>
