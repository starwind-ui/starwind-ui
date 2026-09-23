<script lang="ts">
  import Textarea from "$lib/starwind-runtime/textarea";
  import { Button } from "$lib/starwind-runtime/button";
  let notes: string | null | undefined = $state(undefined);
  const draft = "The layout is ready for review. Please check the form labels and keyboard focus.";
  const sizes = ["sm", "md", "lg"] as const;
</script>

<form class="space-y-5" onsubmit={(event) => event.preventDefault()}>
  <div class="space-y-2">
    <label for="project-notes" class="block text-sm font-medium">Project notes</label><Textarea
      id="project-notes"
      name="notes"
      rows={4}
      defaultValue={draft}
      bind:value={notes}
      aria-describedby="notes-hint"
      maxlength={240}
    />
    <div class="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
      <p id="notes-hint">Share a short update with your team.</p>
      <p data-notes-count>{(notes ?? draft).length} / 240</p>
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-3">
    <Button type="reset" variant="outline" size="sm">Reset draft</Button><span
      class="text-sm text-muted-foreground">The saved draft returns when you reset.</span
    >
  </div>
  <div class="grid gap-4 sm:grid-cols-3">
    {#each sizes as size}<div class="space-y-2">
        <label class="block text-sm font-medium" for={`textarea-size-${size}`}
          >{size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}</label
        ><Textarea id={`textarea-size-${size}`} {size} rows={2} placeholder="Add a note…" />
      </div>{/each}
  </div>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="space-y-2">
      <label for="textarea-error" class="block text-sm font-medium">Required summary</label
      ><Textarea
        id="textarea-error"
        rows={2}
        aria-invalid="true"
        aria-describedby="textarea-error-message"
        data-error-visible
        placeholder="Enter a summary"
      />
      <p id="textarea-error-message" class="text-sm text-muted-foreground">
        Add a summary before you continue.
      </p>
    </div>
    <div class="space-y-2">
      <label for="textarea-disabled" class="block text-sm font-medium">Archived note</label
      ><Textarea id="textarea-disabled" rows={2} disabled defaultValue="This note is archived." />
      <p class="text-sm text-muted-foreground">Archived notes are read only.</p>
    </div>
  </div>
</form>
