import {
  Comment,
  Fragment,
  Text,
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
  type VNode,
} from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DialogOpenChangeDetails } from "@starwind-ui/runtime/dialog";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";
import {
  Dialog as StyledDialog,
  DialogClose as StyledDialogClose,
  DialogContent as StyledDialogContent,
  DialogTitle as StyledDialogTitle,
  DialogTrigger as StyledDialogTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/dialog";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  document.body.removeAttribute("data-sw-scroll-locked");
  vi.restoreAllMocks();
});

describe("Vue Dialog public behavior", () => {
  it("opens uncontrolled with focus and lock ownership, then dismisses and returns focus", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    const events: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        dialogTree({
          root: {
            onCloseComplete: () => events.push("complete"),
            onOpenChange: (open: boolean) => events.push(`detail:${open}`),
            "onUpdate:open": (open: boolean) => events.push(`update:${open}`),
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    trigger(host).click();
    await nextTick();
    expect(events.slice(0, 2)).toEqual(["detail:true", "update:true"]);
    expect(popup(host).open).toBe(true);
    expect(document.activeElement).toBe(host.querySelector("[data-dialog-input]"));
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    expect(popup(host).open).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(events).toContain("complete");
  });

  it("keeps controlled and synchronously canceled proposals parent-owned", async () => {
    const state = reactive({ cancel: true, open: false });
    const updates: boolean[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        dialogTree({
          root: {
            open: state.open,
            onOpenChange: (_open: boolean, detail: DialogOpenChangeDetails) => {
              if (state.cancel) detail.cancel();
            },
            "onUpdate:open": (open: boolean) => updates.push(open),
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    trigger(host).click();
    await nextTick();
    expect(updates).toEqual([]);
    expect(popup(host).open).toBe(false);

    state.cancel = false;
    trigger(host).click();
    await nextTick();
    expect(updates).toEqual([true]);
    expect(popup(host).open).toBe(false);

    state.open = true;
    await nextTick();
    expect(popup(host).open).toBe(true);
  });

  it("honors non-modal and outside-dismiss options without adapter-owned policy", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        dialogTree({
          root: { closeOnOutsideInteract: false, modal: false },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    trigger(host).click();
    await nextTick();
    expect(popup(host).getAttribute("aria-modal")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    backdrop(host).click();
    expect(popup(host).open).toBe(true);
    close(host).click();
    await nextTick();
    expect(popup(host).open).toBe(false);
  });

  it("preserves nested topmost ownership and restores locks across remounts", async () => {
    const show = ref(true);
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          show.value
            ? dialogTree({
                ids: { root: "parent", trigger: "parent-trigger" },
                popupChildren: [
                  dialogTree({
                    ids: { root: "child", trigger: "child-trigger" },
                  }),
                ],
              })
            : null,
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    host.querySelector<HTMLButtonElement>("#parent-trigger")!.click();
    host.querySelector<HTMLButtonElement>("#child-trigger")!.click();
    await nextTick();
    const parent = host.querySelector<HTMLElement>("#parent")!;
    const child = host.querySelector<HTMLElement>("#child")!;
    expect(parent.querySelector<HTMLDialogElement>(":scope > dialog")!.open).toBe(true);
    expect(child.querySelector<HTMLDialogElement>(":scope > dialog")!.open).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    expect(parent.querySelector<HTMLDialogElement>(":scope > dialog")!.open).toBe(true);
    expect(child.querySelector<HTMLDialogElement>(":scope > dialog")!.open).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    show.value = false;
    await nextTick();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    show.value = true;
    await nextTick();
    expect(host.querySelectorAll("[data-sw-dialog]")).toHaveLength(2);
  });

  it.each([
    { controlled: false, label: "uncontrolled" },
    { controlled: true, label: "controlled" },
  ])(
    "recreates constructor-only options while open without losing $label ownership",
    async ({ controlled }) => {
      const state = reactive({
        closeOnEscape: false,
        closeOnOutsideInteract: false,
        modal: true,
        open: true,
      });
      const proposals: boolean[] = [];
      const completions: string[] = [];
      const host = appendHost();
      const app = createApp({
        render: () =>
          dialogTree({
            root: {
              closeOnEscape: state.closeOnEscape,
              closeOnOutsideInteract: state.closeOnOutsideInteract,
              defaultOpen: controlled ? undefined : true,
              modal: state.modal,
              onCloseComplete: () => completions.push("complete"),
              onOpenChange: (open: boolean) => proposals.push(open),
              open: controlled ? state.open : undefined,
              "onUpdate:open": controlled
                ? (open: boolean) => {
                    state.open = open;
                  }
                : undefined,
            },
          }),
      });
      app.mount(host);
      cleanups.push(() => app.unmount());
      await nextTick();

      expect(popup(host).open).toBe(true);
      expect(document.activeElement).toBe(host.querySelector("[data-dialog-input]"));
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

      state.modal = false;
      state.closeOnOutsideInteract = true;
      await nextTick();
      await nextTick();
      expect(popup(host).open).toBe(true);
      expect(popup(host).getAttribute("aria-modal")).toBe("false");
      expect(document.activeElement).toBe(host.querySelector("[data-dialog-input]"));
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
      expect(proposals).toEqual([]);
      expect(completions).toEqual([]);

      state.modal = true;
      state.closeOnEscape = true;
      await nextTick();
      await nextTick();
      expect(popup(host).open).toBe(true);
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
      expect(proposals).toEqual([]);
      expect(completions).toEqual([]);

      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
      await nextTick();
      expect(proposals).toEqual([false]);
      expect(popup(host).open).toBe(false);
      expect(completions).toEqual(["complete"]);

      app.unmount();
      cleanups.pop();
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
      expect(host.children).toHaveLength(0);
    },
  );

  it("composes Styled Trigger and Close asChild onto native buttons with merged refs and behavior", async () => {
    type ExposedElement = ComponentPublicInstance & { element: HTMLElement | null };
    const showParts = ref(true);
    const triggerComponent = ref<ExposedElement | null>(null);
    const closeComponent = ref<ExposedElement | null>(null);
    let triggerChild: Element | null = null;
    let closeChild: Element | null = null;
    const calls: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(StyledDialog, null, {
          default: () =>
            showParts.value
              ? [
                  h(
                    StyledDialogTrigger,
                    {
                      "aria-label": "Open composed dialog",
                      asChild: true,
                      class: "trigger-adapter",
                      "data-consumer": "trigger",
                      onClick: () => calls.push("trigger-consumer"),
                      ref: triggerComponent,
                      style: { color: "red" },
                    },
                    {
                      default: () =>
                        h(
                          "button",
                          {
                            class: "trigger-child",
                            onClick: () => calls.push("trigger-child"),
                            ref: (value: Element | null) => {
                              triggerChild = value;
                            },
                            style: { backgroundColor: "blue" },
                          },
                          "Open",
                        ),
                    },
                  ),
                  h(StyledDialogContent, null, {
                    default: () => [
                      h(StyledDialogTitle, null, { default: () => "Composed Dialog" }),
                      h(
                        StyledDialogClose,
                        {
                          "aria-label": "Close composed dialog",
                          asChild: true,
                          class: "close-adapter",
                          "data-consumer": "close",
                          onClick: () => calls.push("close-consumer"),
                          ref: closeComponent,
                        },
                        {
                          default: () =>
                            h(
                              "button",
                              {
                                class: "close-child",
                                onClick: () => calls.push("close-child"),
                                ref: (value: Element | null) => {
                                  closeChild = value;
                                },
                              },
                              "Close",
                            ),
                        },
                      ),
                    ],
                  }),
                ]
              : [],
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    const triggerElement = host.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!;
    const triggerExposed = triggerComponent.value!;
    expect(host.querySelectorAll("[data-sw-dialog-trigger]")).toHaveLength(1);
    expect(triggerElement.classList.contains("trigger-child")).toBe(true);
    expect(triggerElement.classList.contains("trigger-adapter")).toBe(true);
    expect(triggerElement.style.color).toBe("red");
    expect(triggerElement.style.backgroundColor).toBe("blue");
    expect(triggerElement.getAttribute("aria-label")).toBe("Open composed dialog");
    expect(triggerElement.dataset.consumer).toBe("trigger");
    expect(triggerElement.type).toBe("button");
    expect(triggerElement).toBe(triggerChild);
    expect(triggerElement).toBe(triggerExposed.element);

    triggerElement.click();
    await nextTick();
    expect(calls).toEqual(["trigger-child", "trigger-consumer"]);
    expect(host.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!.open).toBe(true);

    const closeElement = host.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
    const closeExposed = closeComponent.value!;
    expect(host.querySelectorAll("[data-sw-dialog-close]")).toHaveLength(2);
    expect(closeElement.classList.contains("close-child")).toBe(true);
    expect(closeElement.classList.contains("close-adapter")).toBe(true);
    expect(closeElement.getAttribute("aria-label")).toBe("Close composed dialog");
    expect(closeElement.dataset.consumer).toBe("close");
    expect(closeElement).toBe(closeChild);
    expect(closeElement).toBe(closeExposed.element);

    closeElement.click();
    await nextTick();
    expect(calls).toEqual(["trigger-child", "trigger-consumer", "close-child", "close-consumer"]);
    expect(host.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!.open).toBe(false);

    showParts.value = false;
    await nextTick();
    expect(triggerChild).toBeNull();
    expect(closeChild).toBeNull();
    expect(triggerExposed.element).toBeNull();
    expect(closeExposed.element).toBeNull();
  });

  it.each(["Trigger", "Close"] as const)(
    "rejects invalid Styled Dialog%s asChild slot shapes",
    async (part) => {
      const InvalidComponent = defineComponent({ render: () => h("button", "component") });
      const invalidSlots: Array<{ label: string; slot: () => VNode[] }> = [
        { label: "zero", slot: () => [] },
        { label: "multiple", slot: () => [h("button"), h("button")] },
        { label: "Text", slot: () => [h(Text, null, "text")] },
        { label: "Comment", slot: () => [h(Comment)] },
        { label: "Fragment", slot: () => [h(Fragment, null, [h("button")])] },
        { label: "component", slot: () => [h(InvalidComponent)] },
      ];

      for (const { label, slot } of invalidSlots) {
        const host = appendHost();
        const app = createApp({
          render: () =>
            h(
              part === "Trigger" ? StyledDialogTrigger : StyledDialogClose,
              { asChild: true },
              {
                default: slot,
              },
            ),
        });
        app.config.errorHandler = (error) => {
          throw error;
        };
        app.config.warnHandler = () => {};
        expect(() => app.mount(host), `${part} should reject ${label}`).toThrowError(
          `Dialog${part} asChild requires exactly one native element VNode.`,
        );
        host.remove();
      }
    },
  );
});

function dialogTree({
  ids = {},
  popupChildren = [],
  root = {},
}: {
  ids?: { root?: string; trigger?: string };
  popupChildren?: unknown[];
  root?: Record<string, unknown>;
} = {}) {
  return h(
    DialogRoot,
    { id: ids.root, ...root },
    {
      default: () => [
        h(DialogTrigger, { id: ids.trigger }, { default: () => "Open" }),
        h(DialogBackdrop),
        h(DialogPopup, null, {
          default: () => [
            h(DialogTitle, null, { default: () => "Title" }),
            h(DialogDescription, null, { default: () => "Description" }),
            h("input", { "data-dialog-input": "" }),
            ...popupChildren,
            h(DialogClose, null, { default: () => "Close" }),
          ],
        }),
      ],
    },
  );
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function trigger(host: Element): HTMLButtonElement {
  return host.querySelector<HTMLButtonElement>("[data-sw-dialog-trigger]")!;
}

function popup(host: Element): HTMLDialogElement {
  return host.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")!;
}

function backdrop(host: Element): HTMLElement {
  return host.querySelector<HTMLElement>("[data-sw-dialog-overlay]")!;
}

function close(host: Element): HTMLButtonElement {
  return host.querySelector<HTMLButtonElement>("[data-sw-dialog-close]")!;
}
