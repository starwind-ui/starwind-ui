---
trigger: glob
globs: { apps/demo/src/components/*, packages/core/src/components/* }
---

# Starwind UI Component Structure

## Component Organization Pattern

Based on analysis of the `tooltip` component, this document outlines the standard component structure used throughout the Starwind UI library. The component naming conventions and styling approach are inspired by and based on shadcn/ui.

### Directory Structure

```
packages/core/src/components/[component-name]/
├── index.ts                 # Main export file
├── [ComponentName].astro    # Root/main component
└── [ComponentName][Part].astro  # Subcomponents
```

### Component Files

#### 1. Root Component (`[ComponentName].astro`)

- Contains the main wrapper element
- Defines core component props and types using proper TypeScript patterns
- Includes client-side JavaScript for functionality (in `<script>` tags)
- Uses Tailwind Variants (`tv`) for styling
- Sets up event handlers and accessibility attributes
- Contains complex logic for component behavior

#### 2. Child Components (`[ComponentName][Part].astro`)

- Each serves a specific role within the component system
- Handles their own props and styling
- Uses slots for content insertion
- Minimal and focused on a single responsibility
- May contain their own Tailwind Variants configurations

#### 3. Interactive Components (Trigger/Close buttons)

- Should implement `asChild` pattern for flexibility
- When `asChild={false}` (default): renders as proper semantic element (`<button>`)
- When `asChild={true}`: renders as wrapper `<div>` allowing child element to be interactive
- Must check for slot content before using asChild mode

#### 4. Export File (`index.ts`)

- Imports all component parts
- Exports named exports for individual pieces
- Provides a default export with a namespaced object structure:
  ```typescript
  export default {
    Root: MainComponent,
    Part1: ComponentPart1,
    Part2: ComponentPart2,
  };
  ```
- This enables both direct imports and namespaced usage

### Styling Approach

- Uses Tailwind Variants (`tv()`) for component styling
- Follows a consistent class naming pattern with `starwind-[component-name]` prefix
- Component state managed via `data-*` attributes
- Uses CSS custom properties for dynamic values
- Includes accessibility attributes and roles
- Animations are implemented using the "tw-animate-css" library classes (e.g., `animate-in`, `fade-in`, `zoom-in-95`)
- Icons are imported from Tabler Icons package and used directly as components:

  ```astro
  import ChevronDown from "@tabler/icons/outline/chevron-down.svg"; // Later in the markup:
  <ChevronDown class="size-4 opacity-50" />
  ```

### Client-side Behavior

- JavaScript is included within the root component in `<script>` tags
- Uses classes for encapsulating component logic
- Handles component initialization, event listeners, and state management
- Properly cleans up event listeners and timers
- Supports Astro's view transitions with `astro:after-swap` events

### TypeScript Patterns & Best Practices

### ❌ **AVOID** - React-style TypeScript patterns

```typescript
// DON'T use these patterns in Astro components:
export interface Props {
  class?: string;
  [key: string]: any; // ❌ Never use this
}

const { class: className, ...props } = Astro.props;
```

### ✅ **CORRECT** - Astro TypeScript patterns

```typescript
// Use proper HTMLAttributes with specific element types:
import type { HTMLAttributes } from "astro/types";

type Props = HTMLAttributes<"div"> & {
  // Add component-specific props here
  variant?: "default" | "secondary";
};

const { class: className, variant = "default", ...rest } = Astro.props;
```

### Component-Specific Type Examples

```typescript
// For different HTML elements:
type Props = HTMLAttributes<"button"> & { asChild?: boolean }; // Buttons
type Props = HTMLAttributes<"div"> & { side?: "left" | "right" }; // Containers
type Props = HTMLAttributes<"h2">; // Headings
type Props = HTMLAttributes<"p">; // Paragraphs
```

### AsChild Pattern Implementation

```astro
---
import type { HTMLAttributes } from "astro/types";

type Props = HTMLAttributes<"button"> & {
  asChild?: boolean;
};

const { class: className, asChild = false, ...rest } = Astro.props;

let hasChildren = false;
if (Astro.slots.has("default")) {
  hasChildren = true;
}
---

{
  asChild && hasChildren ? (
    <div class:list={["component-class", className]} data-slot="component-slot" data-as-child>
      <slot />
    </div>
  ) : (
    <button
      type="button"
      class:list={["component-class", className]}
      data-slot="component-slot"
      {...rest}
    >
      <slot />
    </button>
  )
}
```

### Usage Examples

Components can be imported and used in two ways:

1. **Namespaced approach**:

```astro
---
import Tooltip from "@starwind-ui/core/tooltip";
---

<Tooltip.Root>
  <Tooltip.Trigger>Hover me</Tooltip.Trigger>
  <Tooltip.Content>I'm a tooltip!</Tooltip.Content>
</Tooltip.Root>
```

2. **Direct import approach**:

```astro
---
import { Tooltip, TooltipTrigger, TooltipContent } from "@starwind-ui/core/tooltip";
---

<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>I'm a tooltip!</TooltipContent>
</Tooltip>
```
