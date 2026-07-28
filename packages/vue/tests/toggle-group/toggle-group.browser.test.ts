import { createApp, h, nextTick, reactive, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ToggleGroupValueChangeDetails } from "@starwind-ui/runtime/toggle-group";
import { ToggleGroupRoot } from "@starwind-ui/vue/toggle-group";
import { ToggleRoot } from "@starwind-ui/vue/toggle";
import {
  ToggleGroup as StyledToggleGroup,
  ToggleGroupItem as StyledToggleGroupItem,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/toggle-group";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Toggle Group public behavior", () => {
  it("normalizes single/multiple arrays and commits detail-first after acceptance", async () => {
    const events: string[] = [];
    const cancelNext = ref(false);
    const multiple = ref(false);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          {
            defaultValue: ["bold", "italic"],
            multiple: multiple.value,
            onValueChange: (_value: string[], detail: ToggleGroupValueChangeDetails) => {
              events.push("group-detail");
              if (cancelNext.value) detail.cancel();
            },
            "onUpdate:modelValue": () => events.push("group-update"),
          },
          {
            default: () => [
              h(ToggleRoot, {
                onPressedChange: () => events.push("child-detail"),
                "onUpdate:pressed": () => events.push("child-update"),
                value: "bold",
              }),
              h(ToggleRoot, { value: "italic" }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const toggles = host.querySelectorAll<HTMLElement>("[data-sw-toggle]");

    expect(group.getAttribute("data-value")).toBe('["bold"]');
    expect(toggles[0]?.getAttribute("aria-pressed")).toBe("true");
    toggles[1]?.click();
    await nextTick();
    expect(events).toEqual(["group-detail", "group-update"]);
    expect(group.getAttribute("data-value")).toBe('["italic"]');

    cancelNext.value = true;
    toggles[0]?.click();
    await nextTick();
    expect(events.slice(2)).toEqual(["child-detail", "group-detail"]);
    expect(group.getAttribute("data-value")).toBe('["italic"]');
    expect(toggles[0]?.getAttribute("aria-pressed")).toBe("false");

    cancelNext.value = false;
    multiple.value = true;
    await nextTick();
    toggles[0]?.click();
    await nextTick();
    expect(group.getAttribute("data-value")).toBe('["italic","bold"]');
  });

  it("keeps controlled values parent-owned across mode and controlledness transitions", async () => {
    const state = reactive({
      multiple: true,
      value: ["alpha"] as string[] | undefined,
    });
    const proposals: string[][] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          {
            modelValue: state.value,
            multiple: state.multiple,
            "onUpdate:modelValue": (value: string[]) => proposals.push(value),
          },
          {
            default: () => [h(ToggleRoot, { value: "alpha" }), h(ToggleRoot, { value: "beta" })],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    const toggles = host.querySelectorAll<HTMLElement>("[data-sw-toggle]");

    toggles[1]?.click();
    await nextTick();
    expect(proposals).toEqual([["alpha", "beta"]]);
    expect(group.getAttribute("data-value")).toBe('["alpha"]');

    state.value = ["alpha", "beta"];
    await nextTick();
    expect(toggles[1]?.getAttribute("aria-pressed")).toBe("true");

    state.multiple = false;
    await nextTick();
    expect(group.getAttribute("data-value")).toBe('["alpha"]');
    state.value = undefined;
    await nextTick();
    expect(group.getAttribute("data-value")).toBe('["alpha"]');
    toggles[1]?.click();
    await nextTick();
    expect(group.getAttribute("data-value")).toBe('["beta"]');
    state.value = ["alpha"];
    await nextTick();
    expect(group.getAttribute("data-value")).toBe('["alpha"]');
  });

  it("publishes detailed current and previous values before model updates", async () => {
    const publications: Array<{ current: string[]; previous: string[]; update?: string[] }> = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          {
            defaultValue: ["alpha"],
            onValueChange: (value: string[], detail: ToggleGroupValueChangeDetails) => {
              publications.push({
                current: [...value],
                previous: [...detail.previousValue],
              });
            },
            "onUpdate:modelValue": (value: string[]) => {
              publications.push({ current: [], previous: [], update: [...value] });
            },
          },
          {
            default: () => [
              h(ToggleRoot, { value: "alpha" }, { default: () => "Alpha" }),
              h(ToggleRoot, { value: "beta" }, { default: () => "Beta" }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const toggles = host.querySelectorAll<HTMLElement>("[data-sw-toggle]");

    toggles[1]?.click();
    await nextTick();
    expect(publications).toEqual([
      { current: ["beta"], previous: ["alpha"] },
      { current: [], previous: [], update: ["beta"] },
    ]);

    toggles[0]?.click();
    await nextTick();
    expect(publications.slice(2)).toEqual([
      { current: ["alpha"], previous: ["beta"] },
      { current: [], previous: [], update: ["alpha"] },
    ]);
  });

  it("owns roving focus, dynamic membership, merged disabled state, and group isolation", async () => {
    const state = reactive({
      disabled: false,
      entries: ["one", "two"] as string[],
      itemDisabled: false,
      orientation: "horizontal" as "horizontal" | "vertical",
    });
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(
            ToggleGroupRoot,
            {
              defaultValue: ["one"],
              disabled: state.disabled,
              id: "first-toggle-group",
              orientation: state.orientation,
            },
            {
              default: () =>
                state.entries.map((value) =>
                  h(ToggleRoot, {
                    disabled: value === "two" && state.itemDisabled,
                    key: value,
                    value,
                  }),
                ),
            },
          ),
          h(
            ToggleGroupRoot,
            { defaultValue: ["other"], id: "second-toggle-group" },
            {
              default: () => [
                h(ToggleRoot, { value: "other" }),
                h(ToggleRoot, { value: "separate" }),
              ],
            },
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const first = host.querySelector<HTMLElement>("#first-toggle-group")!;
    const second = host.querySelector<HTMLElement>("#second-toggle-group")!;

    let firstToggles = first.querySelectorAll<HTMLElement>("[data-sw-toggle]");
    firstToggles[0]?.focus();
    press(firstToggles[0]!, "ArrowRight");
    await nextTick();
    expect(document.activeElement).toBe(firstToggles[1]);

    state.itemDisabled = true;
    state.orientation = "vertical";
    await nextTick();
    firstToggles[0]?.focus();
    press(firstToggles[0]!, "ArrowDown");
    await nextTick();
    expect(document.activeElement).toBe(firstToggles[0]);

    state.entries = ["one", "three", "two"];
    state.itemDisabled = false;
    await nextTick();
    await mutationTurn();
    firstToggles = first.querySelectorAll<HTMLElement>("[data-sw-toggle]");
    expect(firstToggles).toHaveLength(3);
    press(firstToggles[0]!, "ArrowDown");
    await nextTick();
    expect(document.activeElement).toBe(firstToggles[1]);

    state.disabled = true;
    await nextTick();
    expect(Array.from(firstToggles).every((toggle) => toggle.hasAttribute("data-disabled"))).toBe(
      true,
    );
    second.querySelectorAll<HTMLElement>("[data-sw-toggle]")[1]?.click();
    await nextTick();
    expect(second.getAttribute("data-value")).toBe('["separate"]');
    expect(first.getAttribute("data-value")).toBe('["one"]');

    state.entries = ["three", "two"];
    state.disabled = false;
    await nextTick();
    await mutationTurn();
    expect(first.getAttribute("data-value")).toBe("[]");
  });

  it("preserves keyed item identity through actual reorder and honors loopFocus boundaries", async () => {
    const state = reactive({
      entries: ["one", "two", "three"],
      loopFocus: false,
    });
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          { loopFocus: state.loopFocus },
          {
            default: () =>
              state.entries.map((value) =>
                h(ToggleRoot, { "data-key": value, key: value, value }, { default: () => value }),
              ),
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const group = host.querySelector<HTMLElement>("[data-sw-toggle-group]")!;
    let toggles = group.querySelectorAll<HTMLElement>("[data-sw-toggle]");

    toggles[0]?.focus();
    press(toggles[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(toggles[0]);
    toggles[2]?.focus();
    press(toggles[2]!, "ArrowRight");
    expect(document.activeElement).toBe(toggles[2]);

    state.loopFocus = true;
    await nextTick();
    press(toggles[2]!, "ArrowRight");
    expect(document.activeElement).toBe(toggles[0]);
    press(toggles[0]!, "ArrowLeft");
    expect(document.activeElement).toBe(toggles[2]);

    const twoBefore = toggles[1]!;
    twoBefore.focus();
    state.entries = ["three", "one", "two"];
    await nextTick();
    await mutationTurn();
    toggles = group.querySelectorAll<HTMLElement>("[data-sw-toggle]");
    expect(Array.from(toggles, (toggle) => toggle.dataset.key)).toEqual(["three", "one", "two"]);
    expect(toggles[2]).toBe(twoBefore);
    expect(document.activeElement).toBe(twoBefore);
  });

  it("forwards attrs and native listeners, renders slots, and exposes semantic elements", async () => {
    const groupRef = ref<{ element?: HTMLElement | null } | null>(null);
    const itemRef = ref<{ element?: HTMLElement | null } | null>(null);
    const groupClicks = vi.fn();
    const itemClicks = vi.fn();
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          {
            "aria-label": "Formatting",
            "data-consumer": "group",
            id: "public-toggle-group",
            onClick: groupClicks,
            ref: groupRef,
            style: { borderTopWidth: "3px" },
            title: "Formatting tools",
          },
          {
            default: () =>
              h(
                ToggleRoot,
                {
                  "data-consumer": "item",
                  ref: itemRef,
                  value: "bold",
                },
                { default: () => "Bold slot" },
              ),
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    await nextTick();
    const group = host.querySelector<HTMLElement>("#public-toggle-group")!;
    const item = group.querySelector<HTMLElement>("[data-sw-toggle]")!;

    expect(group.getAttribute("aria-label")).toBe("Formatting");
    expect(group.dataset.consumer).toBe("group");
    expect(group.title).toBe("Formatting tools");
    expect(group.style.borderTopWidth).toBe("3px");
    expect(group.textContent).toContain("Bold slot");
    expect(item.dataset.consumer).toBe("item");
    expect(groupRef.value?.element).toBe(group);
    expect(itemRef.value?.element).toBe(item);

    item.click();
    await nextTick();
    expect(groupClicks).toHaveBeenCalledTimes(1);

    const itemListenerHost = appendHost();
    const itemListenerApp = createApp({
      render: () =>
        h(
          ToggleGroupRoot,
          {},
          {
            default: () =>
              h(ToggleRoot, {
                onClick: itemClicks,
                value: "italic",
              }),
          },
        ),
    });
    itemListenerApp.mount(itemListenerHost);
    cleanups.push(() => itemListenerApp.unmount());
    const listenerItem = itemListenerHost.querySelector<HTMLElement>("[data-sw-toggle]")!;

    listenerItem.click();
    await nextTick();
    expect(itemClicks).toHaveBeenCalledTimes(1);
  });

  it("binds Styled spacing to executable gap geometry while preserving consumer style", async () => {
    const spacing = ref(6);
    const groupRef = ref<{ element?: HTMLDivElement | null } | null>(null);
    const itemRef = ref<{ element?: HTMLElement | null } | null>(null);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          StyledToggleGroup,
          {
            "data-testid": "styled-toggle-group",
            ref: groupRef,
            spacing: spacing.value,
            style: {
              backgroundColor: "rgb(1, 2, 3)",
              display: "flex",
              gap: "calc(var(--gap) * 1px)",
            },
          },
          {
            default: () => [
              h(
                StyledToggleGroupItem,
                { ref: itemRef, style: { width: "40px" }, value: "one" },
                { default: () => "One" },
              ),
              h(
                StyledToggleGroupItem,
                { style: { width: "40px" }, value: "two" },
                { default: () => "Two" },
              ),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    await nextTick();
    const group = host.querySelector<HTMLElement>('[data-testid="styled-toggle-group"]')!;
    const items = group.querySelectorAll<HTMLElement>("[data-slot='toggle-group-item']");

    expect(groupRef.value?.element).toBe(group);
    expect(itemRef.value?.element).toBe(items[0]);
    expect(group.style.getPropertyValue("--gap")).toBe("6");
    expect(getComputedStyle(group).gap).toBe("6px");
    expect(getComputedStyle(group).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(items[1]!.getBoundingClientRect().left - items[0]!.getBoundingClientRect().right).toBe(
      6,
    );

    spacing.value = 14;
    await nextTick();
    expect(group.style.getPropertyValue("--gap")).toBe("14");
    expect(getComputedStyle(group).gap).toBe("14px");
    expect(items[1]!.getBoundingClientRect().left - items[0]!.getBoundingClientRect().right).toBe(
      14,
    );
    expect(getComputedStyle(group).backgroundColor).toBe("rgb(1, 2, 3)");
  });

  it("destroys each owned Runtime controller and preserves standalone Toggle behavior", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(
            ToggleGroupRoot,
            { defaultValue: ["grouped"] },
            {
              default: () => [
                h(ToggleRoot, { value: "grouped" }),
                h(ToggleRoot, { value: "second" }),
              ],
            },
          ),
          h(ToggleRoot, { defaultPressed: true, id: "standalone" }),
        ]),
    });
    app.mount(host);
    const standalone = host.querySelector<HTMLElement>("#standalone")!;
    expect(standalone.getAttribute("aria-pressed")).toBe("true");
    standalone.click();
    await nextTick();
    expect(standalone.getAttribute("aria-pressed")).toBe("false");

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(4);
    expect(host.children).toHaveLength(0);
  });
});

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function mutationTurn(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await nextTick();
}

function press(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
}
