<script lang="ts">
  import { onMount } from "svelte";
  import { Button } from "./components/starwind/button/index.js";
  import Checkbox from "./components/starwind/checkbox/index.js";
  import Select from "./components/starwind/select/index.js";
  import Dialog from "./components/starwind/dialog/index.js";
  import { ThemeToggle } from "./components/starwind/theme-toggle/index.js";
  import { initThemeController } from "@starwind-ui/svelte/theme";
  let { navigationHref }: { navigationHref?: string } = $props();
  let checked = $state<boolean | undefined>(undefined),
    open = $state<boolean | undefined>(undefined),
    selectOpen = $state<boolean | undefined>(undefined);
  let value = $state<string | null | undefined>(undefined);
  let second = $state(false);
  let clicks = 0;
  let cancel = true;
  export function acceptCheckbox() {
    cancel = false;
  }
  const callbacks = { checked: 0, dialog: 0, value: 0, select: 0 };
  const refs = { setups: 0, cleanups: 0 };
  const ref = (element: HTMLElement | null) => {
    if (element) refs.setups++;
    else refs.cleanups++;
  };
  const alternate = (element: HTMLButtonElement | null) => ref(element);
  onMount(() => {
    const controller = initThemeController(document);
    return () => controller.destroy();
  });
  export function replaceRef() {
    second = true;
  }
  export function snapshot() {
    return {
      clicks,
      checked,
      open,
      value,
      selectOpen,
      callbacks: { ...callbacks },
      refs: { ...refs },
    };
  }
</script>

<Button data-test="button" {ref} onclick={() => clicks++}>Click</Button>
<Checkbox
  data-test="checkbox"
  id="choice"
  label="Choose"
  defaultChecked
  bind:checked
  {ref}
  onCheckedChange={(_next, detail) => {
    if (cancel) detail.cancel();
    else callbacks.checked++;
  }}
/>
<ThemeToggle data-test="theme" {ref} />
<Dialog.Root bind:open onOpenChange={() => callbacks.dialog++}>
  <Dialog.Trigger data-test="trigger" ref={second ? alternate : ref}
    >{#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button
      >{/snippet}Open</Dialog.Trigger
  >
  <Dialog.Content data-test="dialog" {ref}>
    <Dialog.Header
      ><Dialog.Title>Compatible dialog</Dialog.Title><Dialog.Description
        >Choose an item</Dialog.Description
      ></Dialog.Header
    >
    <Select.Root
      bind:value
      bind:open={selectOpen}
      defaultValue="alpha"
      onValueChange={() => callbacks.value++}
      onOpenChange={() => callbacks.select++}
    >
      <Select.Trigger data-test="select" {ref}
        >{#snippet child({ props, children })}<Button {...props}>{@render children?.()}</Button
          >{/snippet}<Select.Value placeholder="Choose"
          >{#snippet children(label, selected)}{label ?? selected}{/snippet}</Select.Value
        ></Select.Trigger
      >
      <Select.Content
        ><Select.Item value="alpha">Alpha</Select.Item><Select.Item value="beta">Beta</Select.Item
        ></Select.Content
      >
    </Select.Root>
    {#if navigationHref}<a data-test="away" href={navigationHref}>Leave with dialog open</a>{/if}
    <Dialog.Footer><Dialog.Close data-test="close">Close</Dialog.Close></Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
