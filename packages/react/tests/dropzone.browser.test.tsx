import { createDropzone } from "@starwind-ui/runtime/dropzone";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Dropzone } from "../src/dropzone";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("reconnects keyed and returning Dropzone inputs while preserving files and controller identity", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let notifications = 0;
  const render = (key: number | null) => (
    <form>
      <Dropzone.Root isUploading onFilesChange={() => notifications++}>
        {key !== null && <Dropzone.Input key={key} name="files" />}
        <Dropzone.FilesList />
      </Dropzone.Root>
    </form>
  );
  try {
    await act(() => root.render(render(0)));
    const element = host.querySelector<HTMLElement>("[data-sw-dropzone]")!;
    const instance = createDropzone(element);
    const retired = instance.input;
    const file = new File(["saved"], "saved.txt");
    instance.setFiles([file]);
    await act(() => root.render(render(1)));
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    const next = host.querySelector<HTMLInputElement>("input")!;
    expect(next).not.toBe(retired);
    expect(next.files?.[0]?.name).toBe("saved.txt");
    expect(instance.input).toBe(next);
    expect(instance.getUploading()).toBe(true);
    expect(createDropzone(element)).toBe(instance);
    const transfer = new DataTransfer();
    transfer.items.add(new File(["old"], "retired.txt"));
    retired.files = transfer.files;
    retired.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.getFiles()[0]?.name).toBe("saved.txt");
    expect(notifications).toBe(1);
    await act(() => root.render(render(null)));
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    await act(() => root.render(render(2)));
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
    expect(host.querySelector<HTMLInputElement>("input")!.files?.[0]?.name).toBe("saved.txt");
    expect((new FormData(host.querySelector("form")!).get("files") as File).name).toBe("saved.txt");
  } finally {
    await act(() => root.unmount());
    host.remove();
  }
});
