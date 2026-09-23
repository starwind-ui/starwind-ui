import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

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

describe("Vue Alert Dialog SSR", () => {
  it("renders deterministic inline Portal anatomy with alertdialog semantics", async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h(AlertDialogRoot, null, {
              default: () => [
                h(AlertDialogTrigger, null, { default: () => "Delete" }),
                h(AlertDialogPortal, null, {
                  default: () =>
                    h(AlertDialogViewport, null, {
                      default: () => [
                        h(AlertDialogBackdrop),
                        h(AlertDialogPopup, null, {
                          default: () => [
                            h(AlertDialogTitle, null, { default: () => "Confirm" }),
                            h(AlertDialogDescription, null, { default: () => "Cannot undo" }),
                            h(AlertDialogClose, null, { default: () => "Cancel" }),
                          ],
                        }),
                      ],
                    }),
                }),
              ],
            }),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    expect(first).toContain("data-sw-alert-dialog-portal");
    expect(first).toContain("data-sw-alert-dialog-viewport");
    expect(first).toContain('role="alertdialog"');
    expect(first).toContain("data-sw-alert-dialog-close");
  });

  it("preserves direct Styled Action and Cancel roots on the server", async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(StyledAlertDialog, null, {
            default: () => [
              h(StyledAlertDialogTrigger, null, { default: () => "Open" }),
              h(StyledAlertDialogContent, null, {
                default: () => [
                  h(StyledAlertDialogTitle, null, { default: () => "Confirm" }),
                  h(StyledAlertDialogAction, null, { default: () => "Delete" }),
                  h(
                    StyledAlertDialogCancel,
                    { as: "a", href: "/cancel" },
                    { default: () => "Cancel" },
                  ),
                ],
              }),
            ],
          }),
      }),
    );

    expect(html).toMatch(/<button[^>]*data-slot="alert-dialog-action"[^>]*type="button"/);
    expect(html).toMatch(/<a[^>]*href="\/cancel"[^>]*data-slot="alert-dialog-cancel"/);
    expect(html).toContain("Delete");
    expect(html).toContain("Cancel");
    expect(html).not.toMatch(/<div[^>]*data-slot="alert-dialog-(?:action|cancel)"/);
  });
});
