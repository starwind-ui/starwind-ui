# Vue Framework Adapter

This is the internally registered, non-shipping Vue Framework Adapter home. It generates the
private `@starwind-ui/vue` package at version `0.0.0`. Every public-support flag remains disabled.

`inventory.ts` is the authoritative inventory. The current Primitive surface contains Accordion,
Alert Dialog, Avatar, Button, Carousel, Checkbox, Checkbox Group, Collapsible, Color Picker,
Combobox, Context Menu, Dialog, Drawer, Dropzone, Field, Fieldset, Form, Input, Input OTP, Menu,
Navigation Menu, Popover, Preview Card, Progress, Radio, Radio Group, Scroll Area, Select, Sidebar,
Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip, and the manual Theme facade.

The complete private Styled surface contains 54 portable roots exactly once: Accordion, Alert
Dialog, Avatar, Button, Carousel, Checkbox, Checkbox Group, Collapsible, Combobox, Color Picker,
Context Menu, Dialog, Dropzone, Dropdown, Field, Sheet, Form, Hover Card, Input, Input OTP,
Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Sidebar, Slider,
Switch, Tabs, Theme Toggle, Toast, Toggle, Toggle Group, Tooltip, Alert, Aspect Ratio, Badge,
Breadcrumb, Button Group, Card, Input Group, Item, Kbd, Label, Native Select, Pagination, Prose,
Skeleton, Spinner, Table, Textarea, and Video. Image is the sole excluded Styled contract because it
is Astro-only.

Tooltip and Preview Card share the timed-floating projection. Menu uses the composite-menu
projection. Context Menu composes that menu seam with anchored context facts. Navigation Menu uses
the shared-viewport projection. Combobox uses the editable-collection projection. Their Styled
names map to Tooltip, Hover Card, Dropdown, Context Menu, Navigation Menu, and Combobox.

Generated Primitive adapters and Styled components are the normative evidence. Older Menu,
Navigation Menu, Combobox, and Toggle tracer artifacts remain historical, non-normative review
fixtures. They do not define target support or package output. The legacy Collapsible printer
fixture remains isolated printer-unit evidence.

The target may create deterministic private package and Vue demo output. It must not create CLI
registry entries, public demo dependencies, install docs, release configuration, or public Vue
support claims.

`public-contract.ts` is the typed, target-local source of truth for Vue 3.5 public naming,
composition, lifecycle, SSR, hydration, and Teleport projection. It records how framework-neutral
Runtime Adapter Contract and output-model facts become Vue semantics without adding those semantics
to shared contracts. The repository's accepted Vue adapter decision keeps that policy durable while
this target remains quarantined.

The lists above are exact private subsets. Run `pnpm runtime:generate:vue:test` for isolated
path-and-byte generation, compiler coverage, and exact inventory checks. Run `pnpm vue:verify` for
package typechecking, source and browser tests, built hydration, every-export SSR, and release-like
distribution checks. Run `pnpm vue-demo:smoke` for production behavior, remount and cleanup
accounting, plus light and dark visual review. Existing Solid tracers are frozen comparisons rather
than an active target.

## Portable Styled Closure Verdict

Order 11 closed with a PROCEED depth verdict on 2026-08-06. The Styled Output Model and registered
target `styled` capability form the small interface. Contracts own component composition and shared
render facts. This target owns Vue props, attrs, slots, refs, SFC syntax, and deterministic output.

The exact 54-contract inventory, Image exclusion, component-identity scans, deletion and byte
parity, typechecking, SSR, hydration, browser smoke, visual review, private quarantine, protected
Astro and React output, bundle guard, and current size guard pass. No closure component adds
Vue-local behavior, lifecycle, a component printer, or handwritten SFC input. Vue remains private
and non-shipping while order 12 owns CLI and registry work.

Before expanding this tracer, read `docs/portable-runtime/framework-renderer-authoring.md` for the
target-local renderer fragment/helper pattern and public-support guardrails.

## Author Checklist

- Keep Vue syntax, props, refs, emits, slots, provide/inject, Teleport, helper files, output
  writing, exports, and lifecycle projection inside this folder.
- Project models and detailed events through `public-contract.ts`; do not invent component-local
  aliases or React callback props.
- Keep Runtime construction in mounted lifecycle, preserve browser-free deterministic server
  rendering, and keep Teleport disabled until the owning root mounts.
- Reuse the same high-level target adapter object shape and helper responsibilities as Astro and
  React.
- Keep Vue registered through the central target registry with its supported subset and public
  support flags explicit. Expanding that subset requires its own approved component-cohort work.
- Keep Runtime behavior in `packages/runtime`; this folder only projects Vue syntax onto Runtime
  controllers.
