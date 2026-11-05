<script setup lang="ts">
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Dialog } from "@starwind-ui/vue/dialog";
import { Input } from "@starwind-ui/vue/input";
import { Select } from "@starwind-ui/vue/select";
import { Switch } from "@starwind-ui/vue/switch";
import { Tabs } from "@starwind-ui/vue/tabs";
import { record, recordModel, refused } from "../shared/harness";
import ComboboxParts from "./parts/ComboboxParts.vue";
import DialogParts from "./parts/DialogParts.vue";
import SelectParts from "./parts/SelectParts.vue";
import TabsParts from "./parts/TabsParts.vue";
import { useParent } from "./parts/use-parent";

const comboText = useParent("cc", "");
const comboValue = useParent<string | null>("cv", null);
const wrappedValue = useParent<string | null>("cw", null);
const dialogOpen = useParent("dp", false);
const selectValue = useParent<string | null>("sp", "a");
const tab = useParent<string | null>("tp", "one");
const checked = useParent("kp", false);
const switched = useParent("wp", false);
const inputValue = useParent("ip", "hello");

function accept(id: string, name: string, value: unknown, write: () => void) {
  recordModel(id, name, value);
  if (!refused(id)) write();
}
</script>

<template>
  <main>
    <button type="button" data-testid="outside">Outside</button>

    <Combobox.Root
      data-testid="cu-root"
      @value-change="(value, details) => record('cu', 'value', value, details)"
      @input-value-change="(value, details) => record('cu', 'input', value, details)"
      @open-change="(value, details) => record('cu', 'open', value, details)"
      @update:model-value="(value) => recordModel('cu', 'value', value)"
      @update:input-value="(value) => recordModel('cu', 'input', value)"
    >
      <ComboboxParts id="cu" />
    </Combobox.Root>

    <Combobox.Root
      data-testid="cc-root"
      :input-value="comboText"
      @value-change="(value, details) => record('cc', 'value', value, details)"
      @input-value-change="(value, details) => record('cc', 'input', value, details)"
      @open-change="(value, details) => record('cc', 'open', value, details)"
      @update:input-value="(value) => accept('cc', 'input', value, () => (comboText = value))"
    >
      <ComboboxParts id="cc" />
    </Combobox.Root>

    <Combobox.Root
      data-testid="cv-root"
      :model-value="comboValue"
      @value-change="(value, details) => record('cv', 'value', value, details)"
      @input-value-change="(value, details) => record('cv', 'input', value, details)"
      @open-change="(value, details) => record('cv', 'open', value, details)"
      @update:model-value="(value) => accept('cv', 'value', value, () => (comboValue = value))"
    >
      <ComboboxParts id="cv" />
    </Combobox.Root>

    <Combobox.Root v-model="wrappedValue" data-testid="cw-root">
      <ComboboxParts id="cw" />
    </Combobox.Root>

    <Dialog.Root
      data-testid="du-root"
      @open-change="(value, details) => record('du', 'open', value, details)"
    >
      <DialogParts id="du" />
    </Dialog.Root>

    <Dialog.Root
      data-testid="dp-root"
      :open="dialogOpen"
      @open-change="(value, details) => record('dp', 'open', value, details)"
      @update:open="(value) => accept('dp', 'open', value, () => (dialogOpen = value))"
    >
      <DialogParts id="dp" />
    </Dialog.Root>

    <Select.Root
      data-testid="su-root"
      @value-change="(value, details) => record('su', 'value', value, details)"
      @open-change="(value, details) => record('su', 'open', value, details)"
    >
      <SelectParts id="su" />
    </Select.Root>

    <Select.Root
      data-testid="sp-root"
      :model-value="selectValue"
      @value-change="(value, details) => record('sp', 'value', value, details)"
      @update:model-value="(value) => accept('sp', 'value', value, () => (selectValue = value))"
    >
      <SelectParts id="sp" />
    </Select.Root>

    <Select.Root
      data-testid="sw-root"
      @value-change="(value, details) => record('sw', 'value', value, details)"
    >
      <SelectParts id="sw" />
    </Select.Root>

    <Tabs.Root
      data-testid="tu-root"
      default-value="one"
      @value-change="(value, details) => record('tu', 'value', value, details)"
    >
      <TabsParts id="tu" />
    </Tabs.Root>

    <Tabs.Root
      data-testid="tp-root"
      :model-value="tab"
      @value-change="(value, details) => record('tp', 'value', value, details)"
      @update:model-value="(value) => accept('tp', 'value', value, () => (tab = value))"
    >
      <TabsParts id="tp" />
    </Tabs.Root>

    <Checkbox.Root
      data-testid="ku-root"
      @checked-change="(value, details) => record('ku', 'checked', value, details)"
    >
      <Checkbox.Indicator />
    </Checkbox.Root>

    <Checkbox.Root
      data-testid="kp-root"
      :checked="checked"
      @checked-change="(value, details) => record('kp', 'checked', value, details)"
      @update:checked="(value) => accept('kp', 'checked', value, () => (checked = value))"
    >
      <Checkbox.Indicator />
    </Checkbox.Root>

    <Switch.Root
      data-testid="wp-root"
      :checked="switched"
      @checked-change="(value, details) => record('wp', 'checked', value, details)"
      @update:checked="(value) => accept('wp', 'checked', value, () => (switched = value))"
    >
      <Switch.Thumb />
    </Switch.Root>

    <Input.Root
      data-testid="ip-root"
      :model-value="inputValue"
      @value-change="(value, details) => record('ip', 'value', value, details)"
      @update:model-value="(value) => accept('ip', 'value', value, () => (inputValue = value))"
    />
  </main>
</template>
