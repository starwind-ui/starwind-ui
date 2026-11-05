<script setup lang="ts">
import SInput from "@conformance/styled-vue/input/Input.vue";
import Textarea from "@conformance/styled-vue/textarea/Textarea.vue";
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Input } from "@starwind-ui/vue/input";
import { Select } from "@starwind-ui/vue/select";
import { Slider } from "@starwind-ui/vue/slider";
import { Switch } from "@starwind-ui/vue/switch";
import { useParent } from "./parts/use-parent";

const select = useParent<string | null>("fd-sel", "a");
const combobox = useParent<string | null>("fd-cmb", "a");
const checked = useParent("fd-chk", true);
const switched = useParent("fd-swi", true);
const slider = useParent<number | readonly number[]>("fd-sld", 20);
const input = useParent("fd-inp", "hello");
const styled = useParent("fd-sin", "hello");
const text = useParent("fd-txt", "hello");
</script>

<template>
  <form id="fd">
    <Select.Root v-model="select" name="sel" default-value="c">
      <Select.Trigger data-testid="fd-sel-trigger">
        <Select.Value data-testid="fd-sel-value" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
            <Select.Item value="b" data-testid="fd-sel-item-b">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
            <Select.Item value="c"><Select.ItemText>Cherry</Select.ItemText></Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
    <Combobox.Root v-model="combobox" name="cmb" default-value="c">
      <Combobox.InputGroup>
        <Combobox.Input data-testid="fd-cmb-input" />
        <Combobox.Trigger data-testid="fd-cmb-trigger">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
            <Combobox.Item value="b" data-testid="fd-cmb-item-b">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
            <Combobox.Item value="c"><Combobox.ItemText>Cherry</Combobox.ItemText></Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
    <Checkbox.Root
      v-model:checked="checked"
      :default-checked="false"
      name="chk"
      value="yes"
      data-testid="fd-chk"
    >
      <Checkbox.Indicator />
    </Checkbox.Root>
    <Switch.Root
      v-model:checked="switched"
      :default-checked="false"
      name="swi"
      value="yes"
      data-testid="fd-swi"
    >
      <Switch.Thumb />
    </Switch.Root>
    <Slider.Root v-model="slider" :default-value="50" name="sld">
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="fd-sld-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <Input.Root v-model="input" default-value="seed" name="inp" data-testid="fd-inp" />
    <SInput v-model="styled" default-value="seed" name="sin" data-testid="fd-sin" />
    <Textarea v-model="text" default-value="seed" name="txt" data-testid="fd-txt" />
  </form>
</template>
