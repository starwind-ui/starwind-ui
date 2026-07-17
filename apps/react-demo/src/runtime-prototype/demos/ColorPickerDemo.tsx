import {
  parseColor,
  type ColorPickerColor,
  type ColorPickerFormat,
} from "@starwind-ui/react/color-picker";
import { useCallback, useState } from "react";

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerClear,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerHiddenInput,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerRoot,
  ColorPickerSliders,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerTrigger,
} from "../../components/starwind-runtime/color-picker";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../kit";
import { CanonicalColorPickerDemo } from "./color-picker/CanonicalColorPickerDemo";

const INDIGO = parseColor("#4f46e5")!;
const ROSE = parseColor("#e11d48")!;
const GREEN = parseColor("#16a34a")!;
const BLACK_WITH_SATURATION = parseColor("hsb(210, 75%, 50%)")!.withChannels("hsb", {
  brightness: 0,
});
const SWATCHES = ["#4f46e5", "#e11d48", "#16a34a"] as const;
const FORMAT_EXAMPLES = [
  { format: "hex", value: "#0ea5e9" },
  { format: "rgb", value: "rgb(14, 165, 233)" },
  { format: "hsl", value: "hsl(199.6 89.1% 48.4%)" },
  { format: "hsb", value: "hsb(199.6 94% 91.4%)" },
] as const satisfies ReadonlyArray<{ format: ColorPickerFormat; value: string }>;

function PopupPicker({ id, ...props }: { id: string } & React.ComponentProps<typeof ColorPicker>) {
  return (
    <ColorPicker id={id} {...props}>
      <ColorPickerLabel>Accent color</ColorPickerLabel>
      <ColorPickerControl>
        <ColorPickerInput />
        <ColorPickerTrigger aria-label="Open accent color picker" disabled={props.disabled} />
      </ColorPickerControl>
      <ColorPickerContent
        aria-label="Accent color picker"
        showClear={props.allowEmpty}
        swatches={
          <ColorPickerSwatchGroup aria-label="Preset colors">
            {SWATCHES.map((value) => (
              <ColorPickerSwatch key={value} value={value} aria-label={`Use ${value}`} />
            ))}
          </ColorPickerSwatchGroup>
        }
      />
      <ColorPickerHiddenInput />
    </ColorPicker>
  );
}

function CompactInlinePicker(
  props: React.ComponentProps<typeof ColorPickerRoot> & { label: string },
) {
  const { label, ...rootProps } = props;
  return (
    <ColorPickerRoot {...rootProps}>
      <ColorPickerLabel>{label}</ColorPickerLabel>
      <ColorPickerInput />
      <ColorPickerHiddenInput />
    </ColorPickerRoot>
  );
}

function AdvancedClearEligibilityPicker() {
  const [allowEmpty, setAllowEmpty] = useState(false);

  return (
    <div className="space-y-3" data-testid="color-picker-clear-eligibility-fixture">
      <h3 className="font-medium">Advanced Clear eligibility</h3>
      <ColorPicker
        id="react-color-picker-clear-eligibility"
        defaultValue="#f97316"
        allowEmpty={allowEmpty}
      >
        <ColorPickerLabel>Optional color</ColorPickerLabel>
        <ColorPickerControl>
          <ColorPickerTrigger aria-label="Open advanced Clear color picker" />
        </ColorPickerControl>
        <ColorPickerContent
          showClear
          showEyeDropper={false}
          aria-label="Advanced Clear color editor"
          data-testid="color-picker-clear-eligibility-content"
        />
      </ColorPicker>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setAllowEmpty((current) => !current)}
      >
        Toggle empty values
      </Button>
      <output data-testid="color-picker-clear-eligibility-state">
        Empty values: {allowEmpty ? "allowed" : "disallowed"}
      </output>
    </div>
  );
}

