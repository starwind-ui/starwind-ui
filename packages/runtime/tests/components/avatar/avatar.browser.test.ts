import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAvatar } from "../../../src/components/avatar/avatar";

describe("createAvatar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows fallback while the image is loading", () => {
    const root = renderAvatar();

    createAvatar(root);

    expect(root.getAttribute("data-image-loading-status")).toBe("loading");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it("shows the image and hides fallback when the image loads", () => {
    const root = renderAvatar();
    const listener = vi.fn();
    root.addEventListener("starwind:loading-status-change", listener);

    createAvatar(root);
    getImage().dispatchEvent(new Event("load"));

    expect(root.getAttribute("data-image-loading-status")).toBe("loaded");
    expect(getImage().hidden).toBe(false);
    expect(getFallback().hidden).toBe(true);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          previousStatus: "loading",
          status: "loaded",
        }),
      }),
    );
  });

  it("shows fallback and hides image when the image errors", () => {
    const root = renderAvatar();

    createAvatar(root);
    getImage().dispatchEvent(new Event("error"));

    expect(root.getAttribute("data-image-loading-status")).toBe("error");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it("shows fallback when no image source is present", () => {
    const root = renderAvatar({ src: "" });

    createAvatar(root);

    expect(root.getAttribute("data-image-loading-status")).toBe("error");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it("treats srcset-only images as loading instead of missing source", () => {
    const root = renderAvatar({ src: "", srcSet: "/avatar-small.png 1x, /avatar-large.png 2x" });

    createAvatar(root);

    expect(root.getAttribute("data-image-loading-status")).toBe("loading");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it.each(["", "   "])("treats %j srcset as missing source", (srcSet) => {
    const root = renderAvatar({ src: "", srcSet });

    createAvatar(root);

    expect(root.getAttribute("data-image-loading-status")).toBe("error");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it("keeps delayed fallback hidden until the delay elapses", () => {
    vi.useFakeTimers();
    const root = renderAvatar({ fallbackDelay: 100 });

    createAvatar(root);

    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(99);
    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(1);
    expect(getFallback().hidden).toBe(false);
  });

  it("restarts delayed fallback when the image source changes", async () => {
    vi.useFakeTimers();
    const root = renderAvatar({ fallbackDelay: 100 });

    createAvatar(root);
    vi.advanceTimersByTime(100);
    expect(getFallback().hidden).toBe(false);

    getImage().setAttribute("src", "/avatar-next.png");
    await Promise.resolve();

    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(99);
    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(1);
    expect(getFallback().hidden).toBe(false);
  });

  it("restarts delayed fallback when responsive image sizes change", async () => {
    vi.useFakeTimers();
    const root = renderAvatar({
      fallbackDelay: 100,
      src: "",
      srcSet: "/avatar-small.png 1x, /avatar-large.png 2x",
    });

    createAvatar(root);
    vi.advanceTimersByTime(100);
    expect(getFallback().hidden).toBe(false);

    getImage().setAttribute("sizes", "(min-width: 768px) 128px, 64px");
    await Promise.resolve();

    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(99);
    expect(getFallback().hidden).toBe(true);

    vi.advanceTimersByTime(1);
    expect(getFallback().hidden).toBe(false);
  });

  it("uses cached image state immediately", () => {
    const root = renderAvatar();
    const image = getImage();
    Object.defineProperty(image, "complete", { configurable: true, value: true });
    Object.defineProperty(image, "naturalWidth", { configurable: true, value: 64 });

    createAvatar(root);

    expect(root.getAttribute("data-image-loading-status")).toBe("loaded");
    expect(image.hidden).toBe(false);
    expect(getFallback().hidden).toBe(true);
  });

  it.each([
    {
      name: "loading",
      options: {},
      prepare: () => {},
      status: "loading",
    },
    {
      name: "cached loaded",
      options: {},
      prepare: () => {
        Object.defineProperty(getImage(), "complete", { configurable: true, value: true });
        Object.defineProperty(getImage(), "naturalWidth", { configurable: true, value: 64 });
      },
      status: "loaded",
    },
    {
      name: "missing source error",
      options: { src: "" },
      prepare: () => {},
      status: "error",
    },
  ] as const)(
    "delivers initial $name status to runtime callbacks",
    ({ options, prepare, status }) => {
      const root = renderAvatar(options);
      const onLoadingStatusChange = vi.fn();
      const listener = vi.fn();
      root.addEventListener("starwind:loading-status-change", listener);
      prepare();

      createAvatar(root, { onLoadingStatusChange });

      const expectedDetails = expect.objectContaining({
        previousStatus: "idle",
        status,
      });
      expect(onLoadingStatusChange).toHaveBeenCalledWith(status, expectedDetails);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: expectedDetails }));
    },
  );

  it("returns existing instances and destroy removes listeners", () => {
    const root = renderAvatar();
    const avatar = createAvatar(root);

    expect(createAvatar(root)).toBe(avatar);

    avatar.destroy();
    getImage().dispatchEvent(new Event("load"));

    expect(root.getAttribute("data-image-loading-status")).toBe("loading");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
  });

  it("notifies subscribers for manual status changes and supports silent updates", () => {
    const root = renderAvatar();
    const onLoadingStatusChange = vi.fn();
    const listener = vi.fn();
    root.addEventListener("starwind:loading-status-change", listener);

    const avatar = createAvatar(root, { onLoadingStatusChange });
    const subscriber = vi.fn();
    const unsubscribe = avatar.subscribe("loadingStatusChange", subscriber);

    onLoadingStatusChange.mockClear();
    listener.mockClear();

    avatar.setImageLoadingStatus("loaded");

    const expectedDetails = expect.objectContaining({
      previousStatus: "loading",
      status: "loaded",
    });
    expect(avatar.getImageLoadingStatus()).toBe("loaded");
    expect(getImage().hidden).toBe(false);
    expect(getFallback().hidden).toBe(true);
    expect(onLoadingStatusChange).toHaveBeenCalledWith("loaded", expectedDetails);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: expectedDetails }));
    expect(subscriber).toHaveBeenCalledWith(expectedDetails);

    avatar.setImageLoadingStatus("error", { emit: false });

    expect(avatar.getImageLoadingStatus()).toBe("error");
    expect(getImage().hidden).toBe(true);
    expect(getFallback().hidden).toBe(false);
    expect(onLoadingStatusChange).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
    avatar.setImageLoadingStatus("loading");

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("clears delayed fallback timers when destroyed", () => {
    vi.useFakeTimers();
    const root = renderAvatar({ fallbackDelay: 100 });
    const avatar = createAvatar(root);

    expect(getFallback().hidden).toBe(true);

    avatar.destroy();
    vi.advanceTimersByTime(100);

    expect(getFallback().hidden).toBe(true);
  });
});

function renderAvatar(
  options: { fallbackDelay?: number; src?: string; srcSet?: string } = {},
): HTMLElement {
  const src = options.src ?? "/avatar.png";
  const srcSet = options.srcSet;
  document.body.innerHTML = `
    <span data-sw-avatar>
      <img
        data-sw-avatar-image
        ${src ? `src="${src}"` : ""}
        ${srcSet === undefined ? "" : `srcset="${srcSet}"`}
        alt="Jane Doe"
      />
      <span
        data-sw-avatar-fallback
        ${options.fallbackDelay === undefined ? "" : `data-delay="${options.fallbackDelay}"`}
      >
        JD
      </span>
    </span>
  `;

  return document.querySelector<HTMLElement>("[data-sw-avatar]")!;
}

function getImage(): HTMLImageElement {
  return document.querySelector<HTMLImageElement>("[data-sw-avatar-image]")!;
}

function getFallback(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!;
}
