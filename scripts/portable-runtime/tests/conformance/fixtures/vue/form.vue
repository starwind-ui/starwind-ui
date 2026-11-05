<script setup lang="ts">
import Textarea from "@conformance/styled-vue/textarea/Textarea.vue";
import { Checkbox } from "@starwind-ui/vue/checkbox";
import { Combobox } from "@starwind-ui/vue/combobox";
import { Input } from "@starwind-ui/vue/input";
import { Select } from "@starwind-ui/vue/select";
import { Slider } from "@starwind-ui/vue/slider";
import { Switch } from "@starwind-ui/vue/switch";
import { useParent } from "./parts/use-parent";

const select = useParent<string | null>("fp-sel", "a");
const combobox = useParent<string | null>("fp-cmb", "a");
const checked = useParent("fp-chk", false);
const switched = useParent("fp-swi", false);
const slider = useParent<number | readonly number[]>("fp-sld", 20);
const input = useParent("fp-inp", "hello");
const seeded = useParent("fp-txt", "notes");
const empty = useParent("fp-txe", "");
</script>

<template>
  <main>
    <form id="fu">
      <Select.Root name="sel" default-value="a">
        <Select.Trigger data-testid="fu-sel-trigger">
          <Select.Value data-testid="fu-sel-value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
              <Select.Item value="b" data-testid="fu-sel-item-b">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>
      <Combobox.Root name="cmb" default-value="a">
        <Combobox.InputGroup>
          <Combobox.Input data-testid="fu-cmb-input" />
          <Combobox.Trigger data-testid="fu-cmb-trigger">Open</Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
              <Combobox.Item value="b" data-testid="fu-cmb-item-b">
                <Combobox.ItemText>Banana</Combobox.ItemText>
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Root>
      <Checkbox.Root name="chk" value="yes" data-testid="fu-chk"
        ><Checkbox.Indicator
      /></Checkbox.Root>
      <Switch.Root name="swi" value="yes" data-testid="fu-swi"><Switch.Thumb /></Switch.Root>
      <Slider.Root name="sld" :default-value="20">
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb data-testid="fu-sld-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Input.Root name="inp" default-value="hello" data-testid="fu-inp" />
      <Textarea name="txt" default-value="notes" data-testid="fu-txt" />
      <Textarea name="txe" data-testid="fu-txe" />
      <button type="submit" data-testid="fu-submit">Submit</button>
    </form>

    <form id="fp">
      <Select.Root v-model="select" name="sel">
        <Select.Trigger data-testid="fp-sel-trigger">
          <Select.Value data-testid="fp-sel-value" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup>
            <Select.List>
              <Select.Item value="a"><Select.ItemText>Apple</Select.ItemText></Select.Item>
              <Select.Item value="b" data-testid="fp-sel-item-b">
                <Select.ItemText>Banana</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>
      <Combobox.Root v-model="combobox" name="cmb">
        <Combobox.InputGroup>
          <Combobox.Input data-testid="fp-cmb-input" />
          <Combobox.Trigger data-testid="fp-cmb-trigger">Open</Combobox.Trigger>
        </Combobox.InputGroup>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              <Combobox.Item value="a"><Combobox.ItemText>Apple</Combobox.ItemText></Combobox.Item>
              <Combobox.Item value="b" data-testid="fp-cmb-item-b">
                <Combobox.ItemText>Banana</Combobox.ItemText>
              </Combobox.Item>
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Root>
      <Checkbox.Root v-model:checked="checked" name="chk" value="yes" data-testid="fp-chk">
        <Checkbox.Indicator />
      </Checkbox.Root>
      <Switch.Root v-model:checked="switched" name="swi" value="yes" data-testid="fp-swi">
        <Switch.Thumb />
      </Switch.Root>
      <Slider.Root v-model="slider" name="sld">
        <Slider.Control>
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb data-testid="fp-sld-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <Input.Root v-model="input" name="inp" data-testid="fp-inp" />
      <Textarea v-model="seeded" name="txt" data-testid="fp-txt" />
      <Textarea v-model="empty" name="txe" data-testid="fp-txe" />
      <button type="submit" data-testid="fp-submit">Submit</button>
    </form>
  </main>
</template>