function ControlledModeInvariantPicker() {
  const [value, setValue] = useState<ColorPickerColor | null>(INDIGO);
  const [passesValue, setPassesValue] = useState(true);
  const [changeCount, setChangeCount] = useState(0);
  const [commitCount, setCommitCount] = useState(0);
  const [lastEvent, setLastEvent] = useState("none");

  return (
    <div className="space-y-2" data-testid="initially-controlled-mode-fixture">
      <h4 className="font-medium">Initially controlled</h4>
      <ColorPickerRoot
        id="react-color-picker-mode-controlled"
        {...(passesValue ? { value } : {})}
        onValueChange={(nextValue, details) => {
          setChangeCount((count) => count + 1);
          setLastEvent(`${nextValue?.toString("hex") ?? "empty"}:${details.reason}`);
          setValue(nextValue);
        }}
        onValueCommitted={() => setCommitCount((count) => count + 1)}
      >
        <ColorPickerLabel>Initially controlled color</ColorPickerLabel>
        <ColorPickerInput />
        <ColorPickerSwatchGroup aria-label="Initially controlled presets">
          <ColorPickerSwatch value="#e11d48" aria-label="Controlled choose rose" />
          <ColorPickerSwatch value="#4f46e5" aria-label="Controlled choose indigo" />
        </ColorPickerSwatchGroup>
      </ColorPickerRoot>
      <Button type="button" size="sm" onClick={() => setPassesValue(false)}>
        Attempt to omit controlled value
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          setValue(GREEN);
          setPassesValue(true);
        }}
      >
        Re-pass external controlled green
      </Button>
      <output data-testid="mode-controlled-value">{value?.toString("hex") ?? "empty"}</output>
      <p data-testid="mode-controlled-rendered">
        Rendered: controlled by the persistent root value input
      </p>
      <p data-testid="mode-controlled-prop">Value prop: {passesValue ? "passed" : "omitted"}</p>
      <p data-testid="mode-controlled-changes">Changes: {changeCount}</p>
      <p data-testid="mode-controlled-commits">Commits: {commitCount}</p>
      <p data-testid="mode-controlled-last-event">Last event: {lastEvent}</p>
    </div>
  );
}

function UncontrolledModeInvariantPicker() {
  const [passesValue, setPassesValue] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [commitCount, setCommitCount] = useState(0);
  const [lastEvent, setLastEvent] = useState("none");

  return (
    <div className="space-y-2" data-testid="initially-uncontrolled-mode-fixture">
      <h4 className="font-medium">Initially uncontrolled</h4>
      <ColorPickerRoot
        id="react-color-picker-mode-uncontrolled"
        defaultValue="#4f46e5"
        {...(passesValue ? { value: GREEN } : {})}
        onValueChange={(nextValue, details) => {
          setChangeCount((count) => count + 1);
          setLastEvent(`${nextValue?.toString("hex") ?? "empty"}:${details.reason}`);
        }}
        onValueCommitted={() => setCommitCount((count) => count + 1)}
      >
        <ColorPickerLabel>Initially uncontrolled color</ColorPickerLabel>
        <ColorPickerInput />
        <ColorPickerSwatchGroup aria-label="Initially uncontrolled presets">
          <ColorPickerSwatch value="#e11d48" aria-label="Uncontrolled choose rose" />
          <ColorPickerSwatch value="#4f46e5" aria-label="Uncontrolled choose indigo" />
        </ColorPickerSwatchGroup>
      </ColorPickerRoot>
      <Button type="button" size="sm" onClick={() => setPassesValue(true)}>
        Attempt to pass controlled green
      </Button>
      <p data-testid="mode-uncontrolled-prop">Value prop: {passesValue ? "passed" : "omitted"}</p>
      <p data-testid="mode-uncontrolled-changes">Changes: {changeCount}</p>
      <p data-testid="mode-uncontrolled-commits">Commits: {commitCount}</p>
      <p data-testid="mode-uncontrolled-last-event">Last event: {lastEvent}</p>
    </div>
  );
}

