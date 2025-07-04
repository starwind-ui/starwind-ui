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
- Defines core component props and types
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

#### 3. Export File (`index.ts`)

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
