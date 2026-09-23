import { createInput } from "@starwind-ui/runtime/input";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Dropzone } from "../src/dropzone";
import { Input } from "../src/input";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("reconnects Input to a replaced external form without replacing its controller or reset seed", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(() =>
      root.render(
        <>
          <form id="input-owner" />
          <Input.Root form="input-owner" defaultValue="seed" />
        </>,
      ),
    );
    const input = host.querySelector("input")!;
    const instance = createInput(input);
    instance.setValue("accepted", { emit: false });
    const oldForm = host.querySelector("form")!;
    oldForm.id = "retired-input-owner";
    const nextForm = document.createElement("form");
    nextForm.id = "input-owner";
    host.append(nextForm);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    oldForm.reset();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(instance.getValue()).toBe("accepted");
    nextForm.reset();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(instance.getValue()).toBe("seed");
    expect(createInput(input)).toBe(instance);
    nextForm.remove();
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});

it("shares document discovery across controls and releases the final subscription", async () => {
  const observe = vi.spyOn(MutationObserver.prototype, "observe");
  const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = (input: boolean) => (
    <>
      {input && <Input.Root defaultValue="seed" />}
      <Dropzone.Root>
        <Dropzone.Input />
      </Dropzone.Root>
    </>
  );
  try {
    await act(() => root.render(render(true)));
    const discovery = observe.mock.calls.flatMap(([node, options], index) =>
      node === document && options?.attributeFilter?.includes("form")
        ? [observe.mock.contexts[index]]
        : [],
    );
    expect(discovery).toHaveLength(1);
    const instance = createInput(host.querySelector<HTMLInputElement>("[data-sw-input]")!);
    const refresh = vi.spyOn(instance, "refresh");
    await act(() => root.render(render(false)));
    refresh.mockClear();
    host.id = "discovery-survivor";
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(refresh).not.toHaveBeenCalled();
    expect(disconnect.mock.contexts).not.toContain(discovery[0]);
    await act(() => root.unmount());
    expect(disconnect.mock.contexts.filter((observer) => observer === discovery[0])).toHaveLength(
      1,
    );
  } finally {
    await act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
  }
});

it("keeps native edits accepted after callback cancellation and preserves controlled reset after reassociation", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let calls = 0;
  try {
    await act(() =>
      root.render(
        <>
          <form id="react-input-form" />
          <Input.Root
            form="react-input-form"
            defaultValue="seed"
            onValueChange={(_value, detail) => {
              calls++;
              detail.cancel();
            }}
          />
          <Input.Root form="react-input-form" value="controlled" readOnly />
        </>,
      ),
    );
    const [native, controlled] = [...host.querySelectorAll("input")];
    const instance = createInput(native!);
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        native,
        "typed",
      );
      native!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(native!.value).toBe("typed");
    expect(instance.getValue()).toBe("typed");
    expect(calls).toBe(1);
    const oldForm = host.querySelector("form")!;
    oldForm.id = "retired-controlled";
    const form = document.createElement("form");
    form.id = "react-input-form";
    host.append(form);
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    form.reset();
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(controlled!.value).toBe("controlled");
    expect(createInput(controlled!).getValue()).toBe("controlled");
    expect(calls).toBe(1);
    form.remove();
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});
