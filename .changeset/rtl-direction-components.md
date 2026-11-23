---
"@starwind-ui/runtime": minor
"@starwind-ui/astro": minor
"@starwind-ui/react": minor
"@starwind-ui/vue": minor
"@starwind-ui/svelte": minor
---

Components now follow HTML direction in Astro, React, Vue 3.5 and Svelte 5.29+. In RTL, horizontal arrow keys, Slider, Carousel and popups follow the direction of the element that contains the component. A popup that renders in a portal copies that direction while it is open. `side="left"` and `side="right"` still mean the physical side. Form values do not change with direction.

Primitive Menu submenus still default to `side="bottom"`. Styled Dropdown and Context Menu submenus now open toward the reading end.

Slider now sets `inset-inline-start` on the thumb and indicator in place of `left`. If your CSS animates or overrides `left` on these parts, or a script reads `style.left`, use `inset-inline-start`.

Set `dir` on the page or on the element that contains the component. The Styled stylesheet steps are in the `starwind` release notes and the [RTL guide](https://starwind.dev/docs/getting-started/rtl/).

In RTL apps, change padding meant for the reading edge to logical utilities, such as `pl-6` to `ps-6`. Remove your own RTL workarounds that the components now handle.

Components read the direction when the user interacts with them. If your app changes `dir` after the page loads, run `document.dispatchEvent(new Event("starwind:direction-change"))` after the change. The components on the page then update, open popups included. Without the event, each component uses the new direction at its next interaction.

Thanks @SalahAdDin for reporting [#283](https://github.com/starwind-ui/starwind-ui/issues/283) and starting this work in [#290](https://github.com/starwind-ui/starwind-ui/pull/290).
