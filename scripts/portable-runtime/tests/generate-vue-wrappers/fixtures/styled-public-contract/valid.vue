<script setup lang="ts">
import { ref } from "vue";

import { AvatarImage, type AvatarImageProps } from "#styled/avatar";
import { Button, type ButtonProps } from "#styled/button";
import { Checkbox } from "#styled/checkbox";
import { CheckboxGroup } from "#styled/checkbox-group";
import { Dropzone, DropzoneFilesList, type DropzoneProps } from "#styled/dropzone";
import { Progress } from "#styled/progress";
import { RadioGroup, type RadioGroupProps } from "#styled/radio-group";
import { ScrollArea } from "#styled/scroll-area";
import { Select, SelectTrigger, SelectValue } from "#styled/select";
import { Switch, type SwitchProps } from "#styled/switch";
import { ThemeToggle } from "#styled/theme-toggle";
import { Toggle } from "#styled/toggle";
import { ToggleGroup } from "#styled/toggle-group";

const checked = ref(false);
const checkedValues = ref(["alpha"]);
const open = ref(false);
const selected = ref<string | null>(null);
const pressed = ref(false);
const button = ref<InstanceType<typeof Button> | null>(null);
const checkbox = ref<InstanceType<typeof Checkbox> | null>(null);
const select = ref<InstanceType<typeof Select> | null>(null);
const toggle = ref<InstanceType<typeof Toggle> | null>(null);

const buttonProps: ButtonProps = {
  autofocus: true,
  id: "save",
  onClick: (event) => event.preventDefault(),
  type: "submit",
};
const imageProps: AvatarImageProps = { alt: "Profile", loading: "lazy", src: "/profile.png" };
const dropzoneProps: DropzoneProps = {
  accept: "image/*",
  "aria-describedby": "profile-help",
  "aria-invalid": "true",
  id: "profile-dropzone",
  multiple: true,
};
const switchProps: SwitchProps = {
  "aria-describedby": "notifications-help",
  "aria-label": "Enable notifications",
  "aria-labelledby": "notifications-label",
  autofocus: true,
  id: "notifications",
  name: "notifications",
  title: "Notification preference",
};
const radioGroupProps: RadioGroupProps = {
  "aria-label": "Consumer choice",
  legend: "Default choice",
};

const buttonElement: HTMLAnchorElement | HTMLButtonElement | null | undefined =
  button.value?.element;
const checkboxElement: HTMLElement | null | undefined = checkbox.value?.element;
const selectElement: HTMLDivElement | null | undefined = select.value?.element;
const toggleElement: HTMLButtonElement | HTMLSpanElement | null | undefined = toggle.value?.element;
void [buttonElement, checkboxElement, selectElement, toggleElement];
</script>

<template>
  <Button ref="button" v-bind="buttonProps">Save</Button>
  <Checkbox
    ref="checkbox"
    v-model:checked="checked"
    aria-label="Accept terms"
    @checked-change="(_value, detail) => detail.cancel()"
  />
  <CheckboxGroup v-model="checkedValues" @value-change="(_value, detail) => detail.cancel()">
    <Checkbox value="alpha" />
  </CheckboxGroup>
  <Select
    ref="select"
    v-model="selected"
    v-model:open="open"
    aria-label="Fruit"
    @open-change="(_value, detail) => detail.cancel()"
    @value-change="(_value, detail) => detail.cancel()"
  >
    <SelectTrigger>
      <SelectValue placeholder="Choose fruit" />
      <template #icon><span aria-hidden="true">v</span></template>
    </SelectTrigger>
  </Select>
  <AvatarImage v-bind="imageProps" @loading-status-change="() => undefined" />
  <Dropzone v-bind="dropzoneProps" @files-change="() => undefined" />
  <DropzoneFilesList aria-live="assertive" />
  <Progress aria-label="Upload progress" :value="25" />
  <RadioGroup v-bind="radioGroupProps" />
  <ScrollArea aria-label="Messages" />
  <Switch v-bind="switchProps" />
  <ThemeToggle aria-label="Toggle theme">
    <template #light-icon><span>Light</span></template>
    <template #dark-icon><span>Dark</span></template>
  </ThemeToggle>
  <Toggle
    ref="toggle"
    v-model:pressed="pressed"
    aria-label="Pin message"
    @pressed-change="(_value, detail) => detail.cancel()"
  >
    Pin
  </Toggle>
  <ToggleGroup :spacing="3" style="color: rebeccapurple" />
</template>
