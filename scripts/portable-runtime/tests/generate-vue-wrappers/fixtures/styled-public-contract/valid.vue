<script setup lang="ts">
import { ref } from "vue";

import { AvatarImage, type AvatarImageProps } from "#styled/avatar";
import { Button, type ButtonProps } from "#styled/button";
import { Checkbox } from "#styled/checkbox";
import { Progress } from "#styled/progress";
import { ScrollArea } from "#styled/scroll-area";
import { Select, SelectTrigger, SelectValue } from "#styled/select";
import { ThemeToggle } from "#styled/theme-toggle";

const checked = ref(false);
const open = ref(false);
const selected = ref<string | null>(null);
const button = ref<InstanceType<typeof Button> | null>(null);
const checkbox = ref<InstanceType<typeof Checkbox> | null>(null);
const select = ref<InstanceType<typeof Select> | null>(null);

const buttonProps: ButtonProps = {
  autofocus: true,
  id: "save",
  onClick: (event) => event.preventDefault(),
  type: "submit",
};
const imageProps: AvatarImageProps = { alt: "Profile", loading: "lazy", src: "/profile.png" };

const buttonElement: HTMLAnchorElement | HTMLButtonElement | null | undefined =
  button.value?.element;
const checkboxElement: HTMLElement | null | undefined = checkbox.value?.element;
const selectElement: HTMLDivElement | null | undefined = select.value?.element;
void [buttonElement, checkboxElement, selectElement];
</script>

<template>
  <Button ref="button" v-bind="buttonProps">Save</Button>
  <Checkbox
    ref="checkbox"
    v-model:checked="checked"
    aria-label="Accept terms"
    @checked-change="(_value, detail) => detail.cancel()"
  />
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
  <Progress aria-label="Upload progress" :value="25" />
  <ScrollArea aria-label="Messages" />
  <ThemeToggle aria-label="Toggle theme">
    <template #light-icon><span>Light</span></template>
    <template #dark-icon><span>Dark</span></template>
  </ThemeToggle>
</template>
