import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorPicker, parseColor } from "../src/color-picker/index";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Color Picker mounted lifecycle", () => {
  it("keeps FormatControl synchronized with controlled format changes and cleans up", async () => {
    const formatChanged = vi.fn();
    function Picker({ format }: { format: "hsl" | "hsb" }) {
      return (
        <ColorPicker.Root defaultValue="#336699" format={format} onFormatChange={formatChanged}>
          <ColorPicker.FormatSelect>
            <option value="hsl">HSL</option>
            <option value="rgb">RGB</option>
            <option value="hsb">HSB</option>
          </ColorPicker.FormatSelect>
          <ColorPicker.FormatControl />
        </ColorPicker.Root>
      );
    }

    await mount(<Picker format="hsl" />);
    const select = query<HTMLSelectElement>("[data-sw-color-picker-format-select]");
    expect(select.value).toBe("hsl");
    expect(select).toHaveAttribute("aria-readonly", "false");
    expect(query<HTMLElement>("[data-sw-color-picker-format-control]")).toHaveAttribute(
      "data-format",
      "hsl",
    );

    select.value = "rgb";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(formatChanged).toHaveBeenCalledOnce();
    expect(select.value).toBe("hsl");
    expect(query<HTMLElement>("[data-sw-color-picker-format-control]")).toHaveAttribute(
      "data-format",
      "hsl",
    );

    await render(<Picker format="hsb" />);
    expect(select.value).toBe("hsb");
    expect(query<HTMLElement>("[data-sw-color-picker-format-control]")).toHaveAttribute(
      "data-format",
      "hsb",
    );
    expect(formatChanged).toHaveBeenCalledOnce();

    await act(() => reactRoot!.unmount());
    reactRoot = undefined;
    select.value = "rgb";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(formatChanged).toHaveBeenCalledOnce();
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects native required validation from the sole form proxy without a console error", async () => {
    const submitted = vi.fn();
    await mount(
      <form onSubmit={submitted}>
        <ColorPicker.Root value={null} allowEmpty required name="accent">
          <ColorPicker.ValueInput />
          <ColorPicker.HiddenInput />
        </ColorPicker.Root>
      </form>,
    );
    const form = query<HTMLFormElement>("form");
    const proxy = query<HTMLInputElement>("[data-sw-color-picker-hidden-input]");
    const valueInput = query<HTMLInputElement>("[data-sw-color-picker-value-input]");
    expect(proxy.validity.valueMissing).toBe(true);
    expect(proxy.hidden).toBe(false);
    expect(proxy.tabIndex).toBe(-1);
    expect(proxy).toHaveAttribute("aria-hidden", "true");
    const consoleError = vi.spyOn(console, "error");
    form.requestSubmit();
    expect(submitted).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(valueInput);
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();

    await render(
      <form onSubmit={submitted}>
        <ColorPicker.Root value="#336699" allowEmpty required name="accent">
          <ColorPicker.ValueInput />
          <ColorPicker.HiddenInput />
        </ColorPicker.Root>
      </form>,
    );
    await vi.waitFor(() =>
      expect(query<HTMLInputElement>("[data-sw-color-picker-hidden-input]").validity.valid).toBe(
        true,
      ),
    );
    expect(query<HTMLElement>("[data-sw-color-picker]")).not.toHaveAttribute("data-invalid");
    expect(query<HTMLInputElement>("[data-sw-color-picker-value-input]")).not.toHaveAttribute(
      "data-invalid",
    );
  });

  it("keeps a controlled multi-move drag alive across rerenders and commits exactly once", async () => {
    const committed = vi.fn();
    function Harness() {
      const [value, setValue] = React.useState("hsb(0, 0%, 100%)");
      return (
        <ColorPicker.Root
          value={value}
          format="hsb"
          onValueChange={(_, details) => setValue(details.valueAsString)}
          onValueCommitted={committed}
        >
          <ColorPicker.Area>
            <ColorPicker.AreaInput axis="x" />
            <ColorPicker.AreaInput axis="y" />
          </ColorPicker.Area>
        </ColorPicker.Root>
      );
    }
    await mount(<Harness />);
    const area = query<HTMLElement>("[data-sw-color-picker-area]");
    mockRect(area);

    area.dispatchEvent(pointer("pointerdown", 20, 50, 1));
    document.dispatchEvent(pointer("pointermove", 40, 40, 1));
    document.dispatchEvent(pointer("pointermove", 60, 20, 1));
    document.dispatchEvent(pointer("pointerup", 60, 20, 0));
    await flush();

    expect(committed).toHaveBeenCalledOnce();
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).toContain(
      "60%",
    );
  });

  it("refreshes once for local part insertion/removal and channel or step configuration", async () => {
    function Picker({
      channel,
      show,
      step,
    }: {
      channel: "hue" | "red";
      show: boolean;
      step: number;
    }) {
      return (
        <ColorPicker.Root defaultValue="#ff0000">
          {show ? (
            <ColorPicker.ChannelSlider channel={channel} step={step}>
              <ColorPicker.ChannelSliderInput />
            </ColorPicker.ChannelSlider>
          ) : null}
        </ColorPicker.Root>
      );
    }
    await mount(<Picker channel="hue" show={false} step={7} />);
    await render(<Picker channel="hue" show step={7} />);
    let input = query<HTMLInputElement>("[data-sw-color-picker-channel-input]");
    expect(input.max).toBe("357");
    expect(input.step).toBe("7");

    await render(<Picker channel="red" show step={5} />);
    input = query<HTMLInputElement>("[data-sw-color-picker-channel-input]");
    expect(input.max).toBe("255");
    expect(input.step).toBe("5");
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).not.toBe(
      "#ff0000",
    );

    await render(<Picker channel="red" show={false} step={5} />);
    expect(container!.querySelector("[data-sw-color-picker-channel-input]")).toBeNull();
  });

  it("replays ownership only for StrictMode setup and preserves authored ARIA", async () => {
    function Picker({ disabled, role }: { disabled: boolean; role: string }) {
      return (
        <React.StrictMode>
          <ColorPicker.Root
            defaultValue="#ff0000"
            disabled={disabled}
            getAreaRoleDescription={() => role}
          >
            <ColorPicker.Area>
              <ColorPicker.AreaInput axis="x" />
              <ColorPicker.AreaInput axis="y" aria-roledescription="Authored surface" />
            </ColorPicker.Area>
            <ColorPicker.Swatch swatchValue="#ff0000">Red</ColorPicker.Swatch>
          </ColorPicker.Root>
        </React.StrictMode>
      );
    }
    await mount(<Picker disabled role="First surface" />);
    await render(<Picker disabled={false} role="Updated surface" />);

    const inputs = container!.querySelectorAll<HTMLInputElement>(
      "[data-sw-color-picker-area-input]",
    );
    expect(inputs[0]!.getAttribute("aria-roledescription")).toBe("Updated surface");
    expect(inputs[1]!.getAttribute("aria-roledescription")).toBe("Authored surface");
    expect(query<HTMLButtonElement>("[data-sw-color-picker-swatch]").disabled).toBe(false);
    expect(container!.querySelector("[data-sw-color-picker-initial-owned]")).toBeNull();
  });

  it("hands removed authored ARIA back to Runtime without disturbing drafts or looping refresh", async () => {
    type AuthoredAria = {
      "aria-label"?: string;
      "aria-labelledby"?: string;
      "aria-roledescription"?: string;
    };
    const getAreaRoleDescription = vi.fn((locale?: string) =>
      locale === "de-DE" ? "Deutsche Farbfläche" : "English color surface",
    );
    function Picker({ aria, locale }: { aria: AuthoredAria; locale: string }) {
      return (
        <ColorPicker.Root
          defaultValue="#ff0000"
          locale={locale}
          getAreaRoleDescription={getAreaRoleDescription}
        >
          <ColorPicker.Label id="runtime-label">Runtime label</ColorPicker.Label>
          <ColorPicker.Area>
            <ColorPicker.AreaInput axis="x" {...aria} />
          </ColorPicker.Area>
          <ColorPicker.ChannelSlider channel="hue">
            <ColorPicker.ChannelSliderInput {...aria} />
          </ColorPicker.ChannelSlider>
          <ColorPicker.ValueInput />
        </ColorPicker.Root>
      );
    }
    const first = {
      "aria-label": "First label",
      "aria-labelledby": "consumer-label",
      "aria-roledescription": "First role",
    };
    const second = {
      "aria-label": "Second label",
      "aria-labelledby": "consumer-label-2",
      "aria-roledescription": "Second role",
    };
    await mount(<Picker aria={first} locale="en-US" />);
    const areaInput = query<HTMLInputElement>("[data-sw-color-picker-area-input]");
    const sliderInput = query<HTMLInputElement>("[data-sw-color-picker-channel-input]");
    for (const input of [areaInput, sliderInput]) {
      expect(input.getAttribute("aria-label")).toBe("First label");
      expect(input.getAttribute("aria-labelledby")).toBe("consumer-label");
      expect(input.getAttribute("aria-roledescription")).toBe("First role");
    }

    await render(<Picker aria={second} locale="en-US" />);
    for (const input of [areaInput, sliderInput]) {
      expect(input.getAttribute("aria-label")).toBe("Second label");
      expect(input.getAttribute("aria-labelledby")).toBe("consumer-label-2");
      expect(input.getAttribute("aria-roledescription")).toBe("Second role");
    }

    const valueInput = query<HTMLInputElement>("[data-sw-color-picker-value-input]");
    valueInput.value = "not-a-color";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    getAreaRoleDescription.mockClear();

    await render(<Picker aria={{}} locale="en-US" />);
    expect(areaInput.getAttribute("aria-label")).toBe("Saturation");
    expect(areaInput.getAttribute("aria-labelledby")).toBe("runtime-label");
    expect(areaInput.getAttribute("aria-roledescription")).toBe("English color surface");
    expect(sliderInput.getAttribute("aria-label")).toBe("Hue");
    expect(sliderInput).not.toHaveAttribute("aria-labelledby");
    expect(sliderInput).not.toHaveAttribute("aria-roledescription");
    expect(valueInput.value).toBe("not-a-color");
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    expect(getAreaRoleDescription).toHaveBeenCalledTimes(1);
    expect(container!.querySelector("[data-sw-color-picker-initial-owned]")).toBeNull();

    getAreaRoleDescription.mockClear();
    await render(<Picker aria={{}} locale="de-DE" />);
    expect(areaInput.getAttribute("aria-roledescription")).toBe("Deutsche Farbfläche");
    expect(valueInput.value).toBe("not-a-color");
    expect(getAreaRoleDescription.mock.calls.length).toBeLessThanOrEqual(5);
  });

  it("isolates nested roots and explicitly clears removed optional props", async () => {
    function Picker({
      configured,
      outerDisabled,
    }: {
      configured: boolean;
      outerDisabled: boolean;
    }) {
      return (
        <div dir="rtl">
          <ColorPicker.Root
            defaultValue="#ff0000"
            disabled={outerDisabled}
            {...(configured
              ? { name: "outer", form: "theme-form", locale: "de-DE", dir: "ltr" as const }
              : {})}
          >
            <ColorPicker.HiddenInput />
            <ColorPicker.Area>
              <ColorPicker.ChannelSlider channel="hue" orientation="vertical">
                <ColorPicker.ChannelSliderInput />
                <ColorPicker.Root defaultValue="#0000ff" name="inner" dir="rtl">
                  <ColorPicker.HiddenInput />
                  <ColorPicker.ChannelSlider channel="hue">
                    <ColorPicker.ChannelSliderInput />
                  </ColorPicker.ChannelSlider>
                </ColorPicker.Root>
              </ColorPicker.ChannelSlider>
            </ColorPicker.Area>
          </ColorPicker.Root>
        </div>
      );
    }
    await mount(<Picker configured outerDisabled />);
    await render(<Picker configured={false} outerDisabled={false} />);

    const roots = container!.querySelectorAll<HTMLElement>("[data-sw-color-picker]");
    const outer = roots[0]!;
    const inner = roots[1]!;
    const outerHidden = owned<HTMLInputElement>(outer, "[data-sw-color-picker-hidden-input]");
    const innerHidden = owned<HTMLInputElement>(inner, "[data-sw-color-picker-hidden-input]");
    expect(outer.hasAttribute("data-name")).toBe(false);
    expect(outer.hasAttribute("data-form")).toBe(false);
    expect(outer.hasAttribute("data-locale")).toBe(false);
    expect(outer.hasAttribute("dir")).toBe(false);
    expect(outerHidden.name).toBe("");
    expect(innerHidden.name).toBe("inner");
    expect(innerHidden.value).toBe("#0000ff");
    expect(owned<HTMLInputElement>(inner, "[data-sw-color-picker-channel-input]").disabled).toBe(
      false,
    );
    const innerInput = owned<HTMLInputElement>(inner, "[data-sw-color-picker-channel-input]");
    innerInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    expect(innerInput.getAttribute("aria-valuenow")).toBe("239");
    innerInput.focus();
    await render(<Picker configured={false} outerDisabled />);
    expect(owned<HTMLElement>(outer, "[data-sw-color-picker-area]")).not.toHaveAttribute(
      "data-focused",
    );
    expect(owned<HTMLElement>(outer, "[data-sw-color-picker-channel-slider]")).not.toHaveAttribute(
      "data-focused",
    );
  });

  it("reconciles removed interaction state while preserving a drag across unrelated insertion", async () => {
    const committed = vi.fn();
    function Picker({
      decoration,
      showArea,
      showSlider,
      showSliderInput,
      showValueInput,
    }: {
      decoration: boolean;
      showArea: boolean;
      showSlider: boolean;
      showSliderInput: boolean;
      showValueInput: boolean;
    }) {
      return (
        <ColorPicker.Root defaultValue="hsb(0, 0%, 100%)" format="hsb" onValueCommitted={committed}>
          {showArea ? (
            <ColorPicker.Area>
              <ColorPicker.AreaInput axis="x" />
              <ColorPicker.AreaInput axis="y" />
              {decoration ? <span data-decoration /> : null}
            </ColorPicker.Area>
          ) : null}
          {showSlider ? (
            <ColorPicker.ChannelSlider channel="hue">
              {showSliderInput ? <ColorPicker.ChannelSliderInput /> : null}
            </ColorPicker.ChannelSlider>
          ) : null}
          {showValueInput ? <ColorPicker.ValueInput /> : null}
        </ColorPicker.Root>
      );
    }
    const props = {
      decoration: false,
      showArea: true,
      showSlider: true,
      showSliderInput: true,
      showValueInput: true,
    };
    await mount(<Picker {...props} />);
    let area = query<HTMLElement>("[data-sw-color-picker-area]");
    mockRect(area);
    area.dispatchEvent(pointer("pointerdown", 75, 25, 1));
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).not.toBe(
      "hsb(0, 0%, 100%)",
    );

    await render(<Picker {...props} showArea={false} />);
    document.dispatchEvent(pointer("pointermove", 10, 10, 1));
    document.dispatchEvent(pointer("pointerup", 10, 10, 0));
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).toBe(
      "hsb(0, 0%, 100%)",
    );
    expect(committed).not.toHaveBeenCalled();

    const slider = query<HTMLElement>("[data-sw-color-picker-channel-slider]");
    mockRect(slider);
    slider.dispatchEvent(pointer("pointerdown", 50, 50, 1));
    await render(<Picker {...props} showArea={false} showSlider={false} />);
    document.dispatchEvent(pointer("pointermove", 90, 50, 1));
    document.dispatchEvent(pointer("pointerup", 90, 50, 0));
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).toBe(
      "hsb(0, 0%, 100%)",
    );
    expect(committed).not.toHaveBeenCalled();

    await render(<Picker {...props} showArea={false} />);
    const sliderInput = query<HTMLInputElement>("[data-sw-color-picker-channel-input]");
    sliderInput.value = "120";
    sliderInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(sliderInput.getAttribute("aria-valuenow")).toBe("120");
    await render(<Picker {...props} showArea={false} showSliderInput={false} />);
    sliderInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).toBe(
      "hsb(0, 0%, 100%)",
    );
    expect(committed).not.toHaveBeenCalled();

    const valueInput = query<HTMLInputElement>("[data-sw-color-picker-value-input]");
    valueInput.value = "not-a-color";
    valueInput.dispatchEvent(new Event("input", { bubbles: true }));
    expect(valueInput).toHaveAttribute("aria-invalid", "true");
    await render(
      <Picker {...props} showArea={false} showSliderInput={false} showValueInput={false} />,
    );
    await render(<Picker {...props} showArea={false} showSliderInput={false} />);
    expect(query<HTMLInputElement>("[data-sw-color-picker-value-input]").value).not.toBe(
      "not-a-color",
    );

    await render(<Picker {...props} />);
    area = query<HTMLElement>("[data-sw-color-picker-area]");
    mockRect(area);
    area.dispatchEvent(pointer("pointerdown", 20, 80, 1));
    await render(<Picker {...props} decoration />);
    document.dispatchEvent(pointer("pointermove", 70, 30, 1));
    document.dispatchEvent(pointer("pointerup", 70, 30, 0));
    expect(committed).toHaveBeenCalledOnce();
    expect(query<HTMLElement>("[data-sw-color-picker]").getAttribute("data-value")).toContain(
      "70%",
    );
  });
});

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await render(node);
}

