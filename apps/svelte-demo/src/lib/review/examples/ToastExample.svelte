<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Toaster,
    ToastTemplate,
    ToastItem,
    ToastTitle,
    ToastDescription,
    ToastAction,
    toast,
  } from "$lib/starwind-runtime/toast";

  let ready = $state(false);
  let custom = $state(false);
  let status = $state("Notifications appear at the bottom of the page.");
  const otherVariants = ["success", "error", "warning", "info", "loading"] as const;
  onMount(() => {
    let mounted = true;
    void tick().then(() => {
      if (mounted) ready = true;
    });
    return () => {
      mounted = false;
    };
  });

  function showNotification() {
    toast({
      id: "review-toast",
      title: "Changes saved",
      description: "Your workspace is up to date.",
      duration: 0,
      action: {
        label: "Undo",
        onClick: () => {
          status = "Changes restored.";
        },
      },
    });
    status = "Changes saved. Use Undo in the notification to restore them.";
  }

  function prepareExport() {
    void toast.promise(Promise.resolve("Export ready"), {
      loading: "Preparing export",
      success: (title) => ({ title, description: "Your file is ready to download.", duration: 0 }),
      error: "The export could not finish.",
    });
  }

  function showGroup() {
    toast("Workspace synced", {
      description: "Your latest changes are available.",
      duration: 0,
    });
    prepareExport();
    void toast
      .promise(Promise.reject(new Error("Upload failed")), {
        loading: "Uploading attachment",
        success: "Attachment uploaded",
        error: {
          title: "Upload failed",
          description: "Check your connection and try again.",
          duration: 0,
        },
      })
      .catch(() => {});
    status = "Hover over the notifications or focus a close button to expand the group.";
  }

  function changeTemplate() {
    toast.dismiss();
    custom = !custom;
    status = custom ? "Custom template selected." : "Default templates selected.";
  }
</script>

<div class="grid w-full max-w-lg gap-5" data-toast-example>
  <div>
    <h4 class="font-medium">Workspace notifications</h4>
    <p class="mt-1 text-sm text-muted-foreground">
      Show a notification, then use its action or close button.
    </p>
  </div>
  <div class="flex flex-wrap gap-2">
    <Button disabled={!ready} onclick={showNotification}>Show notification</Button>
    <Button variant="outline" disabled={!ready} onclick={showGroup}>Show notification group</Button>
    <Button variant="outline" disabled={!ready} onclick={prepareExport}>Prepare export</Button>
    <Button variant="outline" disabled={!ready} aria-pressed={custom} onclick={changeTemplate}>
      Custom template
    </Button>
    <Button variant="ghost" disabled={!ready} onclick={() => toast.dismiss()}>Dismiss all</Button>
  </div>
  <output class="text-sm text-muted-foreground" data-toast-status>{status}</output>
  <p class="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
    Toaster copies template markup. Use <code>action.onClick</code> for actions in a notification. Svelte
    handlers and state inside a template stay with the source.
  </p>

  {#snippet customTemplates()}
    <ToastTemplate>
      <ToastItem data-toast-custom>
        <span class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace update
        </span>
        <ToastTitle>Title</ToastTitle>
        <ToastDescription>Description</ToastDescription>
        <ToastAction>Action</ToastAction>
      </ToastItem>
    </ToastTemplate>
    {#each otherVariants as variant (variant)}
      <ToastTemplate {variant} />
    {/each}
  {/snippet}

  <Toaster
    position="bottom-right"
    duration={6000}
    limit={3}
    gap="0.75rem"
    peek="1rem"
    class="max-w-[calc(100vw-2rem)]"
    children={custom ? customTemplates : undefined}
  />
</div>
