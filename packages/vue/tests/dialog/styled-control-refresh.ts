import { createAlertDialog } from "@starwind-ui/runtime/alert-dialog";
import { createDialog } from "@starwind-ui/runtime/dialog";
import { createDrawer } from "@starwind-ui/runtime/drawer";
import { expect, it, vi } from "vitest";
import {
  type Component,
  type ComponentPublicInstance,
  createApp,
  h,
  nextTick,
  reactive,
  ref,
} from "vue";

type Parts = {
  Root: Component;
  Trigger: Component;
  Content: Component;
  Title: Component;
  Close: Component;
  Cancel?: Component;
};
export function testStyledControlRefresh(
  name: "dialog" | "alert-dialog" | "drawer",
  parts: Parts,
): void {
  it(`connects late Styled ${name} child controls without replacing the owner`, async () => {
    const state = reactive({ shown: false, key: 0, title: "same", veto: false });
    const nativeRef = ref<HTMLElement | null>(null);
    const exposed = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const change = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(
          parts.Root,
          {
            title: state.title,
            onOpenChange: (open: boolean, detail: { cancel(): void }) => {
              change(open);
              if (state.veto) detail.cancel();
            },
          },
          {
            default: () => [
              state.shown &&
                h(
                  parts.Trigger,
                  { asChild: true, ref: exposed },
                  {
                    default: () =>
                      h(
                        "button",
                        { key: state.key, "data-test-trigger": "", ref: nativeRef },
                        "Open",
                      ),
                  },
                ),
              h(parts.Content, null, {
                default: () => [
                  h(parts.Title, null, { default: () => "Title" }),
                  h("input", { "aria-label": "Focus target" }),
                  state.shown &&
                    h(
                      parts.Close,
                      { asChild: true },
                      {
                        default: () =>
                          h("button", { key: state.key, "data-test-close": "" }, "Close"),
                      },
                    ),
                  h(
                    parts.Root,
                    { "data-nested": "" },
                    {
                      default: () => [
                        h(
                          parts.Trigger,
                          { asChild: true },
                          { default: () => h("button", { "data-nested-trigger": "" }, "Nested") },
                        ),
                        h(parts.Content, null, {
                          default: () => [
                            h(parts.Title, null, { default: () => "Nested" }),
                            state.shown &&
                              h(
                                parts.Close,
                                { asChild: true },
                                {
                                  default: () =>
                                    h("button", { "data-nested-close": "" }, "Close nested"),
                                },
                              ),
                          ],
                        }),
                      ],
                    },
                  ),
                ],
              }),
            ],
          },
        ),
    });
    app.mount(host);
    try {
      await settle();
      const root = host.querySelector<HTMLElement>(`[data-sw-${name}]`)!;
      const factory =
        name === "dialog" ? createDialog : name === "drawer" ? createDrawer : createAlertDialog;
      const instance = factory(root);
      const popup = document.querySelector<HTMLDialogElement>("dialog")!;
      const refresh = vi.spyOn(instance, "refresh");
      state.shown = true;
      await settle();
      const trigger = root.querySelector<HTMLButtonElement>("[data-test-trigger]")!;
      expect(nativeRef.value).toBe(trigger);
      expect(exposed.value!.element).toBe(trigger);
      expect(trigger.getAttribute("aria-controls")).toBe(popup.id);
      trigger.focus();
      trigger.click();
      await settle();
      expect(instance.getOpen()).toBe(true);
      const focus = document.activeElement;
      const oldClose = popup.querySelector<HTMLButtonElement>("[data-test-close]")!;
      state.key++;
      await settle();
      expect(factory(root)).toBe(instance);
      expect(document.querySelector("dialog")).toBe(popup);
      expect(document.activeElement).toBe(focus);
      expect(document.body.style.overflow).toBe("hidden");
      oldClose.click();
      expect(instance.getOpen()).toBe(true);
      const close = popup.querySelector<HTMLButtonElement>("[data-test-close]")!;
      const nestedRoot = popup.querySelector<HTMLElement>("[data-nested]")!;
      const nested = factory(nestedRoot);
      popup.querySelector<HTMLButtonElement>("[data-nested-trigger]")!.click();
      await settle();
      expect(nested.getOpen()).toBe(true);
      const outerProposals = change.mock.calls.length;
      close.click();
      await settle();
      expect(instance.getOpen()).toBe(true);
      expect(change).toHaveBeenCalledTimes(outerProposals);
      nestedRoot.querySelector<HTMLButtonElement>("[data-nested-close]")!.click();
      await vi.waitFor(() =>
        expect(nestedRoot.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
      );
      expect(instance.getOpen()).toBe(true);
      state.veto = true;
      close.click();
      await settle();
      expect(instance.getOpen()).toBe(true);
      state.veto = false;
      const cancel = (event: Event) => event.preventDefault();
      root.addEventListener("starwind:open-change", cancel);
      close.click();
      await settle();
      expect(instance.getOpen()).toBe(true);
      root.removeEventListener("starwind:open-change", cancel);
      refresh.mockClear();
      state.title = "unrelated";
      await settle();
      expect(refresh).not.toHaveBeenCalled();
      close.click();
      await vi.waitFor(() => expect(popup.open).toBe(false));
      expect(change.mock.calls.map(([open]) => open)).toEqual([true, false, false, false]);
      state.shown = false;
      await settle();
      expect(nativeRef.value).toBeNull();
      const proposals = change.mock.calls.length;
      trigger.click();
      close.click();
      expect(change).toHaveBeenCalledTimes(proposals);
      state.shown = true;
      await settle();
      root.querySelector<HTMLButtonElement>("[data-test-trigger]")!.click();
      await settle();
      expect(instance.getOpen()).toBe(true);
    } finally {
      app.unmount();
      host.remove();
    }
    await settle();
    expect(document.body.style.overflow).toBe("");
    expect(nativeRef.value).toBeNull();
  });
  if (name === "alert-dialog")
    for (const [label, Control] of [
      ["Action", parts.Close],
      ["Cancel", parts.Cancel!],
    ] as const) {
      it(`connects late Styled ${label} Button and anchor branches`, async () => {
        const state = reactive({ shown: false, anchor: false });
        const exposed = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
        const host = document.createElement("div");
        document.body.append(host);
        const app = createApp({
          render: () =>
            h(parts.Root, null, {
              default: () => [
                h(parts.Trigger, null, { default: () => "Open" }),
                h(parts.Content, null, {
                  default: () => [
                    h(parts.Title, null, { default: () => "Title" }),
                    state.shown &&
                      h(
                        Control,
                        {
                          ref: exposed,
                          href: state.anchor ? "#confirmed" : undefined,
                          "data-control": "",
                          onClick: (event: Event) => event.preventDefault(),
                        },
                        { default: () => "Confirm" },
                      ),
                  ],
                }),
              ],
            }),
        });
        app.mount(host);
        try {
          await settle();
          const root = host.querySelector<HTMLElement>("[data-sw-alert-dialog]")!;
          const instance = createAlertDialog(root);
          root.querySelector<HTMLButtonElement>("[data-sw-alert-dialog-trigger]")!.click();
          await settle();
          state.shown = true;
          await settle();
          const button = document.querySelector<HTMLElement>("[data-control]")!;
          expect(button.tagName).toBe("BUTTON");
          expect(exposed.value!.element).toBe(button);
          state.anchor = true;
          await settle();
          const anchor = document.querySelector<HTMLElement>("[data-control]")!;
          expect(anchor.tagName).toBe("A");
          expect(exposed.value!.element).toBe(anchor);
          button.click();
          expect(instance.getOpen()).toBe(true);
          anchor.click();
          await settle();
          expect(instance.getOpen()).toBe(false);
          await vi.waitFor(() =>
            expect(document.querySelector<HTMLDialogElement>("dialog")!.open).toBe(false),
          );
          const control = exposed.value!;
          state.shown = false;
          await settle();
          expect(control.element).toBeNull();
        } finally {
          app.unmount();
          host.remove();
        }
      });
    }
}
async function settle() {
  await nextTick();
  await Promise.resolve();
  await nextTick();
}
