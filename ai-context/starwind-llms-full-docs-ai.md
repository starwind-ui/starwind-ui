# Starwind UI - llms-full.md Documentation Pattern Guide

> This document serves as a reference for documenting new components in the llms-full.md file. It analyzes the existing documentation patterns to ensure consistency when adding new components.

## File Structure Overview

The llms-full.md file follows this hierarchical structure:

1. **File Header** - Brief description of Starwind UI
2. **Installation Section** - Prerequisites, setup instructions, CLI usage
3. **Component Usage Pattern** - General import and usage pattern
4. **Available Components** - Bulleted list with links to docs
5. **Component Architecture Patterns** - Examples of compound component patterns
6. **Common Props and Patterns** - Variant props, size props, CSS variables, dark mode
7. **CLI Commands** - init, add, update, remove commands
8. **Best Practices** - Guidelines for using Starwind UI
9. **Detailed Component Reference** - Individual component documentation (MAIN SECTION)
10. **Examples** - Complete implementation examples
11. **Resources** - Links to website and docs

## Detailed Component Reference Pattern

This is the primary section where individual components are documented. Each component follows a consistent structure:

### Component Entry Structure

```markdown
### ComponentName

- **Documentation**: https://starwind.dev/docs/components/component-name
- **Import pattern**: `import { Component, SubComponent1, SubComponent2 } from "@/components/starwind/component-name";`
- **Key props**: (OPTIONAL)
  - `propName`: type - Description (default: value)
  - For compound components, organize props by subcomponent:
    - `<SubComponent>`:
      - `propName`: type - Description
- **Description**: (OPTIONAL) Brief description of the component or its purpose
- **Example usage**:

\`\`\`astro
---
import { Component, SubComponents } from "@/components/starwind/component-name";
---

<Component>
  <!-- Usage example -->
</Component>
\`\`\`
```

### Pattern Analysis by Component Type

#### Simple Components (e.g., Badge, Button, Input, Label)
- **Documentation**: Required
- **Import pattern**: Required (single import)
- **Key props**: Required
  - List common props like `variant`, `size`
  - Include type unions with all possible values
  - Mention defaults
  - Note "All standard HTML attributes" when applicable
- **Description**: Optional (usually omitted for simple components)
- **Example usage**: Required (brief, 1-3 line example)

**Example:**
```markdown
### Badge

- **Documentation**: https://starwind.dev/docs/components/badge
- **Import pattern**: `import { Badge } from "@/components/starwind/badge";`
- **Key props**:
  - `variant`: "default" | "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
- **Example usage**:

\`\`\`astro
---
import { Badge } from "@/components/starwind/badge";
---

<Badge variant="info">New</Badge>
\`\`\`
```

#### Compound Components (e.g., Accordion, Card, Dialog, Dropdown, Tabs)
- **Documentation**: Required
- **Import pattern**: Required (all subcomponents listed)
- **Key props**: Optional but recommended for complex components
  - Organize by subcomponent using `<ComponentName>:` prefix
  - List the most important/unique props
  - Can use "See the documentation for the props for each component" for very complex components
- **Description**: Optional (add when component needs context)
- **Example usage**: Required (complete working example showing all key subcomponents)

**Example:**
```markdown
### Card

- **Documentation**: https://starwind.dev/docs/components/card
- **Import pattern**: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/starwind/card";`
- **Key props**:
  - Standard HTML attributes for `<div>` elements
- **Example usage**:

\`\`\`astro
---
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/starwind/card";
import { Button } from "@/components/starwind/button";
---

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card Content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
\`\`\`
```

#### Complex Interactive Components (e.g., Carousel, Select, Sheet, Tooltip)
- **Documentation**: Required
- **Import pattern**: Required (all subcomponents)
- **Description**: Recommended (helps explain unique features)
- **Key props**: Required (essential for understanding configuration)
  - Group by subcomponent
  - Include type definitions
  - Explain special props (e.g., `asChild`, animation options)
  - Note defaults
- **Example usage**: Required (comprehensive example, sometimes multiple examples)

**Example:**
```markdown
### Sheet

- **Documentation**: https://starwind.dev/docs/components/sheet
- **Description**: A slide-out panel component that extends from any edge of the screen with smooth animations. Built on top of the Dialog component.
- **Import pattern**: `import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/starwind/sheet";`
- **Key props**:
  - `<Sheet>` (Root component)
    - Inherits all props from the Dialog component
  - `<SheetTrigger>` (Button that opens the sheet)
    - `asChild?: boolean` - When true, renders the child element instead of a button
    - `for?: string` - Optional ID of the sheet to trigger
  - `<SheetContent>` (The slide-out panel container)
    - `side?: "top" | "right" | "bottom" | "left"` - Side of the screen to slide out from (default: "right")
  - `<SheetClose>` (Button that closes the sheet)
    - `asChild?: boolean` - When true, renders the child element instead of a button
