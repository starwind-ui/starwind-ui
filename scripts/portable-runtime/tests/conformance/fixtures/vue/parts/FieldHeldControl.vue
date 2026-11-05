<script setup lang="ts">
import { Checkbox as StyledCheckbox } from "@conformance/styled-vue/checkbox";
import {
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxTrigger,
  Combobox as StyledCombobox,
} from "@conformance/styled-vue/combobox";
import { Input as StyledInput } from "@conformance/styled-vue/input";
import {
  RadioGroupItem,
  RadioGroup as StyledRadioGroup,
} from "@conformance/styled-vue/radio-group";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select as StyledSelect,
} from "@conformance/styled-vue/select";
import { Slider as StyledSlider } from "@conformance/styled-vue/slider";
import { Switch as StyledSwitch } from "@conformance/styled-vue/switch";
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Input } from "@starwind-ui/vue/input";
import { Radio } from "@starwind-ui/vue/radio";
import { RadioGroup } from "@starwind-ui/vue/radio-group";
import { Select } from "@starwind-ui/vue/select";
import { Slider } from "@starwind-ui/vue/slider";
import { Switch } from "@starwind-ui/vue/switch";
import { computed, ref } from "vue";
import { parent, record, refused } from "../../shared/harness";

const props = defineProps<{ id: string; kind: string; styled: boolean; held: boolean }>();

const checks = props.kind === "chk" || props.kind === "swi";
const initial: unknown = checks
  ? false
  : props.kind === "sld"
    ? 20
    : props.kind === "inp"
      ? "hello"
      : "a";
const value = ref<unknown>(initial);
if (props.held) {
  parent(props.id, {
    write: (next) => {
      value.value = next;
    },
    read: () => value.value,
  });
}

const fixed = computed(() => (checks ? { value: "yes" } : {}));
const bound = computed<Record<string, unknown>>(() => {
  const log = (next: unknown, details: unknown) => record(props.id, "change", next, details);
  const eventName = checks ? "onCheckedChange" : "onValueChange";
  if (!props.held) {
    return {
      ...fixed.value,
      [checks ? "defaultChecked" : "defaultValue"]: initial,
      [eventName]: log,
    };
  }
  return {
    ...fixed.value,
    [checks ? "checked" : "modelValue"]: value.value,
    [eventName]: log,
    [checks ? "onUpdate:checked" : "onUpdate:modelValue"]: (next: unknown) => {
      if (!refused(props.id)) value.value = next;
    },
  };
});
</script>

<template>
  <template v-if="!styled">
    <Select.Root v-if="kind === 'sel'" :data-testid="`${id}-root`" v-bind="bound">
      <Select.Trigger :data-testid="`${id}-trigger`">
        <Select.Value :data-testid="`${id}-value`" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup>
          <Select.List>
            <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
            <Select.Item value="b" :data-testid="`${id}-item-b`">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>
    <Combobox.Root v-else-if="kind === 'cmb'" :data-testid="`${id}-root`" v-bind="bound">
      <Combobox.InputGroup>
        <Combobox.Input :data-testid="`${id}-input`" />
        <Combobox.Trigger :data-testid="`${id}-trigger`">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup>
          <Combobox.List>
            <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
            <Combobox.Item value="b" :data-testid="`${id}-item-b`">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>
    <Checkbox.Root v-else-if="kind === 'chk'" :data-testid="`${id}-root`" v-bind="bound">
      <Checkbox.Indicator />
    </Checkbox.Root>
    <Switch.Root v-else-if="kind === 'swi'" :data-testid="`${id}-root`" v-bind="bound">
      <Switch.Thumb />
    </Switch.Root>
    <Slider.Root v-else-if="kind === 'sld'" :data-testid="`${id}-root`" v-bind="bound">
      <Slider.Control>
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
    <RadioGroup.Root v-else-if="kind === 'rad'" :data-testid="`${id}-root`" v-bind="bound">
      <Radio.Root value="a"><Radio.Indicator /></Radio.Root>
      <Radio.Root value="b" :data-testid="`${id}-item-b`"><Radio.Indicator /></Radio.Root>
    </RadioGroup.Root>
    <Input.Root v-else :data-testid="`${id}-root`" v-bind="bound" />
  </template>
  <template v-else>
    <StyledSelect v-if="kind === 'sel'" :data-testid="`${id}-root`" v-bind="bound">
      <SelectTrigger :data-testid="`${id}-trigger`">
        <SelectValue :data-testid="`${id}-value`" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Apple</SelectItem>
        <SelectItem value="b" :data-testid="`${id}-item-b`">Banana</SelectItem>
      </SelectContent>
    </StyledSelect>
    <StyledCombobox v-else-if="kind === 'cmb'" :data-testid="`${id}-root`" v-bind="bound">
      <ComboboxInputGroup>
        <ComboboxInput :data-testid="`${id}-input`" :show-trigger="false" />
        <ComboboxTrigger :data-testid="`${id}-trigger`" />
      </ComboboxInputGroup>
      <ComboboxContent>
        <ComboboxItem value="a">Apple</ComboboxItem>
        <ComboboxItem value="b" :data-testid="`${id}-item-b`">Banana</ComboboxItem>
      </ComboboxContent>
    </StyledCombobox>
    <StyledCheckbox v-else-if="kind === 'chk'" :data-testid="`${id}-root`" v-bind="bound" />
    <StyledSwitch v-else-if="kind === 'swi'" :data-testid="`${id}-root`" v-bind="bound" />
    <StyledSlider v-else-if="kind === 'sld'" :data-testid="`${id}-root`" v-bind="bound" />
    <StyledRadioGroup v-else-if="kind === 'rad'" :data-testid="`${id}-root`" v-bind="bound">
      <RadioGroupItem value="a" />
      <RadioGroupItem value="b" :data-testid="`${id}-item-b`" />
    </StyledRadioGroup>
    <StyledInput v-else :data-testid="`${id}-root`" v-bind="bound" />
  </template>
</template>
