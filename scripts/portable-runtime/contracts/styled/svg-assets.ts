import type { ImportContract, SvgAsset, SvgAssetAttribute } from "./types.js";

const outlineAttributes = [
  { name: "xmlns", value: "http://www.w3.org/2000/svg" },
  { name: "viewBox", value: "0 0 24 24" },
  { name: "fill", value: "none" },
  { name: "stroke", value: "currentColor" },
  { name: "stroke-width", value: "2" },
  { name: "stroke-linecap", value: "round" },
  { name: "stroke-linejoin", value: "round" },
  { name: "aria-hidden", value: "true" },
] as const satisfies readonly SvgAssetAttribute[];

const path = (d: string, attributes: readonly SvgAssetAttribute[] = []) => ({
  attributes: [{ name: "d", value: d }, ...attributes],
  tag: "path" as const,
});

const outline = (...children: ReturnType<typeof path>[]): SvgAsset => ({
  attributes: [...outlineAttributes],
  children: [
    {
      attributes: [
        { name: "stroke", value: "none" },
        { name: "d", value: "M0 0h24v24H0z" },
        { name: "fill", value: "none" },
      ],
      tag: "path",
    },
    ...children,
  ],
  omittedAttributes: ["aria-hidden"],
});

const filled = (...children: ReturnType<typeof path>[]): SvgAsset => ({
  attributes: [
    { name: "xmlns", value: "http://www.w3.org/2000/svg" },
    { name: "viewBox", value: "0 0 24 24" },
    { name: "fill", value: "currentColor" },
    { name: "aria-hidden", value: "true" },
  ],
  children,
});

const theme = (...children: ReturnType<typeof path>[]): SvgAsset => ({
  attributes: [...outlineAttributes.filter(({ name }) => name !== "aria-hidden")],
  children,
});

export const styledSvgAssets: Readonly<Record<string, SvgAsset>> = {
  "@tabler/icons/filled/caret-up.svg": filled(
    path("M11.293 7.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 -.707 1.707h-12a1 1 0 0 1 -.707 -1.707z", [
      { name: "stroke", value: "none" },
    ]),
  ),
  "@tabler/icons/filled/circle.svg": filled(
    path("M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z", [{ name: "stroke", value: "none" }]),
  ),
  "@tabler/icons/outline/alert-triangle.svg": outline(
    path("M12 9v4"),
    path("M10.3 3.7l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7 -3l-8 -14a2 2 0 0 0 -3.4 0z"),
    path("M12 17h.01"),
  ),
  "@tabler/icons/outline/check.svg": outline(path("M5 12l5 5l10 -10")),
  "@tabler/icons/outline/chevron-down.svg": outline(path("M6 9l6 6l6 -6")),
  "@tabler/icons/outline/chevron-left.svg": outline(path("M15 6l-6 6l6 6")),
  "@tabler/icons/outline/chevron-right.svg": outline(path("M9 6l6 6l-6 6")),
  "@tabler/icons/outline/circle-check.svg": outline(
    path("M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"),
    path("M9 12l2 2l4 -4"),
  ),
  "@tabler/icons/outline/circle-x.svg": outline(
    path("M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"),
    path("M10 10l4 4m0 -4l-4 4"),
  ),
  "@tabler/icons/outline/cloud-upload.svg": outline(
    path(
      "M7 18a4.6 4.4 0 0 1 0 -9c.26 -3.008 2.42 -4.508 5 -4.508c2.58 0 4.74 1.5 5 4.508h.5a3.5 3.5 0 0 1 0 7h-.5",
    ),
    path("M9 15l3 -3l3 3"),
    path("M12 12l0 9"),
  ),
  "@tabler/icons/outline/color-picker.svg": outline(
    path("M11 7l6 6"),
    path("M4 16l11.7 -11.7a1 1 0 0 1 3 3l-11.7 11.7h-3v-3z"),
  ),
  "@tabler/icons/outline/dots.svg": outline(
    path("M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"),
    path("M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"),
    path("M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"),
  ),
  "@tabler/icons/outline/info-circle.svg": outline(
    path("M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"),
    path("M12 8l.01 0"),
    path("M11 12l1 0l0 4l1 0"),
  ),
  "@tabler/icons/outline/layout-sidebar.svg": outline(
    path("M4 4m-2 0a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v16a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z"),
    path("M9 4l0 16"),
  ),
  "@tabler/icons/outline/loader-2.svg": outline(path("M12 3a9 9 0 1 0 9 9"), path("M12 7v5l3 3")),
  "@tabler/icons/outline/minus.svg": outline(path("M5 12h14")),
  "@tabler/icons/outline/moon.svg": theme(
    path("M12 3c.132 0 .263 0 .393 .008a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"),
  ),
  "@tabler/icons/outline/sun.svg": theme(
    path("M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"),
    path(
      "M4 12h.01M12 4v.01M20 12h.01M12 20v.01M6.31 6.31l-.01 -.01M17.7 6.3l-.01 .01M17.7 17.7l-.01 -.01M6.3 17.7l.01 -.01",
    ),
  ),
  "@tabler/icons/outline/x.svg": outline(path("M18 6l-12 12"), path("M6 6l12 12")),
};

export function resolveStyledSvgAsset(importContract: ImportContract): SvgAsset | undefined {
  return importContract.svg ?? styledSvgAssets[importContract.source];
}
