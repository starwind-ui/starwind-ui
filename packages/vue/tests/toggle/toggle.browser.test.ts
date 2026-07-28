import {
  createApp,
  createSSRApp,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TogglePressedChangeDetails } from "@starwind-ui/runtime/toggle";
import { ToggleRoot } from "@starwind-ui/vue/toggle";
import { Toggle as StyledToggle } from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle";

type ToggleExposed = ComponentPublicInstance & { element: HTMLElement | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Toggle public behavior", () => {
  it("forwards attrs, listeners, slots, refs and accepts or cancels pressed changes in order", async () => {
    const exposed = ref<ToggleExposed | null>(null);
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleRoot,
          {
            "aria-label": "Pin",
            class: "pin",
            defaultPressed: false,
            onClick: () => events.push("click"),
            onPressedChange: (_pressed: boolean, detail: TogglePressedChangeDetails) => {
              events.push("detail");
              if (events.includes("cancel-next")) detail.cancel();
            },
            "onUpdate:pressed": () => events.push("update"),
            ref: exposed,
            style: { color: "rgb(255, 0, 0)" },
          },
          { default: () => "Pin message" },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const root = host.querySelector<HTMLButtonElement>("[data-sw-toggle]")!;
    expect(root.tagName).toBe("BUTTON");
    expect(root.type).toBe("button");
    expect(root.className).toBe("pin");
    expect(root.style.color).toBe("rgb(255, 0, 0)");
    expect(root.getAttribute("aria-label")).toBe("Pin");
    expect(root.textContent).toBe("Pin message");
    expect(exposed.value?.element).toBe(root);
    expect(exposed.value).not.toHaveProperty("instance");

    root.click();
    await settleModel();
    expect(events).toEqual(["click", "detail", "update"]);
    expect(root.getAttribute("aria-pressed")).toBe("true");

    events.push("cancel-next");
    root.click();
    await settleModel();
    expect(events).toEqual(["click", "detail", "update", "cancel-next", "click", "detail"]);
    expect(root.getAttribute("aria-pressed")).toBe("true");
  });

  it("delegates non-native pointer and keyboard activation to Runtime", async () => {
    const host = appendHost();
    const app = createApp({
      render: () => h(ToggleRoot, { nativeButton: false }, { default: () => "Non-native toggle" }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-toggle]")!;

    expect(root.tagName).toBe("SPAN");
    expect(root.getAttribute("role")).toBe("button");
    expect(root.tabIndex).toBe(0);

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    await settleModel();
    expect(root.getAttribute("aria-pressed")).toBe("true");

    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
    root.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
    await settleModel();
    expect(root.getAttribute("aria-pressed")).toBe("false");

    root.click();
    await settleModel();
    expect(root.getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps controlled state parent-owned and synchronizes accepted parent changes without emits", async () => {
    const props = reactive({ pressed: false });
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(ToggleRoot, {
          pressed: props.pressed,
          syncGroup: "controlled-pins",
          onPressedChange: () => events.push("detail"),
          "onUpdate:pressed": () => events.push("update"),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-toggle]")!;

    root.click();
    await settleModel();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("aria-pressed")).toBe("false");

    props.pressed = true;
    await nextTick();
    expect(root.getAttribute("aria-pressed")).toBe("true");
    expect(events).toEqual(["detail", "update"]);

    props.pressed = true;
    await nextTick();
    expect(events).toEqual(["detail", "update"]);
  });

  it("drops an old controlled event when its detailed handler changes ownership", async () => {
    const props = reactive<{ pressed: boolean | undefined }>({ pressed: false });
    const updates: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(ToggleRoot, {
          pressed: props.pressed,
          onPressedChange: () => {
            if (props.pressed !== undefined) props.pressed = undefined;
          },
          "onUpdate:pressed": (pressed: boolean) => updates.push(pressed),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-toggle]")!;

    root.click();
    await settleModel();
    expect(updates).toEqual([]);
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(root.getAttribute("data-state")).toBe("off");
    expect(root.hasAttribute("data-unpressed")).toBe(true);
    expect(root.hasAttribute("data-pressed")).toBe(false);

    root.click();
    await settleModel();
    expect(updates).toEqual([true]);
    expect(root.getAttribute("aria-pressed")).toBe("true");
    expect(root.getAttribute("data-state")).toBe("on");

    root.click();
    await settleModel();
    expect(updates).toEqual([true, false]);
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(root.getAttribute("data-state")).toBe("off");
  });

  it("does not accept or emit a model update after the detailed handler unmounts Toggle", async () => {
    const show = ref(true);
    const updates: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        show.value
          ? h(ToggleRoot, {
              onPressedChange: () => {
                show.value = false;
              },
              "onUpdate:pressed": (pressed: boolean) => updates.push(pressed),
            })
          : null,
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    host.querySelector<HTMLElement>("[data-sw-toggle]")!.click();
    await settleModel();
    expect(host.querySelector("[data-sw-toggle]")).toBeNull();
    expect(updates).toEqual([]);
  });

  it("keeps rapid accepted and canceled same-task events ordered and aligned", async () => {
    const events: string[] = [];
    let attempt = 0;
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(ToggleRoot, {
          onPressedChange: (_pressed: boolean, detail: TogglePressedChangeDetails) => {
            attempt += 1;
            events.push(`detail:${attempt}`);
            if (attempt === 2) detail.cancel();
          },
          "onUpdate:pressed": (pressed: boolean) => events.push(`update:${pressed}`),
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-toggle]")!;

    root.click();
    root.click();
    await settleModel();
    expect(events).toEqual(["detail:1", "detail:2", "update:true"]);
    expect(root.getAttribute("aria-pressed")).toBe("true");
    expect(root.getAttribute("data-state")).toBe("on");

    root.click();
    await settleModel();
    expect(events).toEqual(["detail:1", "detail:2", "update:true", "detail:3", "update:false"]);
    expect(root.getAttribute("aria-pressed")).toBe("false");
    expect(root.getAttribute("data-state")).toBe("off");
  });

  it("synchronizes only matching uncontrolled groups while preserving instance isolation", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(ToggleRoot, { syncGroup: "pins", value: "alpha" }, { default: () => "Alpha" }),
          h(ToggleRoot, { syncGroup: "pins", value: "beta" }, { default: () => "Beta" }),
          h(ToggleRoot, { syncGroup: "other", value: "gamma" }, { default: () => "Gamma" }),
          h(ToggleRoot, { value: "independent" }, { default: () => "Independent" }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const roots = [...host.querySelectorAll<HTMLElement>("[data-sw-toggle]")];

    roots[0]!.click();
    await settleModel();
    expect(roots.map((root) => root.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
      "false",
      "false",
    ]);

    roots[3]!.click();
    await settleModel();
    expect(roots.map((root) => root.getAttribute("aria-pressed"))).toEqual([
      "true",
      "true",
      "false",
      "true",
    ]);
  });

  it("destroys exact Runtime instances on unmount and remount", () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = appendHost();

    for (let cycle = 1; cycle <= 2; cycle += 1) {
      const app = createApp({
        render: () => h(ToggleRoot, { value: `toggle-${cycle}` }),
      });
      app.mount(host);
      expect(host.querySelectorAll("[data-sw-toggle]")).toHaveLength(1);
      app.unmount();
      expect(host.children).toHaveLength(0);
    }

    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("hydrates without warnings, duplicate initialization, or leaked cleanup", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const props = { defaultPressed: true, id: "hydrated-toggle", syncGroup: "hydrated" };
    const root = () => h(ToggleRoot, props, { default: () => "Hydrated" });
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    expect(host.querySelector("#hydrated-toggle")?.getAttribute("aria-pressed")).toBe("true");
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-toggle")).toHaveLength(1);
    expect(host.querySelectorAll("[data-sw-toggle]")).toHaveLength(1);
    expect(host.querySelector("#hydrated-toggle")?.getAttribute("aria-pressed")).toBe("true");

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(1);
  });

  it("preserves Styled default pressed state across hydration", async () => {
    const root = () =>
      h(
        StyledToggle,
        { defaultPressed: true, id: "hydrated-styled-toggle" },
        { default: () => "Hydrated Styled Toggle" },
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    expect(host.querySelector("#hydrated-styled-toggle")?.getAttribute("aria-pressed")).toBe(
      "true",
    );

    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-styled-toggle")).toHaveLength(1);
    expect(host.querySelector("#hydrated-styled-toggle")?.getAttribute("aria-pressed")).toBe(
      "true",
    );
  });
});

async function settleModel(): Promise<void> {
  await Promise.resolve();
  await nextTick();
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}
