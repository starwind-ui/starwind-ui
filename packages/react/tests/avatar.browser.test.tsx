import { createAvatar } from "@starwind-ui/runtime/avatar";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "../src/avatar";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let owner: Root | undefined;
afterEach(async () => {
  if (owner) await act(() => owner?.unmount());
  owner = undefined;
  host?.remove();
  vi.restoreAllMocks();
});
async function render(tree: React.ReactNode) {
  if (!owner) {
    host = document.createElement("div");
    document.body.append(host);
    owner = createRoot(host);
  }
  await act(async () => {
    owner!.render(tree);
  });
}

describe("React Avatar owned parts", () => {
  it("refreshes late, replaced, and removed parts under one controller", async () => {
    const statuses = vi.fn();
    const tree = (image: number | null, fallback = 0, title = "first") => (
      <Avatar.Root title={title}>
        {image !== null && (
          <Avatar.Image key={image} alt="Profile" onLoadingStatusChange={statuses} />
        )}
        <Avatar.Fallback key={`fallback-${fallback}`}>AB</Avatar.Fallback>
      </Avatar.Root>
    );
    await render(tree(null));
    const root = host.querySelector<HTMLElement>("[data-sw-avatar]")!;
    const instance = createAvatar(root);
    const refresh = vi.spyOn(instance, "refresh");
    await render(tree(0));
    const first = root.querySelector<HTMLImageElement>("img")!;
    expect(createAvatar(root)).toBe(instance);
    expect(refresh).toHaveBeenCalledTimes(1);
    first.dispatchEvent(new Event("load"));
    expect(instance.getImageLoadingStatus()).toBe("loaded");
    await render(tree(0, 1));
    expect(root.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!.hidden).toBe(true);
    expect(instance.getImageLoadingStatus()).toBe("loaded");
    refresh.mockClear();
    await render(tree(0, 1, "unrelated"));
    expect(refresh).not.toHaveBeenCalled();
    await render(tree(1, 1));
    expect(createAvatar(root)).toBe(instance);
    expect(instance.getImageLoadingStatus()).toBe("error");
    const count = statuses.mock.calls.length;
    first.dispatchEvent(new Event("load"));
    expect(statuses).toHaveBeenCalledTimes(count);
    const next = root.querySelector<HTMLImageElement>("img")!;
    next.dispatchEvent(new Event("load"));
    await render(tree(null, 1));
    expect(instance.getImageLoadingStatus()).toBe("error");
    expect(root.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!.hidden).toBe(false);
    next.dispatchEvent(new Event("load"));
    expect(instance.getImageLoadingStatus()).toBe("error");
  });

  it("isolates nested owners and retires pending work on Strict Mode teardown", async () => {
    const outerChanges = vi.fn();
    const tree = (image: boolean) => (
      <React.StrictMode>
        <Avatar.Root id="outer">
          <Avatar.Image alt="Outer" onLoadingStatusChange={outerChanges} />
          <Avatar.Root id="inner">
            {image && <Avatar.Image alt="Inner" />}
            <Avatar.Fallback>Inner</Avatar.Fallback>
          </Avatar.Root>
        </Avatar.Root>
      </React.StrictMode>
    );
    await render(tree(false));
    const outer = createAvatar(host.querySelector<HTMLElement>("#outer")!);
    const inner = createAvatar(host.querySelector<HTMLElement>("#inner")!);
    const outerRefresh = vi.spyOn(outer, "refresh");
    await render(tree(true));
    const image = host.querySelector<HTMLImageElement>("#inner img")!;
    const count = outerChanges.mock.calls.length;
    image.dispatchEvent(new Event("load"));
    expect(inner.getImageLoadingStatus()).toBe("loaded");
    expect(outerChanges).toHaveBeenCalledTimes(count);
    expect(outerRefresh).not.toHaveBeenCalled();
    const refresh = vi.spyOn(inner, "refresh");
    await act(() => owner!.unmount());
    owner = undefined;
    await Promise.resolve();
    expect(refresh).not.toHaveBeenCalled();
    image.dispatchEvent(new Event("error"));
    expect(inner.getImageLoadingStatus()).toBe("loaded");
  });
});
