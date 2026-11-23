<script setup lang="ts">
import { Avatar } from "@starwind-ui/vue/avatar";
import { Menu } from "@starwind-ui/vue/menu";
import { Popover } from "@starwind-ui/vue/popover";
import { Toggle } from "@starwind-ui/vue/toggle";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { record } from "../shared/harness";
import { useLate } from "./parts/use-late";

const { value: ph } = useLate("ph", true);
const { value: pb } = useLate("pb", false);
const { value: th } = useLate("th", true);
const { value: tb } = useLate("tb", false);
const { value: tl } = useLate("tl");
const { value: mh } = useLate("mh", true);
const { value: mb } = useLate("mb", false);
const { value: av } = useLate("av", false);
const { value: mdl } = useLate("mdl", true);

const wrapper = ref<HTMLDivElement | null>(null);
const ancestor = (event: Event) =>
  record("av", "ancestor", (event as CustomEvent<{ status: string }>).detail.status);
onMounted(() => wrapper.value?.addEventListener("starwind:loading-status-change", ancestor));
onBeforeUnmount(() =>
  wrapper.value?.removeEventListener("starwind:loading-status-change", ancestor),
);
</script>

<template>
  <main>
    <Toggle.Root default-pressed data-testid="td-root">Default</Toggle.Root>
    <Toggle.Root v-model:pressed="th" data-testid="th-root">Held</Toggle.Root>
    <Toggle.Root v-model:pressed="tb" default-pressed data-testid="tb-root">Both</Toggle.Root>
    <Toggle.Root v-model:pressed="tl" default-pressed data-testid="tl-root">Late</Toggle.Root>

    <Menu.Root data-testid="md-root">
      <Menu.Trigger data-testid="md-trigger">Menu</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Popup data-testid="md-popup">
          <Menu.CheckboxItem default-checked data-testid="md-check">Default</Menu.CheckboxItem>
          <Menu.CheckboxItem v-model:checked="mh" data-testid="mh-check">Held</Menu.CheckboxItem>
          <Menu.CheckboxItem v-model:checked="mb" default-checked data-testid="mb-check">
            Both
          </Menu.CheckboxItem>
          <Menu.CheckboxItem :default-checked="mdl" data-testid="mdl-check">
            Late default
          </Menu.CheckboxItem>
          <Menu.RadioGroup>
            <Menu.RadioItem value="c" :default-checked="mdl" data-testid="mdl-radio"
              >C</Menu.RadioItem
            >
          </Menu.RadioGroup>
          <Menu.RadioGroup data-testid="mr-group">
            <Menu.RadioItem value="a" :checked="false" default-checked data-testid="mr-a">
              Held off
            </Menu.RadioItem>
            <Menu.RadioItem value="b" checked data-testid="mr-b">Held on</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.RadioGroup>
            <Menu.RadioItem value="a" default-checked data-testid="md-radio-a">A</Menu.RadioItem>
            <Menu.RadioItem value="b" data-testid="md-radio-b">B</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>

    <div ref="wrapper">
      <Avatar.Root v-if="av" data-testid="av-root">
        <Avatar.Image
          src="/conformance-avatar.png"
          alt="Avatar"
          @loading-status-change="(status) => record('av', 'callback', status)"
        />
      </Avatar.Root>
    </div>

    <Popover.Root default-open data-testid="pd-root">
      <Popover.Trigger>Default</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Popup>Default body</Popover.Popup>
      </Popover.Positioner>
    </Popover.Root>
    <Popover.Root v-model:open="ph" data-testid="ph-root">
      <Popover.Trigger>Held</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Popup>Held body</Popover.Popup>
      </Popover.Positioner>
    </Popover.Root>
    <Popover.Root v-model:open="pb" default-open data-testid="pb-root">
      <Popover.Trigger>Both</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Popup>Both body</Popover.Popup>
      </Popover.Positioner>
    </Popover.Root>
  </main>
</template>
