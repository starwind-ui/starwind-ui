<script lang="ts">
  import {
    Dialog as SDialog,
    DialogClose as SDialogClose,
    DialogContent as SDialogContent,
    DialogTitle as SDialogTitle,
    DialogTrigger as SDialogTrigger,
  } from "@conformance/styled-svelte/dialog";
  import {
    Tooltip as STooltip,
    TooltipContent as STooltipContent,
    TooltipTrigger as STooltipTrigger,
  } from "@conformance/styled-svelte/tooltip";
  import { Dialog } from "@starwind-ui/svelte/dialog";
  import { Select } from "@starwind-ui/svelte/select";
  import { Tooltip } from "@starwind-ui/svelte/tooltip";
  import MyButton from "./parts/MyButton.svelte";
</script>

<main>
  <Dialog.Root>
    <Dialog.Trigger>
      {#snippet child({ props })}
        <button {...props} data-testid="pn-trigger">Open</button>
      {/snippet}
    </Dialog.Trigger>
    <Dialog.Popup data-testid="pn-popup">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Close>
        {#snippet child({ props })}
          <button {...props} data-testid="pn-close">Close</button>
        {/snippet}
      </Dialog.Close>
    </Dialog.Popup>
  </Dialog.Root>

  <Dialog.Root>
    <Dialog.Trigger>
      {#snippet child({ props })}
        <MyButton {...props} data-testid="pc-trigger">Open</MyButton>
      {/snippet}
    </Dialog.Trigger>
    <Dialog.Popup data-testid="pc-popup">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Close>
        {#snippet child({ props })}
          <MyButton {...props} data-testid="pc-close">Close</MyButton>
        {/snippet}
      </Dialog.Close>
    </Dialog.Popup>
  </Dialog.Root>

  <SDialog>
    <SDialogTrigger>
      {#snippet child({ props })}
        <button {...props} data-testid="sn-trigger">Open</button>
      {/snippet}
    </SDialogTrigger>
    <SDialogContent data-testid="sn-popup">
      <SDialogTitle>Title</SDialogTitle>
      <SDialogClose>
        {#snippet child({ props })}
          <button {...props} data-testid="sn-close">Close</button>
        {/snippet}
      </SDialogClose>
    </SDialogContent>
  </SDialog>

  <SDialog>
    <SDialogTrigger>
      {#snippet child({ props })}
        <MyButton {...props} data-testid="sc-trigger">Open</MyButton>
      {/snippet}
    </SDialogTrigger>
    <SDialogContent data-testid="sc-popup">
      <SDialogTitle>Title</SDialogTitle>
      <SDialogClose>
        {#snippet child({ props })}
          <MyButton {...props} data-testid="sc-close">Close</MyButton>
        {/snippet}
      </SDialogClose>
    </SDialogContent>
  </SDialog>

  <Select.Root>
    <Select.Trigger>
      {#snippet child({ props })}
        <button {...props} data-testid="en-trigger">Open</button>
      {/snippet}
    </Select.Trigger>
    <Select.Positioner>
      <Select.Popup data-testid="en-popup">
        <Select.List>
          <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Root>

  <Select.Root>
    <Select.Trigger>
      {#snippet child({ props })}
        <MyButton {...props} data-testid="ec-trigger">Open</MyButton>
      {/snippet}
    </Select.Trigger>
    <Select.Positioner>
      <Select.Popup data-testid="ec-popup">
        <Select.List>
          <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  </Select.Root>

  <Tooltip.Root openDelay={0} closeDelay={0}>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <button {...props} data-testid="tb-trigger">Button</button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup data-testid="tb-popup">Tip</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>

  <Tooltip.Root openDelay={0} closeDelay={0}>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <a {...props} href="#link" data-testid="tl-trigger">Link</a>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup data-testid="tl-popup">Tip</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>

  <Tooltip.Root openDelay={0} closeDelay={0}>
    <Tooltip.Trigger data-testid="tt-trigger">Text</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup data-testid="tt-popup">Tip</Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>

  <STooltip openDelay={0} closeDelay={0}>
    <STooltipTrigger>
      {#snippet child({ props })}
        <button {...props} data-testid="ub-trigger">Button</button>
      {/snippet}
    </STooltipTrigger>
    <STooltipContent data-testid="ub-popup">Tip</STooltipContent>
  </STooltip>

  <STooltip openDelay={0} closeDelay={0}>
    <STooltipTrigger>
      {#snippet child({ props })}
        <a {...props} href="#link" data-testid="ul-trigger">Link</a>
      {/snippet}
    </STooltipTrigger>
    <STooltipContent data-testid="ul-popup">Tip</STooltipContent>
  </STooltip>

  <STooltip openDelay={0} closeDelay={0}>
    <STooltipTrigger data-testid="ut-trigger">Text</STooltipTrigger>
    <STooltipContent data-testid="ut-popup">Tip</STooltipContent>
  </STooltip>
</main>
