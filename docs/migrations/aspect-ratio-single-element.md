# Update AspectRatio to one element

AspectRatio now renders one element in Astro, React, Vue 3.5, and Svelte 5.
The element owns `data-slot="aspect-ratio"`, `relative aspect-(--ratio)`, and the `--ratio` style
variable. The default ratio is `1`. Use `ratio={16 / 9}` for landscape media or `ratio={3 / 4}` for
portrait media. Vue uses `:ratio="16 / 9"`.

This is a breaking Styled component update. Update copied component files together with their
`variants.ts` and `index.ts` files. The CLI package receives a patch for delivery.

## Update selectors and variant imports

The `aspect-ratio-wrapper` slot and `aspectRatioWrapper` variant export have been removed.
Point selectors at the single element:

```css
/* Before */
[data-slot="aspect-ratio-wrapper"] {
  max-width: 32rem;
}
[data-slot="aspect-ratio-wrapper"] > [data-slot="aspect-ratio"] img {
  object-fit: cover;
}

/* After */
[data-slot="aspect-ratio"] {
  max-width: 32rem;
}
[data-slot="aspect-ratio"] > img {
  object-fit: cover;
}
```

Replace direct variant imports and the variant collection member:

```ts
// Before
import { aspectRatioWrapper } from "./aspect-ratio/variants";
const classes = AspectRatioVariants.aspectRatioWrapper();

// After
import { aspectRatio } from "./aspect-ratio/variants";
const classes = AspectRatioVariants.aspectRatio();
```

The component now owns its `data-slot` value. Use a separate `data-*` attribute for a caller hook; a caller-supplied `data-slot` is ignored.

Keep `AspectRatio` imports as they are. Components, event handlers and refs now refer to the element
that controls the ratio. React `ref` and Svelte `bind:ref` target that DOM element. A Vue component
ref uses its native `$el` to reach the element. Astro renders its attributes on the server.

## Move layout props to the ratio element

Consumer classes, attributes and styles now apply directly to the ratio element. Remove CSS that
expects an absolute inner element. Put width on AspectRatio when it must control its own size:

```astro
<!-- Before: the extra host controls the old wrapper width. -->
<div class="w-80">
  <AspectRatio ratio={16 / 9} class="overflow-hidden rounded-lg">
    <img src="/cover.jpg" alt="Mountain lake" class="h-full w-full object-cover" />
  </AspectRatio>
</div>

<!-- After: the ratio element owns width and optional clipping. -->
<AspectRatio ratio={16 / 9} class="w-80 overflow-hidden rounded-lg">
  <img src="/cover.jpg" alt="Mountain lake" class="h-full w-full object-cover" />
  <span class="absolute bottom-2 left-2">Mountain lake</span>
</AspectRatio>
```

React uses `className`. Svelte accepts `class`, and Vue uses `class` with `:ratio`.
Use `as="figure"`, `as="article"`, or another native HTML tag to choose the element. Omit children
when you select a void element such as `img`. Supply its native attributes through the component.
Vue and Svelte skip children for void tags.

The default `div` fills its host width in normal block flow. The old wrapper always applied
`w-full`. In flex or grid parents that do not stretch their children, such as `flex flex-col
items-center`, `grid place-items-center`, or flex rows, add `w-full` or an explicit width.
An overlay-only element can collapse to zero size without that width, and an image can use its
natural width. Inline and replaced tags can also need a display utility.

```astro
<div class="flex w-80 flex-col items-center">
  <AspectRatio ratio={16 / 9} class="w-full">
    <span class="absolute inset-0">Overlay inside a full-width frame</span>
  </AspectRatio>
</div>
```

Both explicit width and height take priority over the preferred aspect ratio.

Padding and borders now belong to the ratio box. With Tailwind's border-box reset, they consume
space inside its measured size. For edge-to-edge media with a separate padded caption, keep the
padding on a sibling or a caller-owned host:

```astro
<div class="rounded-lg border p-4">
  <AspectRatio ratio={16 / 9} class="overflow-hidden rounded-md">
    <img src="/cover.jpg" alt="Mountain lake" class="h-full w-full object-cover" />
  </AspectRatio>
  <p class="mt-3">Mountain lake</p>
</div>
```

## Styles and content growth

Caller styles merge after the default `--ratio`. Other declarations remain intact. A caller's
`--ratio` wins over `ratio`, and an explicit `aspect-ratio` declaration wins over the class rule.
When that override is removed, the current `ratio` prop applies again. Supported style values use
each framework's native API: Astro string or object, React object, Vue string/object/array, and
Svelte string.

```tsx
<AspectRatio ratio={16 / 9} style={{ width: 320, "--ratio": 3 / 4 } as React.CSSProperties} />
```

Native CSS supplies a preferred ratio. At width `320px`, an empty `16 / 9` box measures `180px`
high. In-flow content with height `300px` can increase its height to `300px`. This also applies
when a caller adds `relative`. Use `h-full w-full object-cover` for media and absolute positioning
for overlays. Add `overflow-hidden` to clip tall content and keep the preferred ratio, or set an explicit height
when your layout requires a fixed height. AspectRatio adds no clipping by default.

## Legacy Astro demo

The legacy copy under `apps/demo/src/components/starwind/aspect-ratio` uses the same single element
as the generated Astro component. Its existing source has no `starwind-*` class hook. Its obsolete
wrapper slot and variant export are removed with this migration. Other legacy components keep
their current hooks.
