import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AvatarFallback, AvatarImage, AvatarRoot } from "@starwind-ui/vue/avatar";

type ExposedElement<T extends HTMLElement> = ComponentPublicInstance & { element: T | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Avatar public behavior", () => {
  it("forwards semantic attrs, slots, refs, native listeners, and detailed Runtime status events", async () => {
    const rootRef = ref<ExposedElement<HTMLSpanElement> | null>(null);
    const imageRef = ref<ExposedElement<HTMLImageElement> | null>(null);
    const fallbackRef = ref<ExposedElement<HTMLSpanElement> | null>(null);
    const statuses: Array<{ detail: unknown; status: string }> = [];
    const onLoad = vi.fn();
    const { app, host } = mountAvatar({
      fallbackRef,
      imageRef,
      onLoad,
      onLoadingStatusChange: (status, detail) => statuses.push({ detail, status }),
      rootRef,
    });

    const root = host.querySelector<HTMLElement>("[data-sw-avatar]")!;
    const image = host.querySelector<HTMLImageElement>("[data-sw-avatar-image]")!;
    const fallback = host.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!;
    expect(root.tagName).toBe("SPAN");
    expect(image.tagName).toBe("IMG");
    expect(fallback.tagName).toBe("SPAN");
    expect(root.className).toBe("avatar-root");
    expect(image.getAttribute("aria-label")).toBe("Profile photo");
    expect(fallback.textContent).toBe("AB");
    expect(rootRef.value?.element).toBe(root);
    expect(imageRef.value?.element).toBe(image);
    expect(fallbackRef.value?.element).toBe(fallback);
    expect(rootRef.value).not.toHaveProperty("instance");

    expect(root.dataset.imageLoadingStatus).toBe("error");
    expect(image.hidden).toBe(true);
    expect(fallback.hidden).toBe(false);
    expect(statuses).toEqual([
      { detail: { previousStatus: "idle", status: "error" }, status: "error" },
    ]);

    image.dispatchEvent(new Event("load"));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(root.dataset.imageLoadingStatus).toBe("loaded");
    expect(image.hidden).toBe(false);
    expect(fallback.hidden).toBe(true);
    expect(statuses.at(-1)).toMatchObject({
      detail: { event: expect.any(Event), previousStatus: "error", status: "loaded" },
      status: "loaded",
    });

    image.dispatchEvent(new Event("error"));
    expect(root.dataset.imageLoadingStatus).toBe("error");
    expect(image.hidden).toBe(true);
    expect(fallback.hidden).toBe(false);
    expect(statuses.at(-1)).toMatchObject({
      detail: { event: expect.any(Event), previousStatus: "loaded", status: "error" },
      status: "error",
    });

    app.unmount();
    cleanups.pop();
  });

  it("keeps delayed fallbacks Runtime-owned and isolates multiple roots", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h("main", null, [
          avatarTree({ delay: 20, id: "first" }),
          avatarTree({ delay: 40, id: "second" }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const first = host.querySelector<HTMLElement>("#first")!;
    const second = host.querySelector<HTMLElement>("#second")!;
    const firstFallback = first.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!;
    const secondFallback = second.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!;
    expect(firstFallback.hidden).toBe(true);
    expect(secondFallback.hidden).toBe(true);

    await new Promise((resolve) => window.setTimeout(resolve, 25));
    expect(firstFallback.hidden).toBe(false);
    expect(secondFallback.hidden).toBe(true);

    first.querySelector("img")!.dispatchEvent(new Event("load"));
    expect(first.dataset.imageLoadingStatus).toBe("loaded");
    expect(second.dataset.imageLoadingStatus).toBe("error");
    await new Promise((resolve) => window.setTimeout(resolve, 35));
    expect(secondFallback.hidden).toBe(false);
  });

  it("hydrates deterministic hidden markup without warnings or duplicate Runtime ownership", async () => {
    const tree = () => avatarTree({ delay: 10, id: "hydrated-avatar" });
    const html = await renderToString(createSSRApp({ render: tree }));
    expect(html).toContain("<img");
    expect(html).toContain(" hidden");
    expect(html).toContain('data-image-loading-status="idle"');

    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-avatar")).toHaveLength(1);
    expect(host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status")).toBe(
      "error",
    );
  });

  it("emits one initial loaded detail when the image completes before Root hydration", async () => {
    const imageSource = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    const statuses: Array<{ previousStatus: string; status: string }> = [];
    const tree = () =>
      h(
        AvatarRoot,
        { id: "preloaded-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Profile",
              onLoadingStatusChange: (status, detail) =>
                statuses.push({ previousStatus: detail.previousStatus, status }),
              src: imageSource,
            }),
            h(AvatarFallback, { delay: 100 }, { default: () => "AB" }),
          ],
        },
      );
    const html = await renderToString(createSSRApp({ render: tree }));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const image = host.querySelector<HTMLImageElement>("img")!;
    const fallback = host.querySelector<HTMLElement>("[data-sw-avatar-fallback]")!;
    await waitForCompleteImage(image);
    expect(fallback.hidden).toBe(true);

    const warnings: string[] = [];
    const app = createSSRApp({ render: tree });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(statuses).toEqual([{ previousStatus: "idle", status: "loaded" }]);
    expect(host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status")).toBe(
      "loaded",
    );
    expect(fallback.hidden).toBe(true);
  });

  it("removes listeners, observers, timers, and controller ownership across remount", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const removeEventListener = vi.spyOn(EventTarget.prototype, "removeEventListener");
    const visible = ref(true);
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp(
      defineComponent({
        setup() {
          return () => (visible.value ? avatarTree({ delay: 30, id: "remount" }) : null);
        },
      }),
    );
    app.mount(host);
    cleanups.push(() => app.unmount());

    visible.value = false;
    await nextTick();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledWith(
      "starwind:loading-status-change",
      expect.any(Function),
    );

    visible.value = true;
    await nextTick();
    expect(host.querySelectorAll("[data-sw-avatar]")).toHaveLength(1);
    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(2);
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
});

function mountAvatar(options: {
  fallbackRef: ReturnType<typeof ref<ExposedElement<HTMLSpanElement> | null>>;
  imageRef: ReturnType<typeof ref<ExposedElement<HTMLImageElement> | null>>;
  onLoad: () => void;
  onLoadingStatusChange: (status: string, detail: unknown) => void;
  rootRef: ReturnType<typeof ref<ExposedElement<HTMLSpanElement> | null>>;
}) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    render: () =>
      h(
        AvatarRoot,
        { class: "avatar-root", ref: options.rootRef },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Profile",
              "aria-label": "Profile photo",
              onLoad: options.onLoad,
              onLoadingStatusChange: options.onLoadingStatusChange,
              ref: options.imageRef,
            }),
            h(AvatarFallback, { ref: options.fallbackRef }, { default: () => "AB" }),
          ],
        },
      ),
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return { app, host };
}

function avatarTree({ delay, id }: { delay?: number; id: string }) {
  return h(
    AvatarRoot,
    { id },
    {
      default: () => [
        h(AvatarImage, { alt: "Profile" }),
        h(AvatarFallback, { delay }, { default: () => "AB" }),
      ],
    },
  );
}

async function waitForCompleteImage(image: HTMLImageElement): Promise<void> {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Test image did not load.")), {
        once: true,
      });
    });
  }
  expect(image.complete).toBe(true);
  expect(image.naturalWidth).toBeGreaterThan(0);
}
