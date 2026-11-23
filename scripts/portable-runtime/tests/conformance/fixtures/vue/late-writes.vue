<script setup lang="ts">
import { Accordion } from "@starwind-ui/vue/accordion";
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { CheckboxGroup } from "@starwind-ui/vue/checkbox-group";
import { ColorPicker } from "@starwind-ui/vue/color-picker";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Input } from "@starwind-ui/vue/input";
import { InputOtp } from "@starwind-ui/vue/input-otp";
import { Radio } from "@starwind-ui/vue/radio";
import { RadioGroup } from "@starwind-ui/vue/radio-group";
import { Select } from "@starwind-ui/vue/select";
import { Slider } from "@starwind-ui/vue/slider";
import { Switch } from "@starwind-ui/vue/switch";
import { Tabs } from "@starwind-ui/vue/tabs";
import { Toggle } from "@starwind-ui/vue/toggle";
import { ToggleGroup } from "@starwind-ui/vue/toggle-group";
import { parseColor } from "@starwind-ui/runtime/color-picker";
import { captureRuntimeEvents, record, recordModel, refused } from "../shared/harness";
import { shown, useLate } from "./parts/use-late";

captureRuntimeEvents();

function toColor(next: unknown): unknown {
  return typeof next === "string" ? (parseColor(next) ?? next) : next;
}

const { value: lsu, tick: lsuTick } = useLate("lsu");
const { value: lsa, tick: lsaTick } = useLate("lsa");
const { value: lsm, tick: lsmTick } = useLate("lsm");
const { value: lou, tick: louTick } = useLate("lou");
const { value: lom, tick: lomTick } = useLate("lom");
const { value: loc, tick: locTick } = useLate("loc", "12");
const { value: lcu, tick: lcuTick } = useLate("lcu", undefined, toColor);
const { value: lfu, tick: lfuTick } = useLate("lfu");
const { value: lcm, tick: lcmTick } = useLate("lcm", undefined, toColor);
const { value: tab, tick: tabTick } = useLate("tab");
const { value: acc, tick: accTick } = useLate("acc");
const { value: cbg, tick: cbgTick } = useLate("cbg");
const { value: chk, tick: chkTick } = useLate("chk");
const { value: swi, tick: swiTick } = useLate("swi");
const { value: rdg, tick: rdgTick } = useLate("rdg");
const { value: tgg, tick: tggTick } = useLate("tgg");
const { value: tgl, tick: tglTick } = useLate("tgl");
const { value: sel, tick: selTick } = useLate("sel");
const { value: cmb, tick: cmbTick } = useLate("cmb");
const { value: inp, tick: inpTick } = useLate("inp");

const items = ["a", "b", "c"];
const log = (id: string, event: string) => (value: unknown, details: unknown) =>
  record(id, event, shown(value), details);
const model = (id: string, name: string) => (value: unknown) => recordModel(id, name, shown(value));
function acceptLoc(value: string) {
  recordModel("loc", "value", value);
  if (!refused("loc")) loc.value = value;
}
</script>

