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
});
