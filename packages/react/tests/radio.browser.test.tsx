import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Radio } from "../src/radio";
import { RadioGroup } from "../src/radio-group";

let reactRoot: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(async () => {
  if (reactRoot) await act(() => reactRoot?.unmount());
  container?.remove();
  reactRoot = undefined;
  container = undefined;
});

describe("React Radio cancellation", () => {
  it("keeps standalone uncontrolled state unchanged when onCheckedChange cancels", async () => {
    const onCheckedChange = vi.fn((_checked, details) => details.cancel());
    await mount(
      <Radio.Root value="ssd" onCheckedChange={onCheckedChange}>
        <Radio.Indicator />
      </Radio.Root>,
    );
    const radio = query<HTMLElement>("[data-sw-radio]");
    const input = query<HTMLInputElement>("[data-sw-radio-input]");

    radio.click();
    await flush();

    expect(onCheckedChange).toHaveBeenCalledOnce();
    expect(onCheckedChange.mock.calls[0]?.[1].isCanceled).toBe(true);
    expect(radio).toHaveAttribute("aria-checked", "false");
    expect(input.checked).toBe(false);
  });

  it("keeps grouped uncontrolled state unchanged when onValueChange cancels", async () => {
    const onValueChange = vi.fn((_value, details) => details.cancel());
    await mount(
      <RadioGroup.Root defaultValue="ssd" name="storage" onValueChange={onValueChange}>
        <Radio.Root value="ssd">
          <Radio.Indicator />
        </Radio.Root>
        <Radio.Root value="hdd">
          <Radio.Indicator />
        </Radio.Root>
      </RadioGroup.Root>,
    );
    const group = query<HTMLElement>("[data-sw-radio-group]");
    const radios = queryAll<HTMLElement>("[data-sw-radio]");
    const inputs = queryAll<HTMLInputElement>("[data-sw-radio-input]");

    radios[1]?.click();
    await flush();

    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]?.[1].isCanceled).toBe(true);
    expect(group).toHaveAttribute("data-value", "ssd");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(inputs[0]?.checked).toBe(true);
    expect(inputs[1]?.checked).toBe(false);
  });

  it("does not publish child uncontrolled state before a group veto", async () => {
    const accepted = vi.fn();
    const onCheckedChange = vi.fn((_checked, details) => details.onAccepted(accepted));
    const onValueChange = vi.fn((_value, details) => details.cancel());
    await mount(
      <RadioGroup.Root defaultValue="ssd" name="storage" onValueChange={onValueChange}>
        <Radio.Root value="ssd">
          <Radio.Indicator />
        </Radio.Root>
        <Radio.Root value="hdd" onCheckedChange={onCheckedChange}>
          <Radio.Indicator />
        </Radio.Root>
      </RadioGroup.Root>,
    );
    const radios = queryAll<HTMLElement>("[data-sw-radio]");
    const inputs = queryAll<HTMLInputElement>("[data-sw-radio-input]");

    radios[1]?.click();
    await flush();

    expect(onCheckedChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(accepted).not.toHaveBeenCalled();
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(inputs[0]?.checked).toBe(true);
    expect(inputs[1]?.checked).toBe(false);
  });

  it("keeps standalone React state synchronized when an accepted callback throws", async () => {
    const error = new Error("accepted callback failed");
    const laterAccepted = vi.fn();
    const reportedErrors: unknown[] = [];
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      reportedErrors.push(event.error);
    };
    window.addEventListener("error", handleError);
    await mount(
      <Radio.Root
        value="ssd"
        onCheckedChange={(_checked, details) => {
          details.onAccepted(() => {
            throw error;
          });
          details.onAccepted(laterAccepted);
        }}
      >
        <Radio.Indicator />
      </Radio.Root>,
    );

    query<HTMLElement>("[data-sw-radio]").click();
    await flush();
    window.removeEventListener("error", handleError);

    expect(reportedErrors).toContain(error);
    expect(laterAccepted).toHaveBeenCalledOnce();
    expect(query<HTMLElement>("[data-sw-radio]")).toHaveAttribute("aria-checked", "true");
    expect(query<HTMLInputElement>("[data-sw-radio-input]").checked).toBe(true);
  });

  it("does not publish child acceptance when a group proposal throws before commit", async () => {
    const error = new Error("group proposal failed");
    const childAccepted = vi.fn();
    const reportedErrors: unknown[] = [];
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      reportedErrors.push(event.error);
    };
    window.addEventListener("error", handleError);
    await mount(
      <RadioGroup.Root
        defaultValue="ssd"
        onValueChange={() => {
          throw error;
        }}
      >
        <Radio.Root value="ssd" />
        <Radio.Root
          value="hdd"
          onCheckedChange={(_checked, details) => details.onAccepted(childAccepted)}
        />
      </RadioGroup.Root>,
    );

    queryAll<HTMLElement>("[data-sw-radio]")[1]!.click();
    await flush();
    window.removeEventListener("error", handleError);

    expect(reportedErrors).toContain(error);
    expect(childAccepted).not.toHaveBeenCalled();
    expect(query<HTMLElement>("[data-sw-radio-group]")).toHaveAttribute("data-value", "ssd");
    expect(queryAll<HTMLElement>("[data-sw-radio]")[1]).toHaveAttribute("aria-checked", "false");
  });

  it("publishes only the current child when accepted group work reenters another child", async () => {
    const hddAccepted = vi.fn();
    const nvmeAccepted = vi.fn();
    await mount(
      <RadioGroup.Root
        defaultValue="ssd"
        onValueChange={(nextValue, details) => {
          if (nextValue === "hdd") {
            details.onAccepted(() => queryAll<HTMLElement>("[data-sw-radio]")[2]!.click());
          }
        }}
      >
        <Radio.Root value="ssd" />
        <Radio.Root
          value="hdd"
          onCheckedChange={(_checked, details) => details.onAccepted(hddAccepted)}
        />
        <Radio.Root
          value="nvme"
          onCheckedChange={(_checked, details) => details.onAccepted(nvmeAccepted)}
        />
      </RadioGroup.Root>,
    );

    queryAll<HTMLElement>("[data-sw-radio]")[1]!.click();
    await flush();

    expect(hddAccepted).not.toHaveBeenCalled();
    expect(nvmeAccepted).toHaveBeenCalledOnce();
    expect(query<HTMLElement>("[data-sw-radio-group]")).toHaveAttribute("data-value", "nvme");
    expect(queryAll<HTMLElement>("[data-sw-radio]")[2]).toHaveAttribute("aria-checked", "true");
  });

  it("renders the newest reentrant uncontrolled group transition", async () => {
    await mount(
      <RadioGroup.Root
        defaultValue="ssd"
        onValueChange={(nextValue, details) => {
          if (nextValue === "hdd") {
            details.onAccepted(() => queryAll<HTMLElement>("[data-sw-radio]")[2]!.click());
          }
        }}
      >
        <Radio.Root value="ssd" />
        <Radio.Root value="hdd" />
        <Radio.Root value="nvme" />
      </RadioGroup.Root>,
    );

    queryAll<HTMLElement>("[data-sw-radio]")[1]!.click();
    await flush();

    expect(query<HTMLElement>("[data-sw-radio-group]")).toHaveAttribute("data-value", "nvme");
    expect(queryAll<HTMLElement>("[data-sw-radio]")[2]).toHaveAttribute("aria-checked", "true");
    expect(queryAll<HTMLInputElement>("[data-sw-radio-input]")[2]?.checked).toBe(true);
  });

  it("treats cancellation after standalone acceptance as inert", async () => {
    let acceptedDetails: { readonly isCanceled: boolean } | undefined;
    await mount(
      <Radio.Root
        value="ssd"
        onCheckedChange={(_checked, details) => {
          acceptedDetails = details;
          details.onAccepted(() => details.cancel());
        }}
      />,
    );

    query<HTMLElement>("[data-sw-radio]").click();
    await flush();

    expect(acceptedDetails?.isCanceled).toBe(false);
    expect(query<HTMLElement>("[data-sw-radio]")).toHaveAttribute("aria-checked", "true");
  });

  it("synchronizes uncontrolled group rendering from Runtime-owned native reset", async () => {
    await mount(
      <form>
        <RadioGroup.Root defaultValue="ssd" name="storage">
          <Radio.Root value="ssd">
            <Radio.Indicator />
          </Radio.Root>
          <Radio.Root value="hdd">
            <Radio.Indicator />
          </Radio.Root>
        </RadioGroup.Root>
      </form>,
    );
    const form = query<HTMLFormElement>("form");
    const group = query<HTMLElement>("[data-sw-radio-group]");
    const radios = queryAll<HTMLElement>("[data-sw-radio]");
    const inputs = queryAll<HTMLInputElement>("[data-sw-radio-input]");
    radios[1]?.click();
    await flush();

    await act(async () => {
      form.reset();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    expect(group).toHaveAttribute("data-value", "ssd");
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[1]).toHaveAttribute("aria-checked", "false");
    expect(inputs[0]?.checked).toBe(true);
    expect(inputs[1]?.checked).toBe(false);
    expect(new FormData(form).get("storage")).toBe("ssd");
  });
});

async function mount(node: React.ReactNode): Promise<void> {
  container = document.createElement("div");
  document.body.append(container);
  reactRoot = createRoot(container);
  await act(() => reactRoot!.render(node));
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

function query<T extends Element>(selector: string): T {
  return container!.querySelector<T>(selector)!;
}

function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(container!.querySelectorAll<T>(selector));
}