async function render(node: React.ReactNode) {
  await act(() => reactRoot!.render(node));
  await flush();
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}

function owned<T extends Element>(root: HTMLElement, selector: string): T {
  return [...root.querySelectorAll<T>(selector)].find(
    (element) => element.closest("[data-sw-color-picker]") === root,
  )!;
}

function mockRect(element: HTMLElement) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
      toJSON() {},
    }),
  });
}

function pointer(type: string, clientX: number, clientY: number, buttons: number) {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    buttons,
    clientX,
    clientY,
    pointerId: 17,
  });
}

it("keeps current parent-controlled color and format through native form reset", async () => {
  const changed = vi.fn();
  const picker = (value: string, format: "hex" | "rgb") => (
    <form>
      <ColorPicker.Root value={value} format={format} name="accent" onValueChange={changed}>
        <ColorPicker.ValueInput />
        <ColorPicker.HiddenInput />
      </ColorPicker.Root>
    </form>
  );
  await mount(picker("#ff0000", "hex"));
  await render(picker("#00ff00", "rgb"));
  const form = query<HTMLFormElement>("form");
  await act(() => form.reset());
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(
    parseColor(query<HTMLElement>("[data-sw-color-picker]").dataset.value!)?.toString("hex"),
  ).toBe("#00ff00");
  expect(query<HTMLElement>("[data-sw-color-picker]").dataset.format).toBe("rgb");
  expect(new FormData(form).get("accent")).toContain("0, 255, 0");
  expect(changed).not.toHaveBeenCalled();
  form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  await act(() => form.reset());
  await render(picker("#0000ff", "hex"));
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(query<HTMLElement>("[data-sw-color-picker]").dataset.value).toContain("0000ff");
  expect(changed).not.toHaveBeenCalled();
  await act(() => {
    form.reset();
    reactRoot?.unmount();
  });
  reactRoot = undefined;
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(container!.children).toHaveLength(0);
  expect(changed).not.toHaveBeenCalled();
});

