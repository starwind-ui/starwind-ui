import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InputOtpRootProps } from "../src/input-otp/InputOtpRoot";
import { InputOtp, type InputOtpValueChangeDetails } from "../src/input-otp/index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;
afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

async function mount(initial: InputOtpRootProps = {}) {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  let update: React.Dispatch<React.SetStateAction<InputOtpRootProps>> = () => undefined;
  function Harness() {
    const [props, setProps] = React.useState(initial);
    update = setProps;
    return (
      <form>
        <InputOtp.Root name="code" {...props}>
          <InputOtp.Group>
            {Array.from({ length: 6 }, (_, index) => (
              <InputOtp.Slot index={index} key={index} />
            ))}
          </InputOtp.Group>
        </InputOtp.Root>
      </form>
    );
  }
  await act(() =>
    reactRoot!.render(
      <React.StrictMode>
        <Harness />
      </React.StrictMode>,
    ),
  );
  const form = container.querySelector("form")!;
  const input = container.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")!;
  const root = container.querySelector<HTMLElement>("[data-sw-input-otp]")!;
  const change = async (value: string) =>
    act(() => {
      input.value = value;
      input.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }),
      );
    });
  const configure = async (props: InputOtpRootProps) =>
    act(() => update((previous) => ({ ...previous, ...props })));
  const reset = async () =>
    act(async () => {
      form.reset();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  const expectValue = (value: string) => {
    expect(input.value).toBe(value);
    expect(new FormData(form).get("code")).toBe(value);
    expect(
      [...container!.querySelectorAll("[data-sw-input-otp-char]")]
        .map((slot) => slot.textContent)
        .join(""),
    ).toBe(value);
  };
  const setProps = (props: InputOtpRootProps) => update((previous) => ({ ...previous, ...props }));
  return { form, input, root, change, configure, setProps, reset, expectValue };
}

describe("React Input OTP reset baseline and fixed slots", () => {
  it.each([{ readOnly: true }, { pattern: "[0-9]" }])(
    "preserves the mount seed through %j reconstruction",
    async (options) => {
      const onValueChange = vi.fn();
      const otp = await mount({ defaultValue: "12", onValueChange });
      await otp.change("34");
      await otp.configure({ ...options, defaultValue: "99" });
      otp.expectValue("34");
      await otp.reset();
      otp.expectValue("12");
      await otp.configure({ readOnly: false, pattern: "[0-9]+" });
      otp.expectValue("12");
      expect(onValueChange).toHaveBeenCalledTimes(1);
    },
  );

  it("retains an empty mount seed when no default was supplied", async () => {
    const otp = await mount();
    await otp.change("34");
    await otp.configure({ readOnly: true });
    await otp.reset();
    otp.expectValue("");
  });

  it.each(["34", ""])(
    "keeps controlled value %j through reconstruction and reset",
    async (value) => {
      const onValueChange = vi.fn();
      const otp = await mount({ defaultValue: "12", value, onValueChange });
      otp.expectValue(value);
      await otp.configure({ readOnly: true });
      await otp.reset();
      otp.expectValue(value);
      await otp.configure({ value: "56", pattern: "[0-9]" });
      await otp.reset();
      otp.expectValue("56");
      expect(onValueChange).not.toHaveBeenCalled();
    },
  );

  it("keeps accepted state after canceled proposals and native reset", async () => {
    let cancel = false;
    const onValueChange = vi.fn((_value: string, details: InputOtpValueChangeDetails) => {
      if (cancel) details.cancel();
    });
    const otp = await mount({ defaultValue: "12", onValueChange });
    await otp.change("34");
    cancel = true;
    await otp.change("56");
    otp.expectValue("34");
    cancel = false;
    otp.form.addEventListener("starwind:value-change", (event) => event.preventDefault(), {
      once: true,
    });
    await otp.change("78");
    otp.expectValue("34");
    await otp.configure({ pattern: "[0-9]" });
    otp.form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
    await otp.reset();
    otp.expectValue("34");
    await otp.reset();
    otp.expectValue("12");
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });

  it("uses stable slot elements when length changes and keeps keyboard behavior", async () => {
    const otp = await mount({ defaultValue: "1234" });
    const slots = [...container!.querySelectorAll("[data-sw-input-otp-slot]")];
    await otp.configure({ maxLength: 3 });
    otp.expectValue("123");
    await otp.configure({ maxLength: 6 });
    await act(() => {
      otp.root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "4" }));
    });
    otp.expectValue("1234");
    expect([...container!.querySelectorAll("[data-sw-input-otp-slot]")]).toEqual(slots);
    await otp.reset();
    otp.expectValue("1234");
  });

  it("applies a later defined value as a silent command and keeps later typing", async () => {
    const onValueChange = vi.fn();
    const otp = await mount({ onValueChange });
    await otp.configure({ value: "1234" });
    otp.expectValue("1234");
    expect(otp.root.getAttribute("data-value")).toBe("1234");
    expect(onValueChange).not.toHaveBeenCalled();
    await otp.change("12345");
    otp.expectValue("12345");
    await otp.configure({ readOnly: false });
    otp.expectValue("12345");
    expect(otp.root.getAttribute("data-value")).toBe("12345");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    await otp.reset();
    otp.expectValue("");
  });

  it("keeps a refused change out of the input and form data", async () => {
    const onValueChange = vi.fn();
    const otp = await mount({ value: "12", onValueChange });
    await otp.change("34");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    otp.expectValue("12");
    expect(otp.root.getAttribute("data-value")).toBe("12");
  });

  it("keeps the last controlled value after the prop becomes undefined", async () => {
    const onValueChange = vi.fn();
    const otp = await mount({ value: "12", onValueChange });
    await otp.configure({ value: undefined });
    otp.expectValue("12");
    expect(otp.root.getAttribute("data-value")).toBe("12");
    await otp.change("34");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    otp.expectValue("12");
    expect(otp.root.getAttribute("data-value")).toBe("12");
    await otp.configure({ readOnly: false });
    otp.expectValue("12");
    expect(otp.root.getAttribute("data-value")).toBe("12");
  });

  it("keeps a parent-accepted change made outside act", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
    try {
      let accept: (value: string) => void = () => undefined;
      const onValueChange = vi.fn((value: string) => accept(value));
      const otp = await mount({ value: "12", onValueChange });
      accept = (value) => otp.setProps({ value });
      otp.input.value = "34";
      otp.input.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: "34" }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      otp.expectValue("34");
      expect(otp.root.getAttribute("data-value")).toBe("34");
    } finally {
      (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    }
  });

  it("keeps each change a parent accepts", async () => {
    let accept: (value: string) => void = () => undefined;
    const onValueChange = vi.fn((value: string) => accept(value));
    const otp = await mount({ value: "12", onValueChange });
    accept = (value) => otp.setProps({ value });
    await otp.change("123");
    await otp.change("1234");
    expect(onValueChange).toHaveBeenCalledTimes(2);
    otp.expectValue("1234");
    expect(otp.root.getAttribute("data-value")).toBe("1234");
  });

  it("retires pending reset work when a Strict Mode owner unmounts", async () => {
    const onValueChange = vi.fn();
    const otp = await mount({ defaultValue: "12", onValueChange });
    await otp.change("34");
    await act(() => {
      otp.form.reset();
      reactRoot!.unmount();
    });
    reactRoot = undefined;
    otp.input.value = "56";
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(otp.input.value).toBe("56");
    otp.input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});