- **Example usage**:

\`\`\`astro
<!-- Complete examples with multiple variations -->
\`\`\`
```

## Key Prop Documentation Standards

### Prop Entry Format
```
- `propName`: type - Description (default: value)
```

### Type Notation
- String literals: Use `"value1" | "value2" | "value3"`
- Boolean: `boolean`
- Number: `number`
- String: `string`
- Objects: Use TypeScript-like notation (e.g., `EmblaOptionsType`)
- Optional: Add `?` after prop name (e.g., `propName?:`)

### Common Prop Patterns

**Variant Prop** (used in Alert, Avatar, Badge, Button, Checkbox, Progress, Radio, Switch):
```markdown
- `variant`: "default" | "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "error" (default: "default")
```
Note: Not all components support all variants. Adjust list accordingly.

**Size Prop** (used in Avatar, Badge, Button, Checkbox, Input, Label, Pagination, Radio, Switch, Textarea):
```markdown
- `size`: "sm" | "md" | "lg" (default: "md")
```
Note: Button also has `"icon"` size option.

**asChild Prop** (used in AlertDialog, Dialog, Dropdown, Sheet triggers/buttons):
```markdown
- `asChild?: boolean` - When true, renders the child element instead of a button
```

**Positioning Props** (used in Dropdown, Select, Tooltip):
```markdown
- `side`: "top" | "right" | "bottom" | "left" (default: varies)
- `align`: "start" | "center" | "end" (default: "center")
- `sideOffset`: number - Offset distance in pixels (default: 4)
```

**Animation Props** (used in Select, Tooltip):
```markdown
- `animationDuration`: number - Duration in ms of animation (default: value)
```

## Import Pattern Standards

### Single Component
```markdown
- **Import pattern**: `import { ComponentName } from "@/components/starwind/component-name";`
```

### Compound Component (format for readability)
```markdown
- **Import pattern**: `import { Parent, Child1, Child2, Child3 } from "@/components/starwind/component-name";`
```

When there are many subcomponents (5+), they can be listed in a more organized way in the example usage section with multi-line imports.

## Example Usage Standards

### Code Block Format
Always use the `astro` language identifier:
```markdown
\`\`\`astro
---
import { Component } from "@/components/starwind/component";
---

<Component>Content</Component>
\`\`\`
```

### Import Organization in Examples
1. List imports in alphabetical order by component name
2. Use multi-line imports for readability when importing multiple items:
```astro
---
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/starwind/accordion";
---
```

### Example Content Guidelines
- **Simple components**: 1-3 line example showing basic usage
- **Compound components**: Complete working example showing all major subcomponents
- **Complex components**: May include multiple examples showing different configurations
- **Always use realistic data**: Not "foo/bar" but actual realistic examples
- **Show best practices**: Proper accessibility attributes, semantic structure

### Special Example Patterns

**Comment Annotations**:
```astro
<!-- Avatar and text skeleton loading state example -->
<Skeleton class="h-12 w-12 rounded-full" />
```

**Alternative Variations**:
```astro
<Progress value={50} />

<!-- Indeterminate state (loading) -->
<Progress />

<!-- With variant -->
<Progress value={75} variant="success" />
```

**Multiple Complete Examples** (for components like Sheet):
```astro
<!-- First complete example -->
<Sheet>...</Sheet>

<!-- Sheet with different sides -->
<Sheet>
  <!-- Content -->
</Sheet>
```

## Alphabetical Ordering

Components in the "Detailed Component Reference" section are ordered alphabetically:
1. Accordion
2. Alert
3. Alert Dialog
4. Aspect Ratio (if exists)
5. Avatar
6. Badge
7. Breadcrumb
8. Button
9. Card
10. Carousel
11. Checkbox
12. Dialog
13. Dropdown
14. Dropzone
15. Input
16. Item (if exists)
17. Label
18. Pagination
19. Progress
20. Radio Group
21. Select
22. Separator (if exists)
23. Sheet
24. Skeleton
25. Spinner (if exists)
26. Switch
27. Table
28. Tabs
29. Textarea
30. Tooltip

## Available Components List Pattern

In the "Available Components" section, list all components with links:
```markdown
- [Component Name](https://starwind.dev/docs/components/component-name)
```

Maintain alphabetical order.

## Adding a New Component Checklist

