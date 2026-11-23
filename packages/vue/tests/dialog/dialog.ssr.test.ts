import {
  AlertDialogClose,
  AlertDialogRoot,
  AlertDialogTrigger,
} from "@starwind-ui/vue/alert-dialog";
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@starwind-ui/vue/dialog";
import { DrawerClose, DrawerRoot, DrawerTrigger } from "@starwind-ui/vue/drawer";
import { SelectRoot, SelectTrigger } from "@starwind-ui/vue/select";
import { describe, expect, it } from "vitest";
import { Comment, type Component, createSSRApp, createVNode, Fragment, h } from "vue";
import { renderToString } from "vue/server-renderer";
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

  const nativeControls: readonly [string, Component, Component][] = [
    ["DialogTrigger", DialogRoot, DialogTrigger],
    ["DialogClose", DialogRoot, DialogClose],
    ["AlertDialogTrigger", AlertDialogRoot, AlertDialogTrigger],
    ["AlertDialogClose", AlertDialogRoot, AlertDialogClose],
    ["DrawerTrigger", DrawerRoot, DrawerTrigger],
    ["DrawerClose", DrawerRoot, DrawerClose],
    ["SelectTrigger", SelectRoot, SelectTrigger],
  ];

  function renderControl(root: Component, control: Component, children: () => unknown[]) {
    return renderToString(
      createSSRApp({
        render: () => h(root, null, { default: () => h(control, { asChild: true }, children) }),
      }),
    );
  }

  it.each(nativeControls)(
    "%s asChild accepts one Fragment boundary and empty v-if comment siblings",
    async (_name, root, control) => {
      const fragment = await renderControl(root, control, () => [
        createVNode(Fragment, null, [h("a", { href: "/fragment" }, "Fragment child")]),
      ]);
      expect(fragment).toMatch(/<a[^>]*href="\/fragment"/);

      const vIfSibling = await renderControl(root, control, () => [
        createVNode(Comment, null, "v-if"),
        h("a", { href: "/comment" }, "Comment sibling"),
      ]);
      expect(vIfSibling).toMatch(/<a[^>]*href="\/comment"/);

      const fragmentWithComment = await renderControl(root, control, () => [
        createVNode(Fragment, null, [
          h("a", { href: "/both" }, "Both"),
          createVNode(Comment, null, "v-if"),
        ]),
      ]);
      expect(fragmentWithComment).toMatch(/<a[^>]*href="\/both"/);
    },
  );

  it.each(nativeControls)(
    "%s asChild still rejects a lone comment, text, nested Fragments, and two children",
    async (name, root, control) => {
      const message = `${name} asChild requires exactly one native element or component VNode.`;
      await expect(
        renderControl(root, control, () => [createVNode(Comment, null, "v-if")]),
      ).rejects.toThrow(message);
      await expect(renderControl(root, control, () => ["Text"])).rejects.toThrow(message);
      await expect(
        renderControl(root, control, () => [
          createVNode(Fragment, null, [createVNode(Fragment, null, [h("button", "Nested")])]),
        ]),
      ).rejects.toThrow(message);
      await expect(
        renderControl(root, control, () => [
          createVNode(Fragment, null, [h("button", "One"), h("button", "Two")]),
        ]),
      ).rejects.toThrow(message);
    },
  );
});
