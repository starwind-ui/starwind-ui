<script setup lang="ts">
import { Checkbox } from "@conformance/styled-vue/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
} from "@conformance/styled-vue/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@conformance/styled-vue/dialog";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@conformance/styled-vue/dropdown";
import { Input } from "@conformance/styled-vue/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@conformance/styled-vue/select";
import { Slider } from "@conformance/styled-vue/slider";
import { Switch } from "@conformance/styled-vue/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@conformance/styled-vue/tabs";
import { Textarea } from "@conformance/styled-vue/textarea";
import { ToggleGroup, ToggleGroupItem } from "@conformance/styled-vue/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@conformance/styled-vue/tooltip";
</script>

<template>
  <main>
    <Select data-testid="as-root" name="as">
      <SelectTrigger data-testid="as-trigger">
        <SelectValue data-testid="as-value" placeholder="Pick" />
      </SelectTrigger>
      <SelectContent data-testid="as-popup">
        <SelectItem value="a" data-testid="as-item-a">Apple</SelectItem>
        <SelectItem value="b" data-testid="as-item-b">Banana</SelectItem>
      </SelectContent>
    </Select>

    <Combobox data-testid="ac-root" name="ac">
      <ComboboxInputGroup>
        <ComboboxInput data-testid="ac-input" :show-trigger="false" />
        <ComboboxTrigger data-testid="ac-trigger" />
      </ComboboxInputGroup>
      <ComboboxContent data-testid="ac-popup">
        <ComboboxItem value="a" data-testid="ac-item-a">Apple</ComboboxItem>
        <ComboboxItem value="b" data-testid="ac-item-b">Banana</ComboboxItem>
      </ComboboxContent>
    </Combobox>

    <Checkbox data-testid="ak-root" />

    <Switch data-testid="aw-root" />

    <Slider data-testid="al-root" :default-value="20" />

    <Input data-testid="ai-root" default-value="hello" />

    <Textarea data-testid="ax-root" />

    <Tabs data-testid="at-root" default-value="one">
      <TabsList data-testid="at-list">
        <TabsTrigger value="one" data-testid="at-tab-one">One</TabsTrigger>
        <TabsTrigger value="two" data-testid="at-tab-two">Two</TabsTrigger>
        <TabsTrigger value="three" data-testid="at-tab-three">Three</TabsTrigger>
      </TabsList>
      <TabsContent value="one" data-testid="at-panel-one">Panel one</TabsContent>
      <TabsContent value="two" data-testid="at-panel-two">Panel two</TabsContent>
      <TabsContent value="three" data-testid="at-panel-three">Panel three</TabsContent>
    </Tabs>

    <Dialog data-testid="ad-root">
      <DialogTrigger data-testid="ad-trigger">Open</DialogTrigger>
      <DialogContent data-testid="ad-popup">
        <DialogTitle>Title</DialogTitle>
        <DialogClose data-testid="ad-close">Close</DialogClose>
      </DialogContent>
    </Dialog>

    <Dropdown data-testid="am-root">
      <DropdownTrigger data-testid="am-trigger">Open</DropdownTrigger>
      <DropdownContent data-testid="am-popup">
        <DropdownItem data-testid="am-item">Item</DropdownItem>
      </DropdownContent>
    </Dropdown>

    <ToggleGroup data-testid="ag-root">
      <ToggleGroupItem value="a" data-testid="ag-a">A</ToggleGroupItem>
      <ToggleGroupItem value="b" data-testid="ag-b">B</ToggleGroupItem>
      <ToggleGroupItem value="c" data-testid="ag-c">C</ToggleGroupItem>
    </ToggleGroup>

    <Tooltip data-testid="ao-root" :open-delay="0" :close-delay="0">
      <TooltipTrigger data-testid="ao-trigger">Hover</TooltipTrigger>
      <TooltipContent data-testid="ao-popup">Tip</TooltipContent>
    </Tooltip>
  </main>
</template>
