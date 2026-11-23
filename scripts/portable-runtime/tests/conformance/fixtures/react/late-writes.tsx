import { Accordion } from "@starwind-ui/react/accordion";
import { Checkbox } from "@starwind-ui/react/checkbox";
import { CheckboxGroup } from "@starwind-ui/react/checkbox-group";
import { ColorPicker } from "@starwind-ui/react/color-picker";
import { Combobox } from "@starwind-ui/react/combobox";
import { Input } from "@starwind-ui/react/input";
import { InputOtp } from "@starwind-ui/react/input-otp";
import { Radio } from "@starwind-ui/react/radio";
import { RadioGroup } from "@starwind-ui/react/radio-group";
import { Select } from "@starwind-ui/react/select";
import { Slider } from "@starwind-ui/react/slider";
import { Switch } from "@starwind-ui/react/switch";
import { Tabs } from "@starwind-ui/react/tabs";
import { Toggle } from "@starwind-ui/react/toggle";
import { ToggleGroup } from "@starwind-ui/react/toggle-group";
import { parseColor } from "@starwind-ui/runtime/color-picker";
import { useEffect, useRef, useState } from "react";
import { captureRuntimeEvents, parent, record, refused } from "../shared/harness";

captureRuntimeEvents();

/** A color input arrives as a fresh Color object on every write. An invalid string stays as is. */
function toColor(next: unknown): unknown {
  return typeof next === "string" ? (parseColor(next) ?? next) : next;
}

function shown(value: unknown): unknown {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as { toString(format: string): string }).toString("hex")
    : value;
}

/**
 * A parent that holds a model, starting `undefined`. Each scenario write also re-renders the
 * parent, so a write of the same value still reaches the component as a stale rerender.
 */
// biome-ignore lint/suspicious/noExplicitAny: fixture values differ per component.
function useLate(
  id: string,
  initial?: unknown,
  adapt = (next: unknown) => next,
): [any, (next: unknown) => void, number] {
  const [state, setState] = useState({ value: initial, tick: 0 });
  const current = useRef(state.value);
  current.current = state.value;
  useEffect(() => {
    parent(id, {
      write: (next) => setState((previous) => ({ value: adapt(next), tick: previous.tick + 1 })),
      read: () => shown(current.current),
    });
  }, [id]);
  return [
    state.value,
    (next) => setState((previous) => ({ ...previous, value: next })),
    state.tick,
  ];
}

const items = ["a", "b", "c"];

