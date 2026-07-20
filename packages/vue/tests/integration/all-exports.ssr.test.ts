import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe, expect, it } from "vitest";

import * as VuePackage from "@starwind-ui/vue";
import * as AvatarPackage from "@starwind-ui/vue/avatar";
import * as ButtonPackage from "@starwind-ui/vue/button";
import * as CheckboxPackage from "@starwind-ui/vue/checkbox";
import * as ProgressPackage from "@starwind-ui/vue/progress";
import * as ScrollAreaPackage from "@starwind-ui/vue/scroll-area";
import * as SelectPackage from "@starwind-ui/vue/select";
import * as ThemePackage from "@starwind-ui/vue/theme";
import {
  Avatar as StyledAvatar,
  AvatarFallback as StyledAvatarFallback,
  AvatarImage as StyledAvatarImage,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar";
import * as StyledAvatarPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/avatar";
import { Button as StyledButton } from "../../../../apps/vue-demo/src/components/starwind-runtime/button";
import { Checkbox as StyledCheckbox } from "../../../../apps/vue-demo/src/components/starwind-runtime/checkbox";
import { Progress as StyledProgress } from "../../../../apps/vue-demo/src/components/starwind-runtime/progress";
import * as StyledProgressPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/progress";
import {
  ScrollArea as StyledScrollArea,
  ScrollAreaContent as StyledScrollAreaContent,
  ScrollAreaCorner as StyledScrollAreaCorner,
  ScrollAreaThumb as StyledScrollAreaThumb,
  ScrollAreaViewport as StyledScrollAreaViewport,
  ScrollBar as StyledScrollBar,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/scroll-area";
import * as StyledScrollAreaPackage from "../../../../apps/vue-demo/src/components/starwind-runtime/scroll-area";
import {
  Select as StyledSelect,
  SelectContent as StyledSelectContent,
  SelectGroup as StyledSelectGroup,
  SelectItem as StyledSelectItem,
  SelectItemIndicator as StyledSelectItemIndicator,
  SelectItemText as StyledSelectItemText,
  SelectLabel as StyledSelectLabel,
  SelectScrollDownButton as StyledSelectScrollDownButton,
  SelectScrollUpButton as StyledSelectScrollUpButton,
  SelectSeparator as StyledSelectSeparator,
  SelectTrigger as StyledSelectTrigger,
  SelectValue as StyledSelectValue,
} from "../../../../apps/vue-demo/src/components/starwind-runtime/select";
import { ThemeToggle as StyledThemeToggle } from "../../../../apps/vue-demo/src/components/starwind-runtime/theme-toggle";
import * as StyledThemeTogglePackage from "../../../../apps/vue-demo/src/components/starwind-runtime/theme-toggle";

const EXPECTED_SELECT_EXPORTS = [
  "Select",
  "SelectContext",
  "SelectGroup",
  "SelectGroupLabel",
  "SelectIcon",
  "SelectItem",
  "SelectItemContext",
  "SelectItemIndicator",
  "SelectItemText",
  "SelectLabel",
  "SelectList",
  "SelectPopup",
  "SelectPortal",
  "SelectPositioner",
  "SelectRoot",
  "SelectScrollDownArrow",
  "SelectScrollUpArrow",
  "SelectSeparator",
  "SelectTrigger",
  "SelectValue",
  "default",
  "useSelectContext",
  "useSelectItemContext",
].sort();
const EXPECTED_AVATAR_EXPORTS = [
  "Avatar",
  "AvatarFallback",
  "AvatarImage",
  "AvatarRoot",
  "default",
].sort();
const EXPECTED_BUTTON_EXPORTS = ["Button", "ButtonRoot", "default"].sort();
const EXPECTED_CHECKBOX_EXPORTS = [
  "Checkbox",
  "CheckboxIndicator",
  "CheckboxRoot",
  "default",
].sort();
const EXPECTED_PROGRESS_EXPORTS = [
  "Progress",
  "ProgressIndicator",
  "ProgressLabel",
  "ProgressRoot",
  "ProgressTrack",
  "ProgressValue",
  "default",
].sort();
const EXPECTED_SCROLL_AREA_EXPORTS = [
  "ScrollArea",
  "ScrollAreaContent",
  "ScrollAreaCorner",
  "ScrollAreaRoot",
  "ScrollAreaScrollbar",
  "ScrollAreaThumb",
  "ScrollAreaViewport",
  "default",
].sort();

describe("Vue source package and Styled SSR inventory", () => {
  it("exposes the exact source root and subpath values", () => {
    expect(Object.keys(AvatarPackage).sort()).toEqual(EXPECTED_AVATAR_EXPORTS);
    expect(Object.keys(ButtonPackage).sort()).toEqual(EXPECTED_BUTTON_EXPORTS);
    expect(Object.keys(CheckboxPackage).sort()).toEqual(EXPECTED_CHECKBOX_EXPORTS);
    expect(Object.keys(ProgressPackage).sort()).toEqual(EXPECTED_PROGRESS_EXPORTS);
    expect(Object.keys(ScrollAreaPackage).sort()).toEqual(EXPECTED_SCROLL_AREA_EXPORTS);
    expect(Object.keys(SelectPackage).sort()).toEqual(EXPECTED_SELECT_EXPORTS);
    expect(Object.keys(ThemePackage).sort()).toEqual(["getThemeInitScript", "initThemeController"]);
    expect(Object.keys(VuePackage).sort()).toEqual(
      [
        ...new Set([
          ...EXPECTED_AVATAR_EXPORTS,
          ...EXPECTED_BUTTON_EXPORTS,
          ...EXPECTED_CHECKBOX_EXPORTS,
          ...EXPECTED_PROGRESS_EXPORTS,
          ...EXPECTED_SCROLL_AREA_EXPORTS,
          ...EXPECTED_SELECT_EXPORTS,
          "getThemeInitScript",
          "initThemeController",
        ]),
      ]
        .filter((name) => name !== "default")
        .sort(),
    );
  });

  it("server-renders every Primitive component in valid public trees without browser globals", async () => {
    expect(globalThis).not.toHaveProperty("document");
    expect(globalThis).not.toHaveProperty("window");

    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(
                AvatarPackage.AvatarRoot,
                { id: "ssr-primitive-avatar" },
                {
                  default: () => [
                    h(AvatarPackage.AvatarImage, { alt: "Profile", src: "/avatar.png" }),
                    h(AvatarPackage.AvatarFallback, { delay: 100 }, { default: () => "AB" }),
                  ],
                },
              ),
              h(
                ButtonPackage.ButtonRoot,
                { id: "ssr-primitive-button" },
                { default: () => "Save" },
              ),
              h(
                CheckboxPackage.CheckboxRoot,
                { defaultChecked: true, name: "terms", value: "yes" },
                {
                  default: () =>
                    h(
                      CheckboxPackage.CheckboxIndicator,
                      { keepMounted: true },
                      { default: () => "Checked" },
                    ),
                },
              ),
              renderPrimitiveProgress(),
              renderPrimitiveScrollArea(),
              renderPrimitiveSelect(),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    for (const part of [
      "avatar",
      "avatar-image",
      "avatar-fallback",
      "button",
      "checkbox",
      "checkbox-indicator",
      "progress",
      "progress-label",
      "progress-track",
      "progress-indicator",
      "progress-value",
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
      "select",
      "select-label",
      "select-trigger",
      "select-value",
      "select-icon",
      "select-portal",
      "select-positioner",
      "select-popup",
      "select-list",
      "select-group",
      "select-group-label",
      "select-item",
      "select-item-text",
      "select-item-indicator",
      "select-separator",
      "select-scroll-up-arrow",
      "select-scroll-down-arrow",
    ]) {
      expect(first, part).toContain(`data-sw-${part}`);
    }
  });

  it("server-renders every generated Styled component with its data-slot contract", async () => {
    expect(Object.keys(StyledAvatarPackage).sort()).toEqual([
      "Avatar",
      "AvatarFallback",
      "AvatarImage",
      "AvatarVariants",
      "default",
    ]);
    expect(Object.keys(StyledProgressPackage).sort()).toEqual([
      "Progress",
      "ProgressVariants",
      "default",
    ]);
    expect(Object.keys(StyledScrollAreaPackage).sort()).toEqual([
      "ScrollArea",
      "ScrollAreaContent",
      "ScrollAreaCorner",
      "ScrollAreaThumb",
      "ScrollAreaVariants",
      "ScrollAreaViewport",
      "ScrollBar",
      "default",
    ]);
    expect(Object.keys(StyledThemeTogglePackage).sort()).toEqual([
      "ThemeToggle",
      "ThemeToggleVariants",
      "default",
    ]);
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(StyledButton, { variant: "primary" }, { default: () => "Save" }),
              h(StyledCheckbox, {
                defaultChecked: true,
                id: "styled-terms",
                label: "Accept terms",
              }),
              h(
                StyledAvatar,
                { size: "lg", variant: "success" },
                {
                  default: () => [
                    h(StyledAvatarImage, { alt: "Ada Lovelace", src: "/ada.png" }),
                    h(StyledAvatarFallback, { delay: 120 }, { default: () => "AL" }),
                  ],
                },
              ),
              h(StyledProgress, { label: "Upload", max: 80, min: 20, value: 50 }),
              renderStyledScrollArea(),
              h(StyledScrollAreaViewport, null, {
                default: () => h(StyledScrollAreaContent, null, { default: () => "Part content" }),
              }),
              h(
                StyledScrollBar,
                { keepMounted: true, orientation: "horizontal" },
                {
                  default: () => h(StyledScrollAreaThumb),
                },
              ),
              h(StyledScrollAreaCorner),
              renderStyledSelect(),
              h(StyledThemeToggle, { "aria-label": "Change appearance" }),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    for (const slot of [
      "button",
      "checkbox-wrapper",
      "checkbox",
      "checkbox-indicator",
      "checkbox-label",
      "avatar",
      "avatar-image",
      "avatar-fallback",
      "progress",
      "progress-track",
      "progress-indicator",
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
      "select",
      "select-trigger",
      "select-value",
      "select-content",
      "select-list",
      "select-group",
      "select-label",
      "select-item",
      "select-item-text",
      "select-item-indicator",
      "select-separator",
      "select-scroll-up-button",
      "select-scroll-down-button",
      "theme-toggle",
    ]) {
      expect(first, slot).toContain(`data-slot="${slot}"`);
    }
  });
});

function renderPrimitiveProgress() {
  return h(
    ProgressPackage.ProgressRoot,
    { max: 200, min: 20, value: 80 },
    {
      default: () => [
        h(ProgressPackage.ProgressLabel, null, { default: () => "Export files" }),
        h(ProgressPackage.ProgressTrack, null, {
          default: () => h(ProgressPackage.ProgressIndicator),
        }),
        h(ProgressPackage.ProgressValue),
      ],
    },
  );
}

function renderStyledScrollArea() {
  return h(
    StyledScrollArea,
    { overflowEdgeThreshold: 12, viewportClass: "ssr-viewport" },
    {
      default: () => "Scrollable content",
      scrollbar: () =>
        h(
          StyledScrollBar,
          { keepMounted: true, orientation: "horizontal" },
          { default: () => h(StyledScrollAreaThumb) },
        ),
    },
  );
}

function renderPrimitiveScrollArea() {
  return h(
    ScrollAreaPackage.ScrollAreaRoot,
    { overflowEdgeThreshold: { yStart: 20 } },
    {
      default: () => [
        h(ScrollAreaPackage.ScrollAreaViewport, null, {
          default: () =>
            h(ScrollAreaPackage.ScrollAreaContent, null, { default: () => "Scrollable content" }),
        }),
        h(ScrollAreaPackage.ScrollAreaScrollbar, null, {
          default: () => h(ScrollAreaPackage.ScrollAreaThumb),
        }),
        h(ScrollAreaPackage.ScrollAreaCorner),
      ],
    },
  );
}

function renderPrimitiveSelect() {
  return h(
    SelectPackage.SelectRoot,
    { defaultValue: "apple", name: "fruit" },
    {
      default: () => [
        h(SelectPackage.SelectLabel, null, { default: () => "Fruit" }),
        h(SelectPackage.SelectTrigger, null, {
          default: () => [
            h(SelectPackage.SelectValue, { placeholder: "Pick fruit" }),
            h(SelectPackage.SelectIcon, null, { default: () => "Open" }),
          ],
        }),
        h(
          SelectPackage.SelectPortal,
          { disabled: true },
          {
            default: () =>
              h(
                SelectPackage.SelectPositioner,
                { alignItemWithTrigger: false },
                {
                  default: () =>
                    h(SelectPackage.SelectPopup, null, {
                      default: () => [
                        h(SelectPackage.SelectScrollUpArrow, null, { default: () => "Up" }),
                        h(SelectPackage.SelectList, null, {
                          default: () => [
                            h(SelectPackage.SelectGroup, null, {
                              default: () => [
                                h(SelectPackage.SelectGroupLabel, null, {
                                  default: () => "Available",
                                }),
                                h(
                                  SelectPackage.SelectItem,
                                  { value: "apple" },
                                  {
                                    default: () => [
                                      h(SelectPackage.SelectItemText, null, {
                                        default: () => "Apple",
                                      }),
                                      h(SelectPackage.SelectItemIndicator, null, {
                                        default: () => "Selected",
                                      }),
                                    ],
                                  },
                                ),
                              ],
                            }),
                            h(SelectPackage.SelectSeparator),
                          ],
                        }),
                        h(SelectPackage.SelectScrollDownArrow, null, {
                          default: () => "Down",
                        }),
                      ],
                    }),
                },
              ),
          },
        ),
      ],
    },
  );
}

function renderStyledSelect() {
  return h(
    StyledSelect,
    { defaultValue: "apple", modal: false },
    {
      default: () => [
        h(StyledSelectTrigger, null, {
          default: () => h(StyledSelectValue, { placeholder: "Pick fruit" }),
        }),
        h(
          StyledSelectContent,
          { alignItemWithTrigger: false },
          {
            default: () => [
              h(StyledSelectScrollUpButton),
              h(StyledSelectGroup, null, {
                default: () => [
                  h(StyledSelectLabel, null, { default: () => "Available" }),
                  h(
                    StyledSelectItem,
                    { showIndicator: false, value: "apple" },
                    {
                      default: () => [
                        h(StyledSelectItemText, null, { default: () => "Apple" }),
                        h(StyledSelectItemIndicator, null, { default: () => "Selected" }),
                      ],
                    },
                  ),
                ],
              }),
              h(StyledSelectSeparator),
              h(StyledSelectScrollDownButton),
            ],
          },
        ),
      ],
    },
  );
}