export function ColorPickerDemo() {
  const [controlledValue, setControlledValue] = useState<ColorPickerColor | null>(INDIGO);
  const [controlledOpen, setControlledOpen] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [commitCount, setCommitCount] = useState(0);
  const [cancelNext, setCancelNext] = useState(false);
  const [lastChange, setLastChange] = useState("none");
  const [lastCommit, setLastCommit] = useState("none");
  const [formResult, setFormResult] = useState("not submitted");
  const [requiredResult, setRequiredResult] = useState("not submitted");

  const handleValueChange = useCallback(
    (
      value: ColorPickerColor | null,
      details: Parameters<
        NonNullable<React.ComponentProps<typeof ColorPicker>["onValueChange"]>
      >[1],
    ) => {
      setChangeCount((count) => count + 1);
      setLastChange(`${value?.toString("hex") ?? "empty"}:${details.reason}`);
      if (cancelNext) {
        details.cancel();
        setCancelNext(false);
        return;
      }
      setControlledValue(value);
    },
    [cancelNext],
  );

  const handleValueCommitted = useCallback(
    (
      value: ColorPickerColor | null,
      details: Parameters<
        NonNullable<React.ComponentProps<typeof ColorPicker>["onValueCommitted"]>
      >[1],
    ) => {
      setCommitCount((count) => count + 1);
      setLastCommit(`${value?.toString("hex") ?? "empty"}:${details.reason}`);
    },
    [],
  );

  return (
    <section className="space-y-6" aria-labelledby="react-color-picker-heading">
      <div>
        <h2 id="react-color-picker-heading" className="font-heading text-xl font-semibold">
          Color Picker
        </h2>
        <p className="text-muted-foreground text-sm">
          Canonical generated composition first, followed by focused interaction and state review
          fixtures.
        </p>
      </div>

      <CanonicalColorPickerDemo />

      <div className="space-y-2 border-t pt-6">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Interaction review
        </p>
        <h3 className="font-heading text-lg font-semibold">Focused QA fixtures</h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-medium">Default popup</h3>
          <PopupPicker id="react-color-picker-default" defaultValue="#2563eb" />
        </div>

        <AdvancedClearEligibilityPicker />

        <div className="space-y-2 sm:col-span-2" data-testid="color-picker-formats">
          <h3 className="font-medium">All value formats</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FORMAT_EXAMPLES.map(({ format, value }) => (
              <CompactInlinePicker
                key={format}
                id={`react-color-picker-format-${format}`}
                label={format.toUpperCase()}
                format={format}
                defaultValue={value}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2" data-testid="color-picker-alpha-enabled">
          <h3 className="font-medium">Alpha enabled</h3>
          <ColorPickerRoot id="react-color-picker-alpha-enabled" defaultValue="#0ea5e980">
            <ColorPickerLabel>Translucent color</ColorPickerLabel>
            <ColorPickerSliders alpha />
            <ColorPickerInput />
          </ColorPickerRoot>
        </div>

        <div className="space-y-2" data-testid="color-picker-alpha-disabled">
          <h3 className="font-medium">Alpha disabled</h3>
          <ColorPickerRoot
            id="react-color-picker-alpha-disabled"
            defaultValue="#0ea5e980"
            alpha={false}
          >
            <ColorPickerLabel>Opaque color</ColorPickerLabel>
            <ColorPickerSliders alpha={false} />
            <ColorPickerInput />
          </ColorPickerRoot>
        </div>

        <div className="space-y-2 sm:col-span-2" data-testid="color-picker-invalid-draft">
          <h3 className="font-medium">Invalid draft recovery</h3>
          <CompactInlinePicker
            id="react-color-picker-invalid-draft"
            label="Recoverable color"
            defaultValue="#0f766e"
          />
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Inline editor</h3>
          <ColorPickerRoot id="react-color-picker-inline" defaultValue="#16a34a">
            <ColorPickerLabel>Inline color</ColorPickerLabel>
            <ColorPickerArea aria-label="Inline saturation and brightness" />
            <ColorPickerSliders />
            <ColorPickerInput />
          </ColorPickerRoot>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Input and swatches</h3>
          <ColorPickerRoot id="react-color-picker-input-swatch" defaultValue="#e11d48">
            <ColorPickerLabel>Brand color</ColorPickerLabel>
            <ColorPickerInput />
            <ColorPickerSwatchGroup aria-label="Brand presets">
              {SWATCHES.map((value) => (
                <ColorPickerSwatch key={value} value={value} aria-label={`Choose ${value}`} />
              ))}
            </ColorPickerSwatchGroup>
          </ColorPickerRoot>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Disabled and read-only</h3>
          <PopupPicker id="react-color-picker-disabled" defaultValue="#64748b" disabled />
          <PopupPicker id="react-color-picker-readonly" defaultValue="#64748b" readOnly />
        </div>
      </div>

      <form
        id="react-color-picker-required-form"
        className="space-y-3 rounded-lg border p-4"
        onInvalid={() => setRequiredResult("invalid")}
        onSubmit={(event) => {
          event.preventDefault();
          setRequiredResult(String(new FormData(event.currentTarget).get("required-color")));
        }}
      >
        <h3 className="font-medium">Empty required color</h3>
        <ColorPickerRoot
          id="react-color-picker-required"
          name="required-color"
          defaultValue={null}
          allowEmpty
          required
        >
          <ColorPickerLabel>Required color</ColorPickerLabel>
          <ColorPickerInput />
          <ColorPickerSwatchGroup aria-label="Required color presets">
            <ColorPickerSwatch value="#16a34a" aria-label="Choose required green" />
          </ColorPickerSwatchGroup>
          <ColorPickerClear>Clear required color</ColorPickerClear>
          <ColorPickerHiddenInput />
        </ColorPickerRoot>
        <Button type="submit" size="sm">
          Submit required color
        </Button>
        <output data-testid="color-picker-required-result">{requiredResult}</output>
      </form>

      <div
        className="space-y-3 rounded-lg border p-4"
        data-testid="controlled-color-picker-fixture"
      >
        <h3 className="font-medium">Controlled color and independently controlled popup</h3>
        <PopupPicker
          id="react-color-picker-controlled"
          value={controlledValue}
          allowEmpty
          open={controlledOpen}
          onOpenChange={setControlledOpen}
          onValueChange={handleValueChange}
          onValueCommitted={handleValueCommitted}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setControlledValue(ROSE)}>
            External rose sync
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setControlledValue(BLACK_WITH_SATURATION)}
          >
            External black HSB sync
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setControlledValue(null)}
          >
            External clear
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setControlledOpen(true)}>
            External open
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setControlledOpen(false)}
          >
            External close
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setCancelNext(true)}>
            Cancel next change
          </Button>
        </div>
        <output data-testid="controlled-color-value">
          Value: {controlledValue?.toString("hex") ?? "empty"}
        </output>
        <output data-testid="controlled-color-hsb-value">
          HSB: {controlledValue?.toString("hsb") ?? "empty"}
        </output>
        <p data-testid="controlled-color-open">Popup: {controlledOpen ? "open" : "closed"}</p>
        <p data-testid="controlled-color-change-count">Changes: {changeCount}</p>
        <p data-testid="controlled-color-commit-count">Commits: {commitCount}</p>
        <p data-testid="controlled-color-last-change">Last change: {lastChange}</p>
        <p data-testid="controlled-color-last-commit">Last commit: {lastCommit}</p>
      </div>

      <section className="space-y-3 rounded-lg border p-4" aria-labelledby="mode-invariance-title">
        <h3 id="mode-invariance-title" className="font-medium">
          Controlledness remains fixed for a mounted root
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <ControlledModeInvariantPicker />
          <UncontrolledModeInvariantPicker />
        </div>
      </section>

      <form
        id="react-color-picker-form"
        className="space-y-3 rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFormResult(String(new FormData(event.currentTarget).get("theme-color")));
        }}
        onReset={() => setFormResult("reset")}
      >
        <h3 className="font-medium">Form value and reset</h3>
        <ColorPickerRoot
          id="react-color-picker-form-field"
          name="theme-color"
          defaultValue="#0ea5e9"
        >
          <ColorPickerLabel>Popup-free form color</ColorPickerLabel>
          <ColorPickerInput />
          <ColorPickerHiddenInput />
        </ColorPickerRoot>
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Submit color
          </Button>
          <Button type="reset" size="sm" variant="outline">
            Reset color
          </Button>
        </div>
        <output data-testid="color-picker-form-result">{formResult}</output>
      </form>

      <Dialog id="react-color-picker-dialog">
        <DialogTrigger asChild>
          <Button id="react-color-picker-dialog-trigger" type="button" variant="outline">
            Open color picker dialog
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a dialog color</DialogTitle>
            <DialogDescription>The popup remains scoped to this nested overlay.</DialogDescription>
          </DialogHeader>
          <PopupPicker id="react-color-picker-nested" defaultValue="#a855f7" />
        </DialogContent>
      </Dialog>
    </section>
  );
}
