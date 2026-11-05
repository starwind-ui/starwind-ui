<script setup lang="ts">
import {
  Dialog as SDialog,
  DialogClose as SDialogClose,
  DialogContent as SDialogContent,
  DialogTitle as SDialogTitle,
  DialogTrigger as SDialogTrigger,
} from "@conformance/styled-vue/dialog";
import {
  Tooltip as STooltip,
  TooltipContent as STooltipContent,
  TooltipTrigger as STooltipTrigger,
} from "@conformance/styled-vue/tooltip";
import { Dialog } from "@starwind-ui/vue/dialog";
import { Select } from "@starwind-ui/vue/select";
import { Tooltip } from "@starwind-ui/vue/tooltip";
import MyButton from "./parts/MyButton.vue";
</script>

<template>
  <main>
    <Dialog.Root>
      <Dialog.Trigger as-child>
        <button type="button" data-testid="pn-trigger">Open</button>
      </Dialog.Trigger>
      <Dialog.Popup data-testid="pn-popup">
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Close as-child>
          <button type="button" data-testid="pn-close">Close</button>
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Root>

    <Dialog.Root>
      <Dialog.Trigger as-child>
        <MyButton data-testid="pc-trigger">Open</MyButton>
      </Dialog.Trigger>
      <Dialog.Popup data-testid="pc-popup">
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Close as-child>
          <MyButton data-testid="pc-close">Close</MyButton>
        </Dialog.Close>
      </Dialog.Popup>
    </Dialog.Root>

    <SDialog>
      <SDialogTrigger as-child>
        <button type="button" data-testid="sn-trigger">Open</button>
      </SDialogTrigger>
      <SDialogContent data-testid="sn-popup">
        <SDialogTitle>Title</SDialogTitle>
        <SDialogClose as-child>
          <button type="button" data-testid="sn-close">Close</button>
        </SDialogClose>
      </SDialogContent>
    </SDialog>

    <SDialog>
      <SDialogTrigger as-child>
        <MyButton data-testid="sc-trigger">Open</MyButton>
      </SDialogTrigger>
      <SDialogContent data-testid="sc-popup">
        <SDialogTitle>Title</SDialogTitle>
        <SDialogClose as-child>
          <MyButton data-testid="sc-close">Close</MyButton>
        </SDialogClose>
      </SDialogContent>
    </SDialog>

    <Select.Root>
      <Select.Trigger as-child>
        <button type="button" data-testid="en-trigger">Open</button>
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
      <Select.Trigger as-child>
        <MyButton data-testid="ec-trigger">Open</MyButton>
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup data-testid="ec-popup">
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>

    <Tooltip.Root :open-delay="0" :close-delay="0">
      <Tooltip.Trigger as-child>
        <button type="button" data-testid="tb-trigger">Button</button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="tb-popup">Tip</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>

    <Tooltip.Root :open-delay="0" :close-delay="0">
      <Tooltip.Trigger as-child>
        <a href="#link" data-testid="tl-trigger">Link</a>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="tl-popup">Tip</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>

    <Tooltip.Root :open-delay="0" :close-delay="0">
      <Tooltip.Trigger data-testid="tt-trigger">Text</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="tt-popup">Tip</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>

    <STooltip :open-delay="0" :close-delay="0">
      <STooltipTrigger as-child>
        <button type="button" data-testid="ub-trigger">Button</button>
      </STooltipTrigger>
      <STooltipContent data-testid="ub-popup">Tip</STooltipContent>
    </STooltip>

    <STooltip :open-delay="0" :close-delay="0">
      <STooltipTrigger as-child>
        <a href="#link" data-testid="ul-trigger">Link</a>
      </STooltipTrigger>
      <STooltipContent data-testid="ul-popup">Tip</STooltipContent>
    </STooltip>

    <STooltip :open-delay="0" :close-delay="0">
      <STooltipTrigger data-testid="ut-trigger">Text</STooltipTrigger>
      <STooltipContent data-testid="ut-popup">Tip</STooltipContent>
    </STooltip>
  </main>
</template>
