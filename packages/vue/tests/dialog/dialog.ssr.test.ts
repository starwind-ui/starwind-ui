import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

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
  DialogContent as StyledDialogContent,
  DialogDescription as StyledDialogDescription,
  DialogTitle as StyledDialogTitle,
  DialogTrigger as StyledDialogTrigger,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/dialog";

describe("Vue Dialog SSR", () => {
  it("renders deterministic Primitive native-dialog anatomy without Portal or Viewport", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              DialogRoot,
              { class: "root", defaultOpen: false },
              {
                default: () => [
                  h(DialogTrigger, null, { default: () => "Open" }),
                  h(DialogBackdrop),
                  h(DialogPopup, null, {
                    default: () => [
                      h(DialogTitle, null, { default: () => "Title" }),
                      h(DialogDescription, null, { default: () => "Description" }),
                      h(DialogClose, null, { default: () => "Close" }),
                    ],
                  }),
                ],
              },
            ),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-dialog");
    expect(first).toContain("data-sw-dialog-overlay");
    expect(first).toContain("<dialog");
    expect(first).toContain("data-sw-dialog-content");
    expect(first).not.toContain("data-sw-dialog-portal");
    expect(first).not.toContain("data-sw-dialog-viewport");
  });

  it("renders Styled Dialog with canonical slots and custom backdrop replacement", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledDialog, null, {
            default: () => [
              h(StyledDialogTrigger, null, { default: () => "Open styled" }),
              h(StyledDialogContent, null, {
                backdrop: () => h("div", { "data-custom-backdrop": "" }),
                default: () => [
                  h(StyledDialogTitle, null, { default: () => "Styled title" }),
                  h(StyledDialogDescription, null, { default: () => "Styled description" }),
                ],
              }),
            ],
          }),
      }),
    );

    expect(html).toContain('data-slot="dialog"');
    expect(html).toContain('data-slot="dialog-trigger"');
    expect(html).toContain('data-slot="dialog-content"');
    expect(html).toContain("data-custom-backdrop");
    expect(html).not.toContain('data-slot="dialog-backdrop"');
    expect(html).toContain("data-sw-dialog-close");
  });
});