<template>
  <main>
    <Slider.Root
      data-testid="lsu-root"
      :data-tick="lsuTick"
      :default-value="0"
      :model-value="lsu"
      @value-change="(value, details) => log('lsu', 'value')(value, details)"
      @update:model-value="(value) => model('lsu', 'value')(value)"
    >
      <Slider.Control class="late-slider">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="lsu-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>

    <Slider.Root
      data-testid="lsa-root"
      :data-tick="lsaTick"
      :default-value="[0, 100]"
      :model-value="lsa"
      @value-change="(value, details) => log('lsa', 'value')(value, details)"
      @update:model-value="(value) => model('lsa', 'value')(value)"
    >
      <Slider.Control class="late-slider" data-testid="lsa-control">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb :index="0" data-testid="lsa-thumb" />
          <Slider.Thumb :index="1" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>

    <Slider.Root
      v-model="lsm"
      data-testid="lsm-root"
      :data-tick="lsmTick"
      :max="100"
      @value-change="(value, details) => log('lsm', 'value')(value, details)"
      @update:model-value="(value) => model('lsm', 'value')(value)"
    >
      <Slider.Control class="late-slider">
        <Slider.Track>
          <Slider.Indicator />
          <Slider.Thumb data-testid="lsm-thumb" />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>

    <InputOtp.Root
      data-testid="lou-root"
      :data-tick="louTick"
      :model-value="lou"
      @value-change="(value, details) => log('lou', 'value')(value, details)"
      @update:model-value="(value) => model('lou', 'value')(value)"
    >
      <InputOtp.Group>
        <InputOtp.Slot v-for="index in 6" :key="index" :index="index - 1" />
      </InputOtp.Group>
    </InputOtp.Root>

    <InputOtp.Root
      v-model="lom"
      data-testid="lom-root"
      :data-tick="lomTick"
      @value-change="(value, details) => log('lom', 'value')(value, details)"
      @update:model-value="(value) => model('lom', 'value')(value)"
    >
      <InputOtp.Group>
        <InputOtp.Slot v-for="index in 6" :key="index" :index="index - 1" />
      </InputOtp.Group>
    </InputOtp.Root>

    <form id="late-form">
      <InputOtp.Root
        data-testid="loc-root"
        :data-tick="locTick"
        name="code"
        :model-value="loc"
        @value-change="(value, details) => log('loc', 'value')(value, details)"
        @update:model-value="acceptLoc"
      >
        <InputOtp.Group>
          <InputOtp.Slot v-for="index in 6" :key="index" :index="index - 1" />
        </InputOtp.Group>
      </InputOtp.Root>
    </form>

    <ColorPicker.Root
      data-testid="lcu-root"
      :data-tick="lcuTick"
      default-value="#0000ff"
      :model-value="lcu"
      @value-change="(value, details) => log('lcu', 'value')(value, details)"
      @update:model-value="(value) => model('lcu', 'value')(value)"
    >
      <ColorPicker.Swatch swatch-value="#ff0000" data-testid="lcu-swatch">Red</ColorPicker.Swatch>
    </ColorPicker.Root>

    <ColorPicker.Root
      data-testid="lfu-root"
      :data-tick="lfuTick"
      default-value="#0000ff"
      :format="lfu"
      @format-change="(value, details) => log('lfu', 'format')(value, details)"
      @update:format="(value) => model('lfu', 'format')(value)"
    >
      <ColorPicker.FormatSelect data-testid="lfu-select">
        <option value="hex">Hex</option>
        <option value="hsl">HSL</option>
        <option value="rgb">RGB</option>
      </ColorPicker.FormatSelect>
    </ColorPicker.Root>

    <ColorPicker.Root
      v-model="lcm"
      data-testid="lcm-root"
      :data-tick="lcmTick"
      default-value="#0000ff"
      @value-change="(value, details) => log('lcm', 'value')(value, details)"
      @update:model-value="(value) => model('lcm', 'value')(value)"
    >
      <ColorPicker.Swatch swatch-value="#ff0000" data-testid="lcm-swatch">Red</ColorPicker.Swatch>
    </ColorPicker.Root>

    <Tabs.Root
      data-testid="tab-root"
      :data-tick="tabTick"
      default-value="a"
      :model-value="tab"
      @value-change="(value, details) => log('tab', 'value')(value, details)"
      @update:model-value="(value) => model('tab', 'value')(value)"
    >
      <Tabs.List>
        <Tabs.Tab v-for="item in items" :key="item" :value="item" :data-testid="`tab-${item}`">
          {{ item }}
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel v-for="item in items" :key="item" :value="item">{{ item }}</Tabs.Panel>
    </Tabs.Root>

    <Accordion.Root
      data-testid="acc-root"
      :data-tick="accTick"
      type="single"
      collapsible
      :model-value="acc"
      @value-change="(value, details) => log('acc', 'value')(value, details)"
      @update:model-value="(value) => model('acc', 'value')(value)"
    >
      <Accordion.Item v-for="item in items" :key="item" :value="item" :data-testid="`acc-${item}`">
        <Accordion.Header>
          <Accordion.Trigger :data-testid="`acc-${item}-trigger`">{{ item }}</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>{{ item }}</Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>

    <CheckboxGroup.Root
      data-testid="cbg-root"
      :data-tick="cbgTick"
      :model-value="cbg"
      @value-change="(value, details) => log('cbg', 'value')(value, details)"
      @update:model-value="(value) => model('cbg', 'value')(value)"
    >
      <Checkbox.Root v-for="item in items" :key="item" :value="item" :data-testid="`cbg-${item}`" />
    </CheckboxGroup.Root>

    <Checkbox.Root
      data-testid="chk-root"
      :data-tick="chkTick"
      :checked="chk"
      @checked-change="(value, details) => log('chk', 'checked')(value, details)"
      @update:checked="(value) => model('chk', 'checked')(value)"
    />

    <Switch.Root
      data-testid="swi-root"
      :data-tick="swiTick"
      :checked="swi"
      @checked-change="(value, details) => log('swi', 'checked')(value, details)"
      @update:checked="(value) => model('swi', 'checked')(value)"
    />

    <RadioGroup.Root
      data-testid="rdg-root"
      :data-tick="rdgTick"
      :model-value="rdg"
      @value-change="(value, details) => log('rdg', 'value')(value, details)"
      @update:model-value="(value) => model('rdg', 'value')(value)"
    >
      <Radio.Root v-for="item in items" :key="item" :value="item" :data-testid="`rdg-${item}`" />
    </RadioGroup.Root>

    <ToggleGroup.Root
      data-testid="tgg-root"
      :data-tick="tggTick"
      :model-value="tgg"
      @value-change="(value, details) => log('tgg', 'value')(value, details)"
      @update:model-value="(value) => model('tgg', 'value')(value)"
    >
      <Toggle.Root v-for="item in items" :key="item" :value="item" :data-testid="`tgg-${item}`">
        {{ item }}
      </Toggle.Root>
    </ToggleGroup.Root>

    <Toggle.Root
      data-testid="tgl-root"
      :data-tick="tglTick"
      :pressed="tgl"
      @pressed-change="(value, details) => log('tgl', 'pressed')(value, details)"
      @update:pressed="(value) => model('tgl', 'pressed')(value)"
    >
      Toggle
    </Toggle.Root>

    <Select.Root
      data-testid="sel-root"
      :data-tick="selTick"
      :model-value="sel"
      @value-change="(value, details) => log('sel', 'value')(value, details)"
      @update:model-value="(value) => model('sel', 'value')(value)"
    >
      <Select.Trigger data-testid="sel-trigger">
        <Select.Value data-testid="sel-value" placeholder="Pick" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Popup data-testid="sel-popup">
          <Select.List>
            <Select.Item value="a" data-testid="sel-item-a">
              <Select.ItemText>Apple</Select.ItemText>
            </Select.Item>
            <Select.Item value="b" data-testid="sel-item-b">
              <Select.ItemText>Banana</Select.ItemText>
            </Select.Item>
          </Select.List>
        </Select.Popup>
      </Select.Positioner>
    </Select.Root>

    <Combobox.Root
      data-testid="cmb-root"
      :data-tick="cmbTick"
      :model-value="cmb"
      @value-change="(value, details) => log('cmb', 'value')(value, details)"
      @update:model-value="(value) => model('cmb', 'value')(value)"
    >
      <Combobox.InputGroup>
        <Combobox.Input data-testid="cmb-input" />
        <Combobox.Trigger data-testid="cmb-trigger">Open</Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Positioner>
        <Combobox.Popup data-testid="cmb-popup">
          <Combobox.List>
            <Combobox.Item value="a" data-testid="cmb-item-a">
              <Combobox.ItemText>Apple</Combobox.ItemText>
            </Combobox.Item>
            <Combobox.Item value="b" data-testid="cmb-item-b">
              <Combobox.ItemText>Banana</Combobox.ItemText>
            </Combobox.Item>
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Positioner>
    </Combobox.Root>

    <Input.Root
      data-testid="inp-root"
      :data-tick="inpTick"
      :model-value="inp"
      @value-change="(value, details) => log('inp', 'value')(value, details)"
      @update:model-value="(value) => model('inp', 'value')(value)"
    />
  </main>
</template>
