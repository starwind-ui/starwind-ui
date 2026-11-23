---
"@starwind-ui/svelte": minor
"starwind": patch
---

The Svelte Alert Dialog package export `getAlertDialogControlRefresh` is removed. It is replaced by `__useAlertDialogControl()`, the same helper name that React and Vue use. In Svelte, it returns an attachment that you spread on the control element.

Copied Styled `AlertDialogAction.svelte` and `AlertDialogCancel.svelte` files from an older release import the removed export. When you update `@starwind-ui/svelte`, run `starwind update alert-dialog` in the same step. If you keep your own copies, change the import to `__useAlertDialogControl` and delete the old `createAttachmentKey` block. Call the helper once in the component script, then spread the result on the button. Keep the `data-sw-alert-dialog-close` attribute, because the dialog uses it to find the button that closes it:

```svelte
<script lang="ts">
  const controlAttachment = __useAlertDialogControl();
</script>

<Button data-sw-alert-dialog-close {...controlAttachment}>Continue</Button>
```
