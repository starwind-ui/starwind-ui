<script lang="ts">
  import Dialog from "$lib/starwind-runtime/dialog";
  import Select from "$lib/starwind-runtime/select";
  import { Button } from "$lib/starwind-runtime/button";
  let open = $state<boolean | undefined>(undefined);
  let value = $state<string | null | undefined>(undefined);
  let selectOpen = $state<boolean | undefined>(undefined);
  let cancelClose = $state(false);
  let proposals = $state(0);
  let completions = $state(0);
  let shown = $state(true);
  const source = `<Dialog.Root bind:open>\n  <Dialog.Trigger>\n    {#snippet child({ props, children })}\n      <Button {...props}>{@render children?.()}</Button>\n    {/snippet}\n    Open preferences\n  </Dialog.Trigger>\n  <Dialog.Content>\n    <Dialog.Header>\n      <Dialog.Title>Preferences</Dialog.Title>\n      <Dialog.Description>Choose your defaults.</Dialog.Description>\n    </Dialog.Header>\n    <Dialog.Close>Done</Dialog.Close>\n  </Dialog.Content>\n</Dialog.Root>`;
</script>

<section id="dialog-review" class="review-card mb-6" aria-labelledby="dialog-heading">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Focused tasks</p>
      <h2 id="dialog-heading">Dialog</h2>
    </div>
    <span class="component-label">dialog</span>
  </div>
  <p>Open the dialog and choose a nested option. Escape closes the list first, then the dialog.</p>
  <div class="review-grid">
    <div class="scenario">
      <h3 class="review-subheading">Preferences with nested Select</h3>
      {#if shown}
        <Dialog.Root
          bind:open
          onOpenChange={(next, detail) => {
            proposals++;
            if (!next && cancelClose) detail.cancel();
          }}
          onCloseComplete={() => completions++}
        >
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
                >Workspace: {value ?? "unset"} · List open: {String(selectOpen)}</output
              >
            </div>
            <Dialog.Footer>
              <Button variant="secondary" onclick={() => (shown = false)}>Remove open dialog</Button
              >
              <Dialog.Close
                >{#snippet child({ props, children })}<Button {...props}
                    >{@render children?.()}</Button
                  >{/snippet}Done</Dialog.Close
              >
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      {:else}
        <Button variant="outline" onclick={() => (shown = true)}>Restore dialog</Button>
      {/if}
      <output class="review-output" aria-label="Dialog state" aria-live="polite"
        >Open: {String(open)} · Proposals: {proposals} · Completed closes: {completions}</output
      >
    </div>
    <div class="scenario">
      <h3 class="review-subheading">Close policy</h3>
      <Button
        variant="outline"
        aria-pressed={cancelClose}
        onclick={() => (cancelClose = !cancelClose)}
        >{cancelClose ? "Allow dialog closing" : "Cancel dialog closing"}</Button
      >
      <p>
        {cancelClose
          ? "The callback keeps the dialog open when a close is requested."
          : "Done, Escape, and the close icon can close the dialog."}
      </p>
      <p>Use Remove open dialog to check cleanup, then restore the example.</p>
    </div>
  </div>
  <details class="source-example">
    <summary>Source example</summary>
    <pre><code>{source}</code></pre>
  </details>
</section>
