import type { StyledAdapterContract } from "../types.js";

const videoTypeExpression = `src.includes("youtube.com/shorts/") || src.includes("youtu.be/shorts/")
  ? "youtube-shorts"
  : src.includes("youtube.com") ||
      src.includes("youtu.be") ||
      src.includes("youtube-nocookie.com")
    ? "youtube"
    : "native"`;

const youtubeIdExpression = `videoType !== "native"
  ? ([
      /youtube\\.com\\/shorts\\/([^?&]+)/,
      /youtube\\.com\\/watch\\?v=([^&]+)/,
      /youtube\\.com\\/embed\\/([^?&]+)/,
      /youtu\\.be\\/([^?&]+)/,
      /youtube-nocookie\\.com\\/embed\\/([^?&]+)/,
    ]
      .map((pattern) => src.match(pattern)?.[1])
      .find(Boolean) ?? null)
  : null`;

const embedUrlExpression = `youtubeId
  ? (() => {
      const params = new URLSearchParams();
      if (autoplay) params.set("autoplay", "1");
      if (muted) params.set("mute", "1");
      if (loop) {
        params.set("loop", "1");
        params.set("playlist", youtubeId);
      }
      if (!controls) params.set("controls", "0");

      const baseUrl = "https://www.youtube-nocookie.com/embed/" + youtubeId;
      const queryString = params.toString();
      return queryString ? baseUrl + "?" + queryString : baseUrl;
    })()
  : null`;

const iframeSrcExpression = `srcdoc ? undefined : (embedUrl ?? undefined)`;

export const videoStyledContract: StyledAdapterContract = {
  component: "video",
  publicExports: ["Video"],
  defaultExport: { Root: "Video" },
  defaultExportMode: "component",
  variantCollectionName: "VideoVariants",
  variants: {
    video: {
      base: "aspect-video h-auto w-full",
    },
  },
  components: [
    {
      exportName: "Video",
      props: {
        declaration: "type",
        extends: [
          { type: "htmlAttributes", element: "video" },
          { type: "htmlAttributes", element: "iframe" },
        ],
        fields: [
          { name: "src", type: "string" },
          { name: "title", optional: true, type: "string" },
          { name: "autoplay", optional: true, type: "boolean", frameworks: ["astro"] },
          { name: "autoPlay", optional: true, type: "boolean", frameworks: ["react"] },
          { name: "muted", optional: true, type: "boolean" },
          { name: "loop", optional: true, type: "boolean" },
          { name: "controls", optional: true, type: "boolean" },
          { name: "poster", optional: true, type: "string" },
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLVideoElement | HTMLIFrameElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "src" },
          { name: "title", defaultValue: '"Video"' },
          {
            name: "autoplay",
            defaultValue: "false",
            frameworks: ["astro"],
          },
          {
            name: "autoPlay",
            alias: "autoplay",
            defaultValue: "false",
            frameworks: ["react"],
          },
          { name: "muted", defaultValue: "false" },
          { name: "loop", defaultValue: "false" },
          { name: "controls", defaultValue: "true" },
          { name: "poster" },
          { name: "srcdoc", frameworks: ["astro"] },
          { name: "srcDoc", alias: "srcdoc", frameworks: ["react"] },
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      variables: [
        {
          name: "videoType",
          value: { type: "raw", code: videoTypeExpression },
        },
        {
          name: "youtubeId",
          value: { type: "raw", code: youtubeIdExpression },
        },
        {
          name: "isShort",
          value: { type: "raw", code: 'videoType === "youtube-shorts"' },
        },
        {
          name: "embedUrl",
          value: { type: "raw", code: embedUrlExpression },
        },
        {
          name: "iframeSrc",
          value: { type: "raw", code: iframeSrcExpression },
        },
      ],
      render: [
        {
          type: "conditional",
          condition: 'videoType === "native" || !embedUrl',
          then: [
            {
              type: "element",
              tag: "video",
              attrs: [
                { name: "data-sw-video" },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "video",
                    args: { class: "className" },
                  },
                },
                { name: "src", value: { type: "variable", name: "src" } },
                {
                  name: "autoplay",
                  value: { type: "variable", name: "autoplay" },
                  frameworks: ["astro"],
                },
                {
                  name: "autoPlay",
                  value: { type: "variable", name: "autoplay" },
                  frameworks: ["react"],
                },
                { name: "muted", value: { type: "variable", name: "muted" } },
                { name: "loop", value: { type: "variable", name: "loop" } },
                { name: "controls", value: { type: "variable", name: "controls" } },
                { name: "poster", value: { type: "variable", name: "poster" } },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "ref",
                  value: { type: "raw", code: "ref as React.Ref<HTMLVideoElement>" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "video" } },
              ],
              children: [
                {
                  type: "element",
                  tag: "track",
                  selfClosing: true,
                  attrs: [{ name: "kind", value: { type: "literal", value: "captions" } }],
                },
              ],
            },
          ],
          else: [
            {
              type: "element",
              tag: "iframe",
              selfClosing: true,
              attrs: [
                { name: "data-sw-video" },
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "video",
                    args: { class: "className" },
                  },
                },
                { name: "src", value: { type: "variable", name: "iframeSrc" } },
                {
                  name: "srcdoc",
                  value: { type: "variable", name: "srcdoc" },
                  frameworks: ["astro"],
                },
                {
                  name: "srcDoc",
                  value: { type: "variable", name: "srcdoc" },
                  frameworks: ["react"],
                },
                { name: "title", value: { type: "variable", name: "title" } },
                {
                  name: "allow",
                  value: {
                    type: "literal",
                    value:
                      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                  },
                },
                {
                  name: "referrerpolicy",
                  value: { type: "literal", value: "strict-origin-when-cross-origin" },
                  frameworks: ["astro"],
                },
                {
                  name: "referrerPolicy",
                  value: { type: "literal", value: "strict-origin-when-cross-origin" },
                  frameworks: ["react"],
                },
                { name: "allowfullscreen", frameworks: ["astro"] },
                { name: "allowFullScreen", frameworks: ["react"] },
                {
                  name: "data-video-type",
                  value: { type: "raw", code: 'isShort ? "youtube-shorts" : "youtube"' },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                {
                  name: "ref",
                  value: { type: "raw", code: "ref as React.Ref<HTMLIFrameElement>" },
                  frameworks: ["react"],
                },
                { name: "data-slot", value: { type: "literal", value: "video" } },
              ],
            },
          ],
        },
      ],
    },
  ],
};
