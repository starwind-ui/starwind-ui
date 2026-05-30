---
name: starwind-components
description: Build, update, or review Starwind UI Astro components in this monorepo. Use when adding a component under packages/core/src/components, mirroring it into apps/demo/src/components/starwind, changing component variants, wiring interactive component scripts, updating registry metadata, or aligning a component with current Starwind conventions.
---

# Starwind Components

## Start Here

Treat `packages/core/src/components` as canonical. Use `apps/demo/src/components/starwind` as the copied/demo surface and keep it in sync when the task touches the demo app.

Before creating or changing a component:

- Read the closest local components first. For primitives, inspect simple peers such as `button`, `badge`, `item`, or `card`. For multi-part or interactive components, inspect peers such as `dropdown`, `popover`, `dialog`, `select`, `tooltip`, `scroll-area`, or `color-picker`.
- Read `packages/core/src/registry.json` before changing dependencies, file dependencies, or published component versions.
- If the component has behavior similar to a Base UI primitive, inspect the current Base UI source for design hints before writing the script. Start from the package index, for example `https://github.com/mui/base-ui/blob/master/packages/react/src/context-menu/index.ts`, then follow the referenced root/trigger/content/item files. Translate behavior ideas to Astro and vanilla browser scripts; do not copy React-specific implementation structure.
- When the task asks about external library, framework, SDK, API, CLI, or cloud-service usage, follow the project docs rule and fetch current docs through Context7 first.

## File Shape

Use this directory shape unless the local peer component shows a better reason:

```text
packages/core/src/components/<component-name>/
+-- <ComponentName>.astro
+-- <ComponentName><Part>.astro
+-- variants.ts
+-- index.ts
`-- optional support files, such as <ComponentName>Types.ts or <component>-script.ts
```

Use `variants.ts` for every Tailwind Variants definition. Do not define `tv()` blocks inside `.astro` files.

Mirror component files into `apps/demo/src/components/starwind/<component-name>` when the demo app needs the component or when updating an existing component that is already mirrored there.

## Variants

In `variants.ts`:

- Import `tv` from `tailwind-variants`.
- Export one lower-camel-case variant function per styled slot, such as `dropdownContent`, `dialogTitle`, or `selectTrigger`.
- Include stable Starwind class hooks such as `starwind-dropdown-content` when scripts or nested selectors depend on them.
- Put state styling on `data-*` and ARIA selectors, especially `data-state`, `data-disabled`, `aria-selected`, and `aria-invalid`.
- Use `tw-animate-css` classes for open/close transitions, commonly `animate-in`, `animate-out`, `fade-in`, `fade-out`, `zoom-in-95`, `zoom-out-95`, and side-aware slide classes.
- Export variant collections from `index.ts` as `<ComponentName>Variants`.

Consume variants from components with `class={slotVariant({ variant, size, class: className })}` or the relevant prop names. Use `VariantProps<typeof variantFn>` from `tailwind-variants` when variant props should be inferred from a local variant function.

## Astro Props

Use Astro-native typing:

```astro
---
import type { HTMLAttributes } from "astro/types";
import type { VariantProps } from "tailwind-variants";

import { button } from "./variants";

type Props = HTMLAttributes<"button"> & VariantProps<typeof button>;

const { variant, size, class: className, ...rest } = Astro.props;
---
```

Use these patterns as needed:

- `HTMLAttributes<"div">`, `HTMLAttributes<"button">`, etc. for fixed elements.
- `ComponentProps<typeof ExistingComponent>` when wrapping another Starwind component, as `context-menu` wraps `dropdown`.
- `HTMLTag` and `Polymorphic` for `as={Tag}` components.
- `Omit<...>` when Starwind owns a native prop such as `type`, `role`, or a mode flag.

Avoid broad index signatures and `any` rest props. Use `children: any` only when the current Astro/component pattern requires an explicit children prop.

## Markup Contract

Preserve a stable DOM contract:

- Every public part gets a `data-slot="<component-part>"`.
- Interactive parts also get Starwind class hooks when scripts query by class, such as `starwind-dialog-trigger`.
- Keep state on attributes that CSS and scripts can share: `data-state`, `data-side`, `data-align`, `data-disabled`, `data-active`, and ARIA attributes.
- For fixed semantic elements, follow the nearby component's attribute order. Many current fixed elements keep `data-slot` after `{...rest}` so the slot stays stable.
- For dynamic or polymorphic `<Tag>` components, current components often place `data-slot` before `{...rest}` to allow deliberate caller overrides. Check a peer before choosing.
- Do not reorder existing `data-slot` or spread placement casually; this has affected component behavior before.

For `asChild` triggers and close buttons, render a simple wrapper when `asChild` and a default slot are present, mark it with `data-as-child`, and have the root script resolve `firstElementChild` as the real interactive element. Otherwise render the semantic element directly with the correct `type`, role, ARIA, and disabled behavior.

## Script Pattern

Keep browser behavior in the root `.astro` component unless a local peer uses a separate script file for a specific reason.

For interactive components:

- Implement a handler class, such as `DropdownHandler`, with `setupAccessibility`, `setupEvents`, state methods, and `destroy` when cleanup is needed.
- Make initialization idempotent with `WeakMap` or `Map` instance tracking.
- Use `AbortController` for listeners when global, portaled, or long-lived listeners need deterministic cleanup.
- Clear timers, observers, portaled nodes, and global state in `destroy`.
- Initialize immediately, listen for `astro:after-swap`, and listen for `starwind:init`.
- Also listen for `astro:before-swap` and destroy all instances when the component portals content, attaches global listeners, uses observers, or owns timers that can outlive the DOM.
- Use own-element queries for nested components: find parts whose closest root is the current root.
- Prefer custom events namespaced as `starwind-<component>:<action>` for programmatic APIs and cross-part coordination.
- Keep keyboard behavior, focus return, and ARIA state in sync with the visual `data-state`.

For floating content, reuse `@/lib/utils/starwind/positioning` and add `positioning.ts` to `fileDependencies` in the registry. Follow `dropdown` and `popover` for `side`, `align`, `sideOffset`, transform origin, collision handling, portaling, scroll/resize updates, and dialog/sheet `[data-floating-root]` support.

## Exports

`index.ts` should:

- Import every `.astro` part.
- Import variant functions from `./variants`.
- Export a `<ComponentName>Variants` object.
- Export named component parts and relevant public types.
- Default-export a namespace object with shadcn-like names: `Root`, `Trigger`, `Content`, `Item`, `Label`, etc.

Example:

```ts
import Dropdown from "./Dropdown.astro";
import DropdownContent from "./DropdownContent.astro";
import { dropdownContent, dropdownTrigger } from "./variants";

const DropdownVariants = { dropdownContent, dropdownTrigger };

export { Dropdown, DropdownContent, DropdownVariants };

export default {
  Root: Dropdown,
  Content: DropdownContent,
};
```

## Registry And Checks

When adding or changing a public component:

- Update `packages/core/src/registry.json` with version, npm dependencies, Starwind component dependencies, and `fileDependencies`.
- Use Starwind dependencies such as `@starwind-ui/core/dropdown@^2.0.0` when wrapping/reusing another component.
- Add a changeset when preparing contribution-ready package changes.
- Run the narrowest useful checks. Prefer `pnpm core:build` for core component packaging, `pnpm demo:build` when mirrored demo files or examples change, and `pnpm test:run` only when tests are relevant.
