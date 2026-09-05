import {
  createApp,
  createSSRApp,
  createCommentVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";

import type { CollapsibleOpenChangeDetails } from "@starwind-ui/runtime/collapsible";
import {
  CollapsiblePanel,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "@starwind-ui/vue/collapsible";
import {
  Collapsible as StyledCollapsible,
  CollapsibleContent as StyledCollapsibleContent,
  CollapsibleTrigger as StyledCollapsibleTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/collapsible";

type ElementExpose = ComponentPublicInstance & { element: HTMLElement | null };

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Collapsible public behavior", () => {
  it("opens uncontrolled, preserves presence, and emits detail before the model update", async () => {
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CollapsibleRoot,
          {
            onOpenChange: (open: boolean) => events.push(`detail:${open}`),
            "onUpdate:open": (open: boolean) => events.push(`update:${open}`),
          },
          {
            default: () => [
              h(CollapsibleTrigger, null, { default: () => "Details" }),
              h(CollapsiblePanel, null, { default: () => "Content" }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-collapsible]")!;
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!;
    const panel = host.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!;

    expect(root.getAttribute("data-state")).toBe("closed");
    expect(panel.hidden).toBe(true);
    trigger.click();
    expect(events).toEqual(["detail:true", "update:true"]);
    await settleModel();
    expect(root.getAttribute("data-state")).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
    expect(panel.hidden).toBe(false);

    trigger.click();
    await settleModel();
    expect(panel.isConnected).toBe(true);
    expect(panel.hidden).toBe(true);
    expect(panel.getAttribute("data-state")).toBe("closed");
  });

  it("keeps controlled and canceled proposals parent-owned", async () => {
    const props = reactive({ cancel: true, open: false });
    const updates: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CollapsibleRoot,
          {
            open: props.open,
            onOpenChange: (_open: boolean, detail: CollapsibleOpenChangeDetails) => {
              if (props.cancel) detail.cancel();
            },
            "onUpdate:open": (open: boolean) => updates.push(open),
          },
          {
            default: () => [
              h(CollapsibleTrigger, null, { default: () => "Details" }),
              h(CollapsiblePanel),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-collapsible]")!;
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!;

    trigger.click();
    await settleModel();
    expect(updates).toEqual([]);
    expect(root.getAttribute("data-state")).toBe("closed");

    props.cancel = false;
    trigger.click();
    await settleModel();
    expect(updates).toEqual([true]);
    expect(root.getAttribute("data-state")).toBe("closed");

    props.open = true;
    await nextTick();
    expect(root.getAttribute("data-state")).toBe("open");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("does not let asynchronous listener work retroactively cancel an accepted change", async () => {
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CollapsibleRoot,
          {
            onOpenChange: (_open: boolean, detail: CollapsibleOpenChangeDetails) => {
              events.push("detail");
              void Promise.resolve().then(() => {
                detail.cancel();
                events.push("async-cancel");
              });
            },
            "onUpdate:open": () => events.push("update"),
          },
          {
            default: () => [h(CollapsibleTrigger), h(CollapsiblePanel)],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-collapsible]")!;

    host.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!.click();
    expect(events).toEqual(["detail", "update"]);
    expect(root.getAttribute("data-state")).toBe("open");

    await settleModel();
    expect(events).toEqual(["detail", "update", "async-cancel"]);
    expect(root.getAttribute("data-state")).toBe("open");
  });

  it("accepts exactly once when a detailed listener schedules Runtime recreation", async () => {
    const props = reactive({ disabled: false });
    const updates: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          CollapsibleRoot,
          {
            disabled: props.disabled,
            onOpenChange: () => {
              props.disabled = true;
            },
            "onUpdate:open": (open: boolean) => updates.push(open),
          },
          {
            default: () => [h(CollapsibleTrigger), h(CollapsiblePanel)],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const root = host.querySelector<HTMLElement>("[data-sw-collapsible]")!;
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!;

    trigger.click();
    expect(updates).toEqual([true]);
    await nextTick();

    expect(updates).toEqual([true]);
    expect(root.getAttribute("data-state")).toBe("open");
    expect(root.hasAttribute("data-disabled")).toBe(true);
    expect(trigger.disabled).toBe(true);
  });

  it("strictly composes one native trigger with merged attrs, listeners, styles, classes, and refs", async () => {
    const wrapperClicks = vi.fn();
    const childClicks = vi.fn();
    const wrapperRef = ref<ElementExpose | null>(null);
    const childRef = ref<HTMLButtonElement | null>(null);
    const host = appendHost();
    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(CollapsibleRoot, null, {
              default: () => [
                h(
                  CollapsibleTrigger,
                  {
                    asChild: true,
                    class: "wrapper-class",
                    onClick: wrapperClicks,
                    ref: wrapperRef,
                    style: { color: "rgb(255, 0, 0)" },
                  },
                  {
                    default: () =>
                      h(
                        "button",
                        {
                          class: "child-class",
                          onClick: childClicks,
                          ref: childRef,
                          style: { backgroundColor: "rgb(0, 0, 255)" },
                        },
                        "Details",
                      ),
                  },
                ),
                h(CollapsiblePanel),
              ],
            });
        },
      }),
    );
    app.mount(host);
    cleanups.push(() => app.unmount());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!;

    expect(host.querySelectorAll("button")).toHaveLength(1);
    expect(trigger.type).toBe("button");
    expect(trigger.classList.contains("wrapper-class")).toBe(true);
    expect(trigger.classList.contains("child-class")).toBe(true);
    expect(trigger.style.color).toBe("rgb(255, 0, 0)");
    expect(trigger.style.backgroundColor).toBe("rgb(0, 0, 255)");
    expect(wrapperRef.value?.element).toBe(trigger);
    expect(childRef.value).toBe(trigger);
    const exposed = wrapperRef.value;
    trigger.click();
    expect(wrapperClicks).toHaveBeenCalledTimes(1);
    expect(childClicks).toHaveBeenCalledTimes(1);

    app.unmount();
    cleanups.pop();
    expect(childRef.value).toBeNull();
    expect(wrapperRef.value).toBeNull();
    expect(exposed?.element).toBeNull();
  });

  it("keeps one native multi-child button as the pointer and keyboard control", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(CollapsibleRoot, null, {
          default: () => [
            h(
              CollapsibleTrigger,
              { asChild: true, class: "composed-trigger" },
              {
                default: () =>
                  h("button", { "data-testid": "multi-child-trigger" }, [
                    h("span", null, "Models"),
                    h("svg", { "aria-hidden": "true", viewBox: "0 0 16 16" }, [
                      h("path", { d: "M2 8h12" }),
                    ]),
                  ]),
              },
            ),
            h(CollapsiblePanel, null, { default: () => "Genesis" }),
          ],
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settleModel();

    const trigger = host.querySelector<HTMLButtonElement>("[data-testid=multi-child-trigger]")!;
    const panel = host.querySelector<HTMLElement>("[data-sw-collapsible-panel]")!;
    expect(trigger.hasAttribute("data-sw-collapsible-trigger")).toBe(true);
    expect(trigger.hasAttribute("data-as-child")).toBe(false);
    expect(trigger.style.display).not.toBe("contents");
    expect(trigger.querySelector("[data-sw-collapsible-trigger]")).toBeNull();

    trigger.click();
    await settleModel();
    expect(panel.hidden).toBe(false);

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await settleModel();
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it.each([
    ["zero children", () => []],
    ["multiple children", () => [h("button"), h("button")]],
    ["text", () => "text"],
    ["comment", () => createCommentVNode("comment")],
    ["multiple-child fragment", () => h(Fragment, null, [h("button"), h("span")])],
    [
      "multiple-root component",
      () =>
        h(
          defineComponent({
            render: () => [h("button"), h("span")],
          }),
        ),
    ],
    ["rootless component", () => h(defineComponent({ render: () => null }))],
  ])("rejects invalid asChild %s with an actionable error", (_name, invalidChild) => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(CollapsibleRoot, null, {
          default: () => [
            h(CollapsibleTrigger, { asChild: true }, { default: invalidChild }),
            h(CollapsiblePanel),
          ],
        }),
    });
    app.config.warnHandler = () => {};
    expect(() => app.mount(host)).toThrow(
      /CollapsibleTrigger asChild .*(child|native|Fragment|root)/,
    );
  });

  it("isolates multiple instances and destroys exact owners across remounts", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const show = ref(true);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          show.value
            ? h(
                CollapsibleRoot,
                { id: "first" },
                {
                  default: () => [h(CollapsibleTrigger), h(CollapsiblePanel)],
                },
              )
            : null,
          h(
            CollapsibleRoot,
            { id: "second" },
            {
              default: () => [h(CollapsibleTrigger), h(CollapsiblePanel)],
            },
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const roots = [...host.querySelectorAll<HTMLElement>("[data-sw-collapsible]")];
    roots[0]!.querySelector<HTMLButtonElement>("[data-sw-collapsible-trigger]")!.click();
    await settleModel();
    expect(roots.map((root) => root.getAttribute("data-state"))).toEqual(["open", "closed"]);

    show.value = false;
    await nextTick();
    expect(abort).toHaveBeenCalledTimes(2);
    show.value = true;
    await nextTick();
    expect(host.querySelectorAll("[data-sw-collapsible]")).toHaveLength(2);

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(6);
  });

  it("hydrates once and preserves Styled model behavior", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const open = ref(false);
    const root = () =>
      h(
        StyledCollapsible,
        {
          "onUpdate:open": (value: boolean) => {
            open.value = value;
          },
          open: open.value,
        },
        {
          default: () => [
            h(
              StyledCollapsibleTrigger,
              { "data-testid": "styled-trigger" },
              { default: () => "Styled details" },
            ),
            h(
              StyledCollapsibleContent,
              { "data-testid": "styled-content" },
              { default: () => "Styled content" },
            ),
          ],
        },
      );
    const html = await renderToString(createSSRApp({ render: root }));
    const host = appendHost();
    host.innerHTML = html;
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("[data-slot=collapsible]")).toHaveLength(1);
    host.querySelector<HTMLButtonElement>("[data-testid=styled-trigger]")!.click();
    await settleModel();
    expect(open.value).toBe(true);
    expect(host.querySelector<HTMLElement>("[data-testid=styled-content]")!.hidden).toBe(false);

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(3);
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
