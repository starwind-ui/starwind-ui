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
import { afterEach, describe, expect, it } from "vitest";

import {
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogViewport,
} from "@starwind-ui/vue/alert-dialog";
import {
  AlertDialog as StyledAlertDialog,
  AlertDialogAction as StyledAlertDialogAction,
  AlertDialogCancel as StyledAlertDialogCancel,
  AlertDialogContent as StyledAlertDialogContent,
  AlertDialogTitle as StyledAlertDialogTitle,
  AlertDialogTrigger as StyledAlertDialogTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/alert-dialog";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  document.body.removeAttribute("data-sw-scroll-locked");
});

describe("Vue Alert Dialog public behavior", () => {
  it("keeps default, controlled, and synchronously canceled proposals parent-owned", async () => {
    const state = reactive({ cancel: true, open: false });
    const events: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        tree(false, undefined, undefined, {
          open: state.open,
          onOpenChange: (open: boolean, detail: { cancel(): void }) => {
            events.push(`detail:${open}`);
            if (state.cancel) detail.cancel();
          },
          "onUpdate:open": (open: boolean) => {
            events.push(`update:${open}`);
            state.open = open;
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click();
    expect(events).toEqual(["detail:true"]);
    await nextTick();
    expect(state.open).toBe(false);
    expect(
      document.body.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!.open,
    ).toBe(false);

    state.cancel = false;
    host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click();
    expect(events).toEqual(["detail:true", "detail:true", "update:true"]);
    await nextTick();
    expect(state.open).toBe(true);
    expect(
      document.body.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!.open,
    ).toBe(true);

    app.unmount();
    cleanups.pop();
    const defaultHost = document.createElement("div");
    document.body.append(defaultHost);
    const completions: string[] = [];
    const defaultApp = createApp({
      render: () =>
        tree(false, undefined, undefined, {
          defaultOpen: true,
          onCloseComplete: () => completions.push("complete"),
        }),
    });
    defaultApp.mount(defaultHost);
    cleanups.push(() => defaultApp.unmount());
    await nextTick();
    const popup = document.body.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!;
    expect(popup.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    await waitForDialogClosed(popup);
    expect(popup.open).toBe(false);
    expect(popup.getAttribute("data-state")).toBe("closed");
    expect(popup.hidden).toBe(true);
    expect(completions).toEqual(["complete"]);
  });

  it("teleports per owner, locks outside dismissal, and restores focus and locks", async () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({ render: () => tree() });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(host.querySelector("[data-sw-alert-dialog-portal]")).toBeNull();
    const portal = document.body.querySelector<HTMLElement>("[data-sw-alert-dialog-portal]")!;
    portal.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]");
    host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click();
    await nextTick();
    const popup = portal.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!;
    expect(portal.dataset.placement).toBe("ready");
    expect(portal.hasAttribute("data-floating-root")).toBe(true);
    expect(portal.contains(popup)).toBe(true);
    expect(popup.open).toBe(true);
    expect(popup.getAttribute("role")).toBe("alertdialog");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    portal.querySelector<HTMLElement>("[data-sw-alert-dialog-backdrop]")!.click();
    expect(popup.open).toBe(true);
    portal.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-close]")!.click();
    await nextTick();
    await waitForDialogClosed(popup);
    expect(popup.open).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("keeps disabled portals inline and removes owner state across remounts", async () => {
    const show = ref(true);
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({ render: () => (show.value ? tree(true) : null) });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    expect(host.querySelectorAll("[data-sw-alert-dialog-portal]")).toHaveLength(1);
    expect(
      host.querySelector<HTMLElement>("[data-sw-alert-dialog-portal]")!.dataset.placement,
    ).toBe("ready");
    show.value = false;
    await nextTick();
    expect(document.querySelectorAll("[data-sw-alert-dialog-portal]")).toHaveLength(0);
    show.value = true;
    await nextTick();
    expect(host.querySelectorAll("[data-sw-alert-dialog-portal]")).toHaveLength(1);
  });

  it("keeps multiple custom-container owners isolated during cleanup", async () => {
    const showFirst = ref(true);
    const firstTarget = document.createElement("section");
    const secondTarget = document.createElement("section");
    document.body.append(firstTarget, secondTarget);
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h("div", null, [
          showFirst.value ? tree(false, firstTarget, "first") : null,
          tree(false, secondTarget, "second"),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(firstTarget.querySelector('[data-owner="first"]')).not.toBeNull();
    expect(secondTarget.querySelector('[data-owner="second"]')).not.toBeNull();
    showFirst.value = false;
    await nextTick();
    expect(firstTarget.querySelector("[data-sw-alert-dialog-portal]")).toBeNull();
    expect(secondTarget.querySelector('[data-owner="second"]')).not.toBeNull();
    host.querySelectorAll<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")[0]!.click();
    await nextTick();
    expect(secondTarget.querySelector<HTMLDialogElement>("dialog")!.open).toBe(true);
  });

  it("closes only the nested topmost owner on Escape", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(
          AlertDialogRoot,
          { id: "parent" },
          {
            default: () => [
              h(AlertDialogTrigger, { id: "parent-trigger" }, { default: () => "Parent" }),
              h(AlertDialogPortal, null, {
                default: () =>
                  h(AlertDialogViewport, null, {
                    default: () => [
                      h(AlertDialogBackdrop),
                      h(
                        AlertDialogPopup,
                        { id: "parent-popup" },
                        {
                          default: () => [
                            h(AlertDialogTitle, null, { default: () => "Parent" }),
                            h(
                              AlertDialogRoot,
                              { id: "child" },
                              {
                                default: () => [
                                  h(
                                    AlertDialogTrigger,
                                    { id: "child-trigger" },
                                    { default: () => "Child" },
                                  ),
                                  h(AlertDialogPortal, null, {
                                    default: () =>
                                      h(AlertDialogViewport, null, {
                                        default: () => [
                                          h(AlertDialogBackdrop),
                                          h(
                                            AlertDialogPopup,
                                            { id: "child-popup" },
                                            {
                                              default: () =>
                                                h(AlertDialogTitle, null, {
                                                  default: () => "Child",
                                                }),
                                            },
                                          ),
                                        ],
                                      }),
                                  }),
                                ],
                              },
                            ),
                          ],
                        },
                      ),
                    ],
                  }),
              }),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    host.querySelector<HTMLButtonElement>("#parent-trigger")!.click();
    await nextTick();
    document.body.querySelector<HTMLButtonElement>("#child-trigger")!.click();
    await nextTick();
    const parent = document.body.querySelector<HTMLDialogElement>("#parent-popup")!;
    const child = document.body.querySelector<HTMLDialogElement>("#child-popup")!;
    await waitForPortalReady(child.closest<HTMLElement>("[data-sw-alert-dialog-portal]")!);
    expect(parent.open).toBe(true);
    expect(child.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    expect(parent.open).toBe(true);
    await waitForDialogClosed(child);
    expect(child.open).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await nextTick();
    await waitForDialogClosed(parent);
    expect(parent.open).toBe(false);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
  });

  it("recreates constructor options while open and tears down without proposals or completion", async () => {
    const state = reactive({
      closeOnEscape: false,
      closeOnOutsideInteract: false,
      modal: true,
      show: true,
    });
    const proposals: boolean[] = [];
    const completions: string[] = [];
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        state.show
          ? tree(false, undefined, undefined, {
              closeOnEscape: state.closeOnEscape,
              closeOnOutsideInteract: state.closeOnOutsideInteract,
              modal: state.modal,
              onCloseComplete: () => completions.push("complete"),
              onOpenChange: (open: boolean) => proposals.push(open),
            })
          : null,
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();
    host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click();
    await nextTick();
    const popup = document.body.querySelector<HTMLDialogElement>("[data-sw-alert-dialog-popup]")!;
    expect(popup.open).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([true]);
    proposals.length = 0;

    state.modal = false;
    state.closeOnOutsideInteract = true;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(popup.open).toBe(true);
    expect(popup.getAttribute("aria-modal")).toBe("false");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(proposals).toEqual([]);
    expect(completions).toEqual([]);

    state.modal = true;
    state.closeOnEscape = true;
    await nextTick();
    await nextTick();
    await nextTick();
    expect(popup.open).toBe(true);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    expect(proposals).toEqual([]);
    expect(completions).toEqual([]);

    state.show = false;
    await nextTick();
    expect(document.body.querySelector("[data-sw-alert-dialog]")).toBeNull();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.activeElement).toBe(outside);
    expect(proposals).toEqual([]);
    expect(completions).toEqual([]);
  });

  it("composes Styled Trigger, Action, and Cancel onto native buttons with attrs, listeners, refs, and focus", async () => {
    type ExposedElement = ComponentPublicInstance & { element: HTMLElement | null };
    const triggerRef = ref<ExposedElement | null>(null);
    const cancelRef = ref<ExposedElement | null>(null);
    const actionRef = ref<ExposedElement | null>(null);
    const showParts = ref(true);
    let triggerChild: Element | null = null;
    let cancelChild: Element | null = null;
    let actionChild: Element | null = null;
    const calls: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(StyledAlertDialog, null, {
          default: () =>
            showParts.value
              ? [
                  h(
                    StyledAlertDialogTrigger,
                    {
                      asChild: true,
                      class: "adapter-trigger",
                      "data-consumer": "trigger",
                      onClick: () => calls.push("trigger-adapter"),
                      ref: triggerRef,
                    },
                    {
                      default: () =>
                        h(
                          "button",
                          {
                            class: "child-trigger",
                            onClick: () => calls.push("trigger-child"),
                            ref: (value: Element | null) => (triggerChild = value),
                          },
                          "Open",
                        ),
                    },
                  ),
                  h(StyledAlertDialogContent, null, {
                    default: () => [
                      h(StyledAlertDialogTitle, null, { default: () => "Confirm" }),
                      h(
                        StyledAlertDialogCancel,
                        {
                          asChild: true,
                          class: "adapter-cancel",
                          onClick: () => calls.push("cancel-adapter"),
                          ref: cancelRef,
                        },
                        {
                          default: () =>
                            h(
                              "button",
                              {
                                autofocus: true,
                                class: "child-cancel",
                                onClick: () => calls.push("cancel-child"),
                                ref: (value: Element | null) => (cancelChild = value),
                              },
                              "Cancel",
                            ),
                        },
                      ),
                      h(
                        StyledAlertDialogAction,
                        {
                          asChild: true,
                          class: "adapter-action",
                          onClick: () => calls.push("action-adapter"),
                          ref: actionRef,
                          variant: "error",
                        },
                        {
                          default: () =>
                            h(
                              "button",
                              {
                                class: "child-action",
                                onClick: () => calls.push("action-child"),
                                ref: (value: Element | null) => (actionChild = value),
                              },
                              "Confirm",
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

    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!;
    expect(trigger.classList.contains("child-trigger")).toBe(true);
    expect(trigger.classList.contains("adapter-trigger")).toBe(true);
    expect(trigger.dataset.consumer).toBe("trigger");
    expect(triggerRef.value!.element).toBe(trigger);
    trigger.click();
    await nextTick();
    const cancel = host.querySelector<HTMLButtonElement>('[data-slot="alert-dialog-cancel"]')!;
    const action = host.querySelector<HTMLButtonElement>('[data-slot="alert-dialog-action"]')!;
    expect(document.activeElement).toBe(cancel);
    expect(cancelRef.value!.element).toBe(cancel);
    expect(actionRef.value!.element).toBe(action);
    expect(action.className).toContain("bg-error");
    expect(triggerChild).toBe(trigger);
    expect(cancelChild).toBe(cancel);
    expect(actionChild).toBe(action);
    cancel.click();
    await nextTick();
    expect(calls).toEqual(["trigger-child", "trigger-adapter", "cancel-child", "cancel-adapter"]);
    await waitForDialogClosed(host.querySelector<HTMLDialogElement>("dialog")!);
    trigger.click();
    await nextTick();
    action.click();
    await nextTick();
    expect(calls).toEqual([
      "trigger-child",
      "trigger-adapter",
      "cancel-child",
      "cancel-adapter",
      "trigger-child",
      "trigger-adapter",
      "action-child",
      "action-adapter",
    ]);
    await waitForDialogClosed(host.querySelector<HTMLDialogElement>("dialog")!);
    const triggerExposed = triggerRef.value!;
    const cancelExposed = cancelRef.value!;
    const actionExposed = actionRef.value!;
    showParts.value = false;
    await nextTick();
    expect(triggerChild).toBeNull();
    expect(cancelChild).toBeNull();
    expect(actionChild).toBeNull();
    expect(triggerExposed.element).toBeNull();
    expect(cancelExposed.element).toBeNull();
    expect(actionExposed.element).toBeNull();
  });

  it.each(["Trigger", "Action", "Cancel"] as const)(
    "rejects invalid Styled AlertDialog%s asChild slots",
    (part) => {
      const Invalid = defineComponent({ render: () => h("button") });
      const slots: Array<() => VNode[]> = [
        () => [],
        () => [h("button"), h("button")],
        () => [h(Text, null, "text")],
        () => [h(Comment)],
        () => [h(Fragment, null, [h("button")])],
        () => [h(Invalid)],
      ];
      for (const slot of slots) {
        const host = document.createElement("div");
        const app = createApp({
          render: () =>
            h(
              part === "Trigger"
                ? StyledAlertDialogTrigger
                : part === "Action"
                  ? StyledAlertDialogAction
                  : StyledAlertDialogCancel,
              { asChild: true },
              { default: slot },
            ),
        });
        app.config.errorHandler = (error) => {
          throw error;
        };
        app.config.warnHandler = () => {};
        expect(() => app.mount(host)).toThrowError(
          `AlertDialog${part} asChild requires exactly one native element VNode.`,
        );
      }
    },
  );
});

async function waitForPortalReady(portal: HTMLElement): Promise<void> {
  if (portal.dataset.placement === "ready") return;

  await new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (portal.dataset.placement !== "ready") return;
      observer.disconnect();
      resolve();
    });
    observer.observe(portal, { attributeFilter: ["data-placement"], attributes: true });
  });
}

async function waitForDialogClosed(dialog: HTMLDialogElement): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (!dialog.open) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  throw new Error("Alert Dialog did not reach its closed native state.");
}

function tree(
  disabled = false,
  container?: HTMLElement,
  owner?: string,
  root: Record<string, unknown> = {},
) {
  return h(AlertDialogRoot, root, {
    default: () => [
      h(AlertDialogTrigger, null, { default: () => "Delete" }),
      h(
        AlertDialogPortal,
        { container, disabled, "data-owner": owner },
        {
          default: () =>
            h(AlertDialogViewport, null, {
              default: () => [
                h(AlertDialogBackdrop),
                h(AlertDialogPopup, null, {
                  default: () => [
                    h(AlertDialogTitle, null, { default: () => "Confirm" }),
                    h(AlertDialogDescription, null, { default: () => "Cannot undo" }),
                    h("button", { autofocus: true }, "Confirm"),
                    h(AlertDialogClose, null, { default: () => "Cancel" }),
                  ],
                }),
              ],
            }),
        },
      ),
    ],
  });
}