it("restores canceled uncontrolled resets while preserving newer accepted interactions", async () => {
  const changed = vi.fn();
  await mount(
    <form>
      <ColorPicker.Root defaultValue="#0000ff" onValueChange={changed}>
        <ColorPicker.Swatch swatchValue="#00ff00">Green</ColorPicker.Swatch>
        <ColorPicker.Swatch swatchValue="#ff0000">Red</ColorPicker.Swatch>
        <ColorPicker.HiddenInput />
      </ColorPicker.Root>
    </form>,
  );
  const form = query<HTMLFormElement>("form");
  const swatches = container!.querySelectorAll<HTMLButtonElement>("[data-sw-color-picker-swatch]");
  await act(() => swatches[0]!.click());
  form.addEventListener("reset", (event) => event.preventDefault());
  await act(() => form.reset());
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(
    parseColor(query<HTMLElement>("[data-sw-color-picker]").dataset.value!)?.toString("hex"),
  ).toBe("#00ff00");
  await act(() => {
    form.reset();
    swatches[1]!.click();
  });
  await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  expect(query<HTMLElement>("[data-sw-color-picker]").dataset.value).toContain("ff0000");
  expect(changed).toHaveBeenCalledTimes(2);
});

it.each([
  [false, false],
  [false, true],
  [true, false],
  [true, true],
])(
  "fixes independent value=%s and format=%s ownership until remount",
  async (valueControlled, formatControlled) => {
    const picker = (
      value: string | undefined,
      format: "hex" | "rgb" | "hsl" | "hsb" | undefined,
      key = 0,
    ) => (
      <ColorPicker.Root key={key} value={value} format={format} defaultValue="#0000ff">
        <ColorPicker.Swatch swatchValue="#ff0000">Red</ColorPicker.Swatch>
        <ColorPicker.FormatSelect>
          <option value="hex">Hex</option>
          <option value="rgb">RGB</option>
          <option value="hsl">HSL</option>
          <option value="hsb">HSB</option>
        </ColorPicker.FormatSelect>
        <ColorPicker.HiddenInput />
      </ColorPicker.Root>
    );
    const color = () =>
      parseColor(query<HTMLElement>("[data-sw-color-picker]").dataset.value!)?.toString("hex");
    await mount(
      picker(valueControlled ? "#0000ff" : undefined, formatControlled ? "hex" : undefined),
    );
    await render(picker("#00ff00", "rgb"));
    expect(color()).toBe(valueControlled ? "#00ff00" : "#0000ff");
    expect(query<HTMLSelectElement>("select").value).toBe(formatControlled ? "rgb" : "hex");
    await render(picker(undefined, undefined));
    await act(() => query<HTMLButtonElement>("button").click());
    expect(color()).toBe(valueControlled ? "#00ff00" : "#ff0000");
    await act(() => {
      const select = query<HTMLSelectElement>("select");
      select.value = "hsl";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(query<HTMLSelectElement>("select").value).toBe(formatControlled ? "rgb" : "hsl");
    await render(picker("#ff0000", "hsb"));
    expect(color()).toBe("#ff0000");
    expect(query<HTMLSelectElement>("select").value).toBe(formatControlled ? "hsb" : "hsl");
    await render(picker("#00ff00", "rgb", 1));
    expect(color()).toBe("#00ff00");
    expect(query<HTMLSelectElement>("select").value).toBe("rgb");
  },
);

it.each(["value", "format"])(
  "keeps the untouched model after canceled reset and a newer %s change",
  async (model) => {
    await mount(
      <form>
        <ColorPicker.Root defaultValue="#0000ff" name="accent">
          <ColorPicker.Swatch swatchValue="#00ff00">Green</ColorPicker.Swatch>
          <ColorPicker.Swatch swatchValue="#ff0000">Red</ColorPicker.Swatch>
          <ColorPicker.FormatSelect>
            <option value="hex">Hex</option>
            <option value="hsl">HSL</option>
            <option value="rgb">RGB</option>
          </ColorPicker.FormatSelect>
          <ColorPicker.HiddenInput />
        </ColorPicker.Root>
      </form>,
    );
    const form = query<HTMLFormElement>("form"),
      select = query<HTMLSelectElement>("select");
    const swatches = container!.querySelectorAll<HTMLButtonElement>(
      "[data-sw-color-picker-swatch]",
    );
    const changeFormat = (format: string) => {
      select.value = format;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    };
    await act(() => {
      swatches[0]!.click();
      changeFormat("hsl");
    });
    form.addEventListener("reset", (event) => event.preventDefault());
    await act(() => {
      form.reset();
      if (model === "value") swatches[1]!.click();
      else changeFormat("rgb");
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(
      parseColor(query<HTMLElement>("[data-sw-color-picker]").dataset.value!)?.toString("hex"),
    ).toBe(model === "value" ? "#ff0000" : "#00ff00");
    expect(select.value).toBe(model === "value" ? "hsl" : "rgb");
    expect(parseColor(String(new FormData(form).get("accent")))?.toString("hex")).toBe(
      model === "value" ? "#ff0000" : "#00ff00",
    );
  },
);
it.each(["invalid", null])(
  "keeps the last valid controlled color after rejected input %s and reset",
  async (invalid) => {
    const picker = (value: string | null) => (
      <form>
        <ColorPicker.Root value={value} name="accent">
          <ColorPicker.HiddenInput />
        </ColorPicker.Root>
      </form>
    );
    await mount(picker("#ff0000"));
    await render(picker("#00ff00"));
    await render(picker(invalid));
    expect(query<HTMLElement>("[data-sw-color-picker]").dataset.value).toContain("00ff00");
    await act(() => query<HTMLFormElement>("form").reset());
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(query<HTMLElement>("[data-sw-color-picker]").dataset.value).toContain("00ff00");
    await render(picker("#0000ff"));
    await act(() => {
      query<HTMLFormElement>("form").reset();
      reactRoot!.render(picker(invalid));
    });
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(query<HTMLElement>("[data-sw-color-picker]").dataset.value).toContain("0000ff");
  },
);
