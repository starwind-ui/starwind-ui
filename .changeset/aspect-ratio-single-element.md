---
"starwind": patch
---

AspectRatio now renders one element with a native CSS aspect ratio in Astro, React, Vue, and Svelte. The default ratio remains square. Classes, styles, attributes and refs now reach the element that controls the ratio. Tall in-flow content can grow beyond the preferred ratio.

Update copied component files and replace `aspect-ratio-wrapper` selectors and `aspectRatioWrapper` imports with `aspect-ratio` and `aspectRatio`. Review width, padding and border placement. See the [migration guide](https://github.com/starwind-ui/starwind-ui/blob/main/docs/migrations/aspect-ratio-single-element.md) for examples.

In React, the `as` element now sets the accepted props, so `as="img"` takes `src` and `as="a"` takes `href`. Svelte AspectRatio gets the same types. If a React wrapper types its props with `ComponentProps<typeof AspectRatio>`, use `AspectRatioProps` instead. In Svelte, if you spread typed props next to an `as` that is not `div`, type them as `AspectRatioProps<"tag">`, for example `AspectRatioProps<"img">`.