When adding a new component to llms-full.md:

### 1. Add to Available Components List
- [ ] Add link in alphabetical order
- [ ] Use format: `- [ComponentName](https://starwind.dev/docs/components/component-name)`

### 2. Add to Detailed Component Reference
- [ ] Insert in alphabetical position
- [ ] Add heading: `### ComponentName`
- [ ] Add documentation link
- [ ] Add import pattern with all subcomponents
- [ ] Determine if key props are needed:
  - Simple component: Include variant/size/common props
  - Compound component: Include props organized by subcomponent
  - Complex component: Include all essential configuration props
- [ ] Add description (if component needs context)
- [ ] Add example usage with:
  - Complete import statement
  - Working example showing all major features
  - Realistic content/data
  - Proper formatting (multi-line imports if needed)
  - Comments for variations (if applicable)

### 3. Consider Component Architecture Pattern
If the component introduces a new architectural pattern:
- [ ] Add example to "Component Architecture Patterns" section

### 4. Update CLI Add Command Example (if relevant)
If the component is commonly used:
- [ ] Consider adding it to example CLI commands

## Special Considerations

### Components with Multiple Variants
Some components like Sheet show multiple usage patterns. Include:
1. Primary/default usage
2. Alternative configurations (e.g., different sides)
3. Use comments to separate examples

### Components with State Management
For components with internal state (Carousel, Tabs, Accordion):
- Document state-related props (defaultValue, value, etc.)
- Show examples of controlled vs uncontrolled usage when relevant

### Components with External Dependencies
For components using external libraries (e.g., Carousel using Embla):
- Mention the dependency if relevant
- Document special configuration objects (e.g., `opts?: EmblaOptionsType`)

### Form Components
For form-related components (Input, Textarea, Checkbox, Radio, Select):
- Always mention "All standard HTML attributes" support
- Show examples with form integration when relevant
- Include required accessibility attributes (id, name, label associations)

### Components with Animations
For animated components:
- Document animation-related props
- Mention default timing/duration
- Show how to customize animations

## Writing Style Guidelines

### Tone
- Concise and technical
- Descriptive but not verbose
- Focus on practical usage

### Descriptions
- Optional for simple components
- Brief (1-2 sentences max) for complex components
- Explain the "what" and "why", not the "how" (that's what examples are for)

### Prop Descriptions
- Clear and specific
- Include type information
- Always note defaults
- Mention special behaviors

### Examples
- Must be complete and runnable
- Use realistic data
- Follow Starwind/Astro best practices
- Maintain consistent formatting

## Version Compatibility Notes

If a component requires specific versions or has compatibility considerations:
- Note in the description
- Document any breaking changes
- Mention prerequisites

## Cross-References

When components are commonly used together:
- Import them in examples (e.g., Button in Card example)
- Show realistic integration patterns
- Mention related components in descriptions when helpful

## Formatting Consistency

### Markdown Headers
- Use `###` for component names
- Use `####` for subsections (rare, only if needed)

### Code Formatting
- Use backticks for inline code: `ComponentName`
- Use fenced code blocks with `astro` for examples
- Use consistent indentation (2 spaces)

### Lists
- Use `-` for unordered lists
- Maintain consistent indentation
- Use nested lists for hierarchical prop documentation

### Links
- Always use full URLs for documentation links
- Format: `[Text](https://starwind.dev/docs/components/component-name)`

## Template for Quick Reference

```markdown
### ComponentName

- **Documentation**: https://starwind.dev/docs/components/component-name
- **Import pattern**: `import { Component, Sub1, Sub2 } from "@/components/starwind/component-name";`
- **Key props**:
  - `variant`: "default" | "other" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
- **Example usage**:

\`\`\`astro
---
import { Component } from "@/components/starwind/component-name";
---

<Component variant="default">
  Content
</Component>
\`\`\`
```

## Common Mistakes to Avoid

1. ❌ Forgetting to maintain alphabetical order
2. ❌ Inconsistent prop type notation
3. ❌ Missing defaults for props
4. ❌ Incomplete import statements in examples
5. ❌ Using fake/placeholder content instead of realistic examples
6. ❌ Not documenting essential props for complex components
7. ❌ Inconsistent formatting in code blocks
8. ❌ Breaking the established bullet point format
9. ❌ Adding unnecessary descriptions to simple components
10. ❌ Missing the documentation link

## Final Notes

- Consistency is key - follow existing patterns closely
- When in doubt, reference similar components
- Simple is better - don't over-document
- Examples should work out of the box
- Keep the AI/LLM audience in mind - this is for code generation context
