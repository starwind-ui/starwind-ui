<script setup lang="ts">
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Dialog } from "@starwind-ui/vue/dialog";
import { Input } from "@starwind-ui/vue/input";
import { Menu } from "@starwind-ui/vue/menu";
import { Select } from "@starwind-ui/vue/select";
import { Slider } from "@starwind-ui/vue/slider";
import { Switch } from "@starwind-ui/vue/switch";
import { Tabs } from "@starwind-ui/vue/tabs";
import { Toggle } from "@starwind-ui/vue/toggle";
import { ToggleGroup } from "@starwind-ui/vue/toggle-group";
import { Tooltip } from "@starwind-ui/vue/tooltip";
</script>

<template>
  <main>
    <Select.Root data-testid="as-root" name="as">
      <Select.Trigger data-testid="as-trigger">
        <Select.Value data-testid="as-value" placeholder="Pick" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup data-testid="as-popup">
          <Select.List>
            <Select.Item value="a" data-testid="as-item-a">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="b" data-testid="as-item-b">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>

    <Combobox.Root data-testid="ac-root" name="ac">
      <Combobox.InputGroup>
        <Combobox.Input data-testid="ac-input" />
        <Combobox.Trigger data-testid="ac-trigger">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup data-testid="ac-popup">
          <Combobox.List>
            <Combobox.Item value="a" data-testid="ac-item-a">
              <Combobox.ItemText>Apple</Combobox.ItemText>
            </Combobox.Item>
            <Combobox.Item value="b" data-testid="ac-item-b">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>

    <Checkbox.Root data-testid="ak-root">
      <Checkbox.Indicator data-testid="ak-indicator" />
    </Checkbox.Root>

    <Switch.Root data-testid="aw-root">
      <Switch.Thumb data-testid="aw-thumb" />
    </Switch.Root>

    <Slider.Root data-testid="al-root" :default-value="20">
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="al-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>

    <Input.Root data-testid="ai-root" default-value="hello" />

    <Tabs.Root data-testid="at-root" default-value="one">
      <Tabs.List data-testid="at-list">
        <Tabs.Tab value="one" data-testid="at-tab-one">One</Tabs.Tab>
        <Tabs.Tab value="two" data-testid="at-tab-two">Two</Tabs.Tab>
        <Tabs.Tab value="three" data-testid="at-tab-three">Three</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one" data-testid="at-panel-one">Panel one</Tabs.Panel>
      <Tabs.Panel value="two" data-testid="at-panel-two">Panel two</Tabs.Panel>
      <Tabs.Panel value="three" data-testid="at-panel-three">Panel three</Tabs.Panel>
    </Tabs.Root>

    <Dialog.Root data-testid="ad-root">
      <Dialog.Trigger data-testid="ad-trigger">Open</Dialog.Trigger>
      <Dialog.Popup data-testid="ad-popup">
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Close data-testid="ad-close">Close</Dialog.Close>
      </Dialog.Popup>
    </Dialog.Root>

    <Menu.Root data-testid="am-root">
      <Menu.Trigger data-testid="am-trigger">Open</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Popup data-testid="am-popup">
          <Menu.Item data-testid="am-item">Item</Menu.Item>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>

    <ToggleGroup.Root data-testid="ag-root">
      <Toggle.Root value="a" data-testid="ag-a">A</Toggle.Root>
      <Toggle.Root value="b" data-testid="ag-b">B</Toggle.Root>
      <Toggle.Root value="c" data-testid="ag-c">C</Toggle.Root>
    </ToggleGroup.Root>

    <Tooltip.Root data-testid="ao-root" :open-delay="0" :close-delay="0">
      <Tooltip.Trigger data-testid="ao-trigger">Hover</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup data-testid="ao-popup">Tip</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  </main>
</template>