export default function LateWrites() {
  const [lsu, , lsuTick] = useLate("lsu");
  const [lsa, , lsaTick] = useLate("lsa");
  const [lsm, setLsm, lsmTick] = useLate("lsm");
  const [lou, , louTick] = useLate("lou");
  const [lom, setLom, lomTick] = useLate("lom");
  const [loc, setLoc, locTick] = useLate("loc", "12");
  const [lcu, , lcuTick] = useLate("lcu", undefined, toColor);
  const [lfu, , lfuTick] = useLate("lfu");
  const [lcm, setLcm, lcmTick] = useLate("lcm", undefined, toColor);
  const [tab, , tabTick] = useLate("tab");
  const [acc, , accTick] = useLate("acc");
  const [cbg, , cbgTick] = useLate("cbg");
  const [chk, , chkTick] = useLate("chk");
  const [swi, , swiTick] = useLate("swi");
  const [rdg, , rdgTick] = useLate("rdg");
  const [tgg, , tggTick] = useLate("tgg");
  const [tgl, , tglTick] = useLate("tgl");
  const [sel, , selTick] = useLate("sel");
  const [cmb, , cmbTick] = useLate("cmb");
  const [inp, , inpTick] = useLate("inp");

  return (
    <main>
      <Slider.Root
        data-testid="lsu-root"
        data-tick={lsuTick}
        defaultValue={0}
        value={lsu}
        onValueChange={(value, details) => record("lsu", "value", value, details)}
      >
        <Slider.Control className="late-slider">
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb data-testid="lsu-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        data-testid="lsa-root"
        data-tick={lsaTick}
        defaultValue={[0, 100]}
        value={lsa}
        onValueChange={(value, details) => record("lsa", "value", value, details)}
      >
        <Slider.Control className="late-slider" data-testid="lsa-control">
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb index={0} data-testid="lsa-thumb" />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <Slider.Root
        data-testid="lsm-root"
        data-tick={lsmTick}
        max={100}
        value={lsm}
        onValueChange={(value, details) => {
          record("lsm", "value", value, details);
          setLsm(value);
        }}
      >
        <Slider.Control className="late-slider">
          <Slider.Track>
            <Slider.Indicator />
            <Slider.Thumb data-testid="lsm-thumb" />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <OtpParts
        id="lou"
        tick={louTick}
        value={lou}
        onValueChange={(value, details) => record("lou", "value", value, details)}
      />
      <OtpParts
        id="lom"
        tick={lomTick}
        value={lom}
        onValueChange={(value, details) => {
          record("lom", "value", value, details);
          setLom(value);
        }}
      />
      <form id="late-form">
        <OtpParts
          id="loc"
          tick={locTick}
          value={loc}
          name="code"
          onValueChange={(value, details) => {
            record("loc", "value", value, details);
            if (!refused("loc")) setLoc(value);
          }}
        />
      </form>

      <ColorPicker.Root
        data-testid="lcu-root"
        data-tick={lcuTick}
        defaultValue="#0000ff"
        value={lcu}
        onValueChange={(value, details) => record("lcu", "value", shown(value), details)}
      >
        <ColorPicker.Swatch swatchValue="#ff0000" data-testid="lcu-swatch">
          Red
        </ColorPicker.Swatch>
      </ColorPicker.Root>

      <ColorPicker.Root
        data-testid="lfu-root"
        data-tick={lfuTick}
        defaultValue="#0000ff"
        format={lfu}
        onFormatChange={(value, details) => record("lfu", "format", value, details)}
      >
        <ColorPicker.FormatSelect data-testid="lfu-select">
          <option value="hex">Hex</option>
          <option value="hsl">HSL</option>
          <option value="rgb">RGB</option>
        </ColorPicker.FormatSelect>
      </ColorPicker.Root>

      <ColorPicker.Root
        data-testid="lcm-root"
        data-tick={lcmTick}
        defaultValue="#0000ff"
        value={lcm}
        onValueChange={(value, details) => {
          record("lcm", "value", shown(value), details);
          setLcm(value);
        }}
      >
        <ColorPicker.Swatch swatchValue="#ff0000" data-testid="lcm-swatch">
          Red
        </ColorPicker.Swatch>
      </ColorPicker.Root>

      <Tabs.Root
        data-testid="tab-root"
        data-tick={tabTick}
        defaultValue="a"
        value={tab}
        onValueChange={(value, details) => record("tab", "value", value, details)}
      >
        <Tabs.List>
          {items.map((item) => (
            <Tabs.Tab key={item} value={item} data-testid={`tab-${item}`}>
              {item}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {items.map((item) => (
          <Tabs.Panel key={item} value={item}>
            {item}
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      <Accordion.Root
        data-testid="acc-root"
        data-tick={accTick}
        type="single"
        collapsible
        value={acc}
        onValueChange={(details) => record("acc", "value", details.value, details)}
      >
        {items.map((item) => (
          <Accordion.Item key={item} value={item} data-testid={`acc-${item}`}>
            <Accordion.Header>
              <Accordion.Trigger data-testid={`acc-${item}-trigger`}>{item}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{item}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <CheckboxGroup.Root
        data-testid="cbg-root"
        data-tick={cbgTick}
        value={cbg}
        onValueChange={(value, details) => record("cbg", "value", value, details)}
      >
        {items.map((item) => (
          <Checkbox.Root key={item} value={item} data-testid={`cbg-${item}`} />
        ))}
      </CheckboxGroup.Root>

      <Checkbox.Root
        data-testid="chk-root"
        data-tick={chkTick}
        checked={chk}
        onCheckedChange={(value, details) => record("chk", "checked", value, details)}
      />

      <Switch.Root
        data-testid="swi-root"
        data-tick={swiTick}
        checked={swi}
        onCheckedChange={(value, details) => record("swi", "checked", value, details)}
      />

      <RadioGroup.Root
        data-testid="rdg-root"
        data-tick={rdgTick}
        value={rdg}
        onValueChange={(value, details) => record("rdg", "value", value, details)}
      >
        {items.map((item) => (
          <Radio.Root key={item} value={item} data-testid={`rdg-${item}`} />
        ))}
      </RadioGroup.Root>

      <ToggleGroup.Root
        data-testid="tgg-root"
        data-tick={tggTick}
        value={tgg}
        onValueChange={(value, details) => record("tgg", "value", value, details)}
      >
        {items.map((item) => (
          <Toggle.Root key={item} value={item} data-testid={`tgg-${item}`}>
            {item}
          </Toggle.Root>
        ))}
      </ToggleGroup.Root>

      <Toggle.Root
        data-testid="tgl-root"
        data-tick={tglTick}
        pressed={tgl}
        onPressedChange={(value, details) => record("tgl", "pressed", value, details)}
      >
        Toggle
      </Toggle.Root>

      <Select.Root
        data-testid="sel-root"
        data-tick={selTick}
        value={sel}
        onValueChange={(value, details) => record("sel", "value", value, details)}
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
        data-tick={cmbTick}
        value={cmb}
        onValueChange={(value, details) => record("cmb", "value", value, details)}
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
        data-tick={inpTick}
        value={inp}
        onValueChange={(value, details) => record("inp", "value", value, details)}
      />
    </main>
  );
}

function OtpParts(props: {
  id: string;
  tick: number;
  value: string | undefined;
  name?: string;
  onValueChange(value: string, details: unknown): void;
}) {
  return (
    <InputOtp.Root
      data-testid={`${props.id}-root`}
      data-tick={props.tick}
      value={props.value}
      name={props.name}
      onValueChange={props.onValueChange}
    >
      <InputOtp.Group>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOtp.Slot index={index} key={index} />
        ))}
      </InputOtp.Group>
    </InputOtp.Root>
  );
}
