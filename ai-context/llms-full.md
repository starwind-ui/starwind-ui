# Starwind UI - AI Reference Guide

> Starwind UI is an open-source component library for Astro projects, styled with Tailwind CSS v4. It provides accessible, customizable components that can be added directly to your projects. The library follows a modular approach where components are added individually to your project via a CLI rather than imported from a package.

## Installation

### Prerequisites

- Astro project
- Tailwind CSS v4
- Node.js

### Setup with CLI (Recommended)

1. Create or use an existing Astro project
2. Configure path aliases in tsconfig.json:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

3. If using pnpm, create a .npmrc file:

```
auto-install-peers=true
node-linker=hoisted
lockfile=true
```

4. Run the CLI to initialize:

```bash
pnpx starwind@latest init
# or
npx starwind@latest init
# or
yarn dlx starwind@latest init
```

5. Import the CSS in your layout:

```astro
---
import "@/styles/starwind.css";
---
```

6. Add components as needed:

```bash
npx starwind@latest add button
```

## Component Usage Pattern

All Starwind components follow a consistent pattern:

1. **Import the components**:

```astro
---
import { ComponentName } from "@/components/starwind/component-name";
---
```

2. **Use the components in your templates**:

```astro
<ComponentName prop="value"> Content </ComponentName>
```

## Available Components

Starwind UI includes the following components:

- [Accordion](https://starwind.dev/docs/components/accordion)
- [Alert](https://starwind.dev/docs/components/alert)
- [Alert Dialog](https://starwind.dev/docs/components/alert-dialog)
- [Aspect Ratio](https://starwind.dev/docs/components/aspect-ratio)
- [Avatar](https://starwind.dev/docs/components/avatar)
- [Badge](https://starwind.dev/docs/components/badge)
- [Breadcrumb](https://starwind.dev/docs/components/breadcrumb)
- [Button](https://starwind.dev/docs/components/button)
- [Card](https://starwind.dev/docs/components/card)
- [Carousel](https://starwind.dev/docs/components/carousel)
- [Checkbox](https://starwind.dev/docs/components/checkbox)
- [Dialog](https://starwind.dev/docs/components/dialog)
- [Dropdown](https://starwind.dev/docs/components/dropdown)
- [Dropzone](https://starwind.dev/docs/components/dropzone)
- [Input](https://starwind.dev/docs/components/input)
- [Item](https://starwind.dev/docs/components/item)
- [Label](https://starwind.dev/docs/components/label)
- [Pagination](https://starwind.dev/docs/components/pagination)
- [Progress](https://starwind.dev/docs/components/progress)
- [Radio Group](https://starwind.dev/docs/components/radio-group)
- [Select](https://starwind.dev/docs/components/select)
- [Separator](https://starwind.dev/docs/components/separator)
- [Sheet](https://starwind.dev/docs/components/sheet)
- [Skeleton](https://starwind.dev/docs/components/skeleton)
- [Spinner](https://starwind.dev/docs/components/spinner)
- [Switch](https://starwind.dev/docs/components/switch)
- [Table](https://starwind.dev/docs/components/table)
- [Tabs](https://starwind.dev/docs/components/tabs)
- [Textarea](https://starwind.dev/docs/components/textarea)
- [Tooltip](https://starwind.dev/docs/components/tooltip)

## Component Architecture Patterns

Most components follow a compound component pattern, where a parent component provides context to specialized child components:

### Example: Tooltip

```astro
<Tooltip>
  <TooltipTrigger>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent> Add to library </TooltipContent>
</Tooltip>
```

### Example: Pagination

```astro
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#">Prev</PaginationPrevious>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#">Next</PaginationNext>
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

## Common Props and Patterns

### Variant Props

Many components support variant props that change their visual appearance:

- `variant="default"` (usually the default)
- `variant="primary"`
- `variant="secondary"`
- `variant="outline"`
- `variant="ghost"`
- `variant="info"`
- `variant="success"`
- `variant="warning"`
- `variant="error"`

### Size Props

Many components support size props:

- `size="sm"`
- `size="md"` (usually the default)
- `size="lg"`

### CSS Variables

Starwind UI uses CSS variables for theming. Key variables include:

**Base**

- `--background`: Default background color
- `--foreground`: Default text color

**Component Colors**

- `--primary` / `--primary-foreground`: Primary action colors
- `--secondary` / `--secondary-foreground`: Secondary action colors
- `--muted` / `--muted-foreground`: Muted UI elements
- `--accent` / `--accent-foreground`: Accent elements like hover states
- `--card` / `--card-foreground`: Card component colors
- `--popover` / `--popover-foreground`: Popover component colors
- `--info` / `--info-foreground`: Information messaging colors
- `--success` / `--success-foreground`: Success messaging colors
- `--warning` / `--warning-foreground`: Warning messaging colors
- `--error` / `--error-foreground`: Error messaging colors

**Utilities**

- `--border`: Border color
- `--input`: Input component border color
- `--outline`: Focus outline color
- `--radius`: Base border radius

### Dark Mode Support

Starwind supports dark mode via a `.dark` class, which changes the CSS variables.

## Command Line Interface

### Initialize Project

```bash
npx starwind@latest init
```

### Add Components

```bash
npx starwind@latest add button card dialog
```

### Update Components

```bash
npx starwind@latest update button
```

### Remove Components

```bash
npx starwind@latest remove button
```

## Best Practices

1. **Accessibility**: Starwind components are built with accessibility in mind. Maintain ARIA attributes and keyboard navigation when customizing.

2. **Compound Components**: Use the compound component pattern (parent + specialized children) when appropriate.

3. **Consistent Importing**: Always import from `@/components/starwind/component-name` to maintain consistency.

4. **Tailwind Integration**: Starwind is designed to work with Tailwind CSS v4, leveraging its utility classes and design tokens.

5. **Theming**: Use the CSS variables system for consistent theming rather than direct color references.

## Detailed Component Reference

### Accordion

- **Documentation**: https://starwind.dev/docs/components
- **Import pattern**: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/starwind/accordion";`
- **Key props**:
  - `type`: "single" | "multiple" (default: "single")
  - `defaultValue`: string - Value of the item that should be open by default
- **Example usage**:

```astro
---
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/starwind/accordion";
---

<Accordion defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is Astro?</AccordionTrigger>
    <AccordionContent>
      Astro is an web framework for building fast, scalable, and secure websites.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Why should I use Astro?</AccordionTrigger>
    <AccordionContent>
      Astro provides a set of features that make it an ideal choice for building fast, scalable, and
      secure websites.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3">
    <AccordionTrigger>How do I get started with Astro?</AccordionTrigger>
    <AccordionContent>
      To get started with Astro, follow the instructions in the documentation.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Alert

- **Documentation**: https://starwind.dev/docs/components/alert
- **Import pattern**: `import { Alert, AlertTitle, AlertDescription } from "@/components/starwind/alert";`
- **Key props**:
  - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
- **Example usage**:

```astro
---
import { Alert, AlertDescription, AlertTitle } from "@/components/starwind/alert";
---

<Alert variant="info">
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    A simple alert with an "AlertTitle" and an "AlertDescription".
  </AlertDescription>
</Alert>
```

### Alert Dialog

- **Documentation**: https://starwind.dev/docs/components/alert-dialog
- **Import pattern**: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/starwind/alert-dialog";`
- **Key props**:
  - `for?: string` - Used on `AlertDialogTrigger`. Optional ID of the dialog to trigger
- **Example usage**:

```astro
---
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/starwind/alert-dialog";
import { Button } from "@/components/starwind/button";
---

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Show Alert Dialog</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account and remove your data
        from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Aspect Ratio

- **Documentation**: https://starwind.dev/docs/components/aspect-ratio
- **Import pattern**: `import { AspectRatio } from "@/components/starwind/aspect-ratio";`
- **Key props**:
  - `ratio`: number - The aspect ratio (e.g., 16/9, 4/3, 1) (default: 1)
  - `as`: HTMLTag - The HTML element to render as (default: "div")
  - All standard HTML attributes for the element specified by the `as` prop
- **Example usage**:

```astro
---
import { AspectRatio } from "@/components/starwind/aspect-ratio";
---

<AspectRatio ratio={16 / 9}>
  <img
    src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
    alt="Photo by Drew Beamer"
    class="rounded-md object-cover w-full h-full"
  />
</AspectRatio>
```

### Avatar

- **Documentation**: https://starwind.dev/docs/components/avatar
- **Import pattern**: `import { Avatar, AvatarImage, AvatarFallback } from "@/components/starwind/avatar";`
- **Key props**:
  - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
- **Example usage**:

```astro
---
import { Avatar, AvatarImage, AvatarFallback } from "@/components/starwind/avatar";
---

<Avatar>
  <AvatarImage src="https://i.pravatar.cc/150?u=a04258a2462d826712d" alt="John Doe" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Badge

- **Documentation**: https://starwind.dev/docs/components/badge
- **Import pattern**: `import { Badge } from "@/components/starwind/badge";`
- **Key props**:
  - `variant`: "default" | "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
- **Example usage**:

```astro
---
import { Badge } from "@/components/starwind/badge";
---

<Badge variant="info">New</Badge>
```

### Breadcrumb

- **Documentation**: https://starwind.dev/docs/components/breadcrumb
- **Import pattern**: `import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "@/components/starwind/breadcrumb";`
- **Example usage**:

```astro
---
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/starwind/breadcrumb";
---

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbEllipsis />
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/products/categories">Categories</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Electronics</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Button

- **Documentation**: https://starwind.dev/docs/components/button
- **Import pattern**: `import { Button } from "@/components/starwind/button";`
- **Key props**:
  - `variant`: "default" | "primary" | "secondary" | "outline" | "ghost" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" | "icon" (default: "md")
- **Example usage**:

```astro
<Button variant="primary" size="md">Click me</Button>
```

### Card

- **Documentation**: https://starwind.dev/docs/components/card
- **Import pattern**: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/starwind/card";`
- **Key props**:
  - Standard HTML attributes for `<div>` elements
- **Example usage**:

```astro
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
```

### Carousel

- **Documentation**: https://starwind.dev/docs/components/carousel
- **Import pattern**: `import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/starwind/carousel";`
- **Key props**:
  - `orientation?: "horizontal" | "vertical"` - Carousel orientation (default: "horizontal")
  - `opts?: EmblaOptionsType` - Embla Carousel options object
  - `autoInit?: boolean` - Whether to automatically initialize the carousel (default: true)
- **Example usage**:

```astro
---
import { Card, CardContent } from "@/components/starwind/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/starwind/carousel";
---

<Carousel opts={{ align: "start" }} class="mx-auto w-full max-w-xs">
  <CarouselContent>
    {
      Array.from({ length: 5 }).map((_, index) => (
        <CarouselItem>
          <div class="p-1">
            <Card>
              <CardContent class="flex aspect-square items-center justify-center p-6">
                <span class="text-4xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </div>
        </CarouselItem>
      ))
    }
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

### Checkbox

- **Documentation**: https://starwind.dev/docs/components/checkbox
- **Import pattern**: `import { Checkbox } from "@/components/starwind/checkbox";`
- **Key props**:
  - `id`: string - The required ID attribute
  - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
  - All standard HTML attributes for <input type="checkbox" /> are supported
- **Example usage**:

```astro
---
import { Checkbox } from "@/components/starwind/checkbox";
---

<Checkbox id="demo-checkbox" label="Checkbox" />
```

### Dialog

- **Documentation**: https://starwind.dev/docs/components/dialog
- **Import pattern**: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/starwind/dialog";`
- **Key props**:
  - See the documentation for the props for each component
- **Example usage**:

```astro
---
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/starwind/dialog";
import { Button } from "@/components/starwind/button";
---

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Example Dialog</DialogTitle>
      <DialogDescription>
        This is a simple dialog example that demonstrates the basic functionality.
      </DialogDescription>
    </DialogHeader>
    <div class="py-4">Your dialog content goes here.</div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dropdown

- **Documentation**: https://starwind.dev/docs/components/dropdown
- **Import pattern**: `import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator } from "@/components/starwind/dropdown";`
- **Key props**:
  - `Dropdown`: `openOnHover` (boolean), `closeDelay` (number)
  - `DropdownTrigger`: `asChild` (boolean)
  - `DropdownContent`: `side` ("top" | "bottom"), `align` ("start" | "center" | "end"), `sideOffset` (number)
  - `DropdownItem`: `as` (HTMLTag), `inset` (boolean), `disabled` (boolean)
  - `DropdownLabel`: `inset` (boolean)
- **Example usage**:

```astro
---
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from "@/components/starwind/dropdown";
import { Button } from "@/components/starwind/button";
---

<Dropdown>
  <DropdownTrigger asChild>
    <Button>Open Menu</Button>
  </DropdownTrigger>
  <DropdownContent>
    <DropdownLabel>My Account</DropdownLabel>
    <DropdownSeparator />
    <DropdownItem as="a" href="#">Profile</DropdownItem>
    <DropdownItem>Settings</DropdownItem>
    <DropdownSeparator />
    <DropdownItem>Help</DropdownItem>
    <DropdownItem disabled>Sign out</DropdownItem>
  </DropdownContent>
</Dropdown>
```

### Dropzone

- **Documentation**: https://starwind.dev/docs/components/dropzone
- **Import pattern**: `import { Dropzone, DropzoneFilesList, DropzoneLoadingIndicator, DropzoneUploadIndicator } from "@/components/starwind/dropzone";`
- **Key props**:
  - `Dropzone`: `accept` (string), `multiple` (boolean), `disabled` (boolean), `required` (boolean), `name` (string), `isUploading` (boolean)
  - `DropzoneFilesList`: Standard HTML attributes for div elements
  - `DropzoneUploadIndicator`: Provides a slot for custom content
  - `DropzoneLoadingIndicator`: Provides a slot for custom content
- **Example usage**:

```astro
---
import {
  Dropzone,
  DropzoneFilesList,
  DropzoneLoadingIndicator,
  DropzoneUploadIndicator,
} from "@/components/starwind/dropzone";
---

<Dropzone>
  <DropzoneUploadIndicator>
    <span class="my-6 text-lg">Drop files here or click to upload</span>
  </DropzoneUploadIndicator>
  <DropzoneLoadingIndicator />
  <DropzoneFilesList />
</Dropzone>
```

### Input

- **Documentation**: https://starwind.dev/docs/components/input
- **Import pattern**: `import { Input } from "@/components/starwind/input";`
- **Key props**:
  - `size`: "sm" | "md" | "lg" (default: "md")
  - All standard HTML input attributes
- **Example usage**:

```astro
---
import { Input } from "@/components/starwind/input";
---

<Input type="email" placeholder="Email" required />
```

### Item

- **Documentation**: https://starwind.dev/docs/components/item
- **Description**: A flexible item component with multiple sub-components for building rich content blocks. Commonly used for lists, notifications, and card-like content.
- **Import pattern**: `import { Item, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemMedia, ItemHeader, ItemFooter, ItemGroup, ItemSeparator } from "@/components/starwind/item";`
- **Key props**:
  - `<Item>` (Root component)
    - `variant`: "default" | "outline" | "muted" (default: "default")
    - `size`: "default" | "sm" (default: "default")
    - `as`: HTMLTag - The HTML element to render as (default: "div")
    - All standard HTML attributes for the element specified by the `as` prop
  - `<ItemMedia>`
    - `variant`: "default" | "icon" | "image" (default: "default")
    - All standard HTML attributes for div elements
  - `<ItemContent>`, `<ItemTitle>`, `<ItemDescription>`, `<ItemActions>`, `<ItemHeader>`, `<ItemFooter>`: Standard HTML attributes for their respective elements
  - `<ItemGroup>`: Container for grouping multiple items with semantic list markup
  - `<ItemSeparator>`: Separator for use within ItemGroup
    - `orientation`: "horizontal" | "vertical" (default: "horizontal")
- **Example usage**:

```astro
---
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemMedia,
  ItemGroup,
  ItemSeparator,
} from "@/components/starwind/item";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/starwind/avatar";
import { Button } from "@/components/starwind/button";
import Plus from "@tabler/icons/outline/plus.svg";
---

<!-- Basic Item -->
<Item variant="outline">
  <ItemContent>
    <ItemTitle>Basic Item</ItemTitle>
    <ItemDescription>A simple item with title and description.</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="outline" size="sm">Action</Button>
  </ItemActions>
</Item>

<!-- Item with Avatar -->
<Item variant="outline">
  <ItemMedia>
    <Avatar>
      <AvatarImage src="https://github.com/Boston343.png" alt="@BowTiedWebReapr" />
      <AvatarFallback>WR</AvatarFallback>
    </Avatar>
  </ItemMedia>
  <ItemContent>
    <ItemTitle>Web Reaper</ItemTitle>
    <ItemDescription>Creator of Starwind UI</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button size="icon-sm" variant="outline" class="rounded-full" aria-label="Invite">
      <Plus />
    </Button>
  </ItemActions>
</Item>

<!-- Item Group -->
<ItemGroup>
  <Item>
    <ItemContent>
      <ItemTitle>First Item</ItemTitle>
      <ItemDescription>Description for first item</ItemDescription>
    </ItemContent>
  </Item>
  <ItemSeparator />
  <Item>
    <ItemContent>
      <ItemTitle>Second Item</ItemTitle>
      <ItemDescription>Description for second item</ItemDescription>
    </ItemContent>
  </Item>
</ItemGroup>
```

### Label

- **Documentation**: https://starwind.dev/docs/components/label
- **Import pattern**: `import { Label } from "@/components/starwind/label";`
- **Key props**:
  - `size`: "sm" | "md" | "lg" (default: "md")
  - All standard HTML label attributes
- **Example usage**:

```astro
---
import { Label } from "@/components/starwind/label";
import { Input } from "@/components/starwind/input";
---

<div class="space-y-2">
  <Label for="demo-input">Email</Label>
  <Input id="demo-input" type="email" placeholder="Enter your email" />
</div>
```

### Pagination

- **Documentation**: https://starwind.dev/docs/components/pagination
- **Import pattern**: `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/starwind/pagination";`
- **Key props**:
  - `<PaginationLink>`
    - `isActive`: boolean - Highlights the current page
    - `href`: string - Link target
    - `size`: `"sm" \| "md" \| "lg"` - element size
  - `<PaginationNext>`
    - `href`: string - Link target
    - `size`: `"sm" \| "md" \| "lg"` - element size
  - `<PaginationPrevious>`
    - `href`: string - Link target
    - `size`: `"sm" \| "md" \| "lg"` - element size
- **Example usage**:

```astro
---
import {
  Pagination,
  PaginationEllipsis,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/starwind/pagination";
---

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#">Prev</PaginationPrevious>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#">Next</PaginationNext>
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

### Progress

- **Documentation**: https://starwind.dev/docs/components/progress
- **Import pattern**: `import { Progress } from "@/components/starwind/progress";`
- **Key props**:
  - `value`: number - Current progress value
  - `max`: number - Maximum value (default: 100)
  - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
  - Standard HTML attributes for div elements
- **Example usage**:

```astro
---
import { Progress } from "@/components/starwind/progress";
---

<Progress value={50} />

<!-- Indeterminate state (loading) -->
<Progress />

<!-- With variant -->
<Progress value={75} variant="success" />
```

### Radio Group

- **Documentation**: https://starwind.dev/docs/components/radio-group
- **Import pattern**: `import { RadioGroup, RadioGroupItem } from "@/components/starwind/radio-group";`
- **Key props**:
  - `RadioGroup`:
    - `name`: string - Name for the radio group inputs (required)
    - `value`: string - Current value of the radio group
    - `defaultValue`: string - Default value if `value` not provided
    - `legend`: string - Screen reader label for the group
    - `orientation`: "vertical" | "horizontal" (default: "vertical")
  - `RadioGroupItem`:
    - `value`: string - Value of the radio item (required)
    - `id`: string - ID for the radio input
    - `size`: "sm" | "md" | "lg" (default: "md")
    - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
- **Example usage**:

```astro
---
import { RadioGroup, RadioGroupItem } from "@/components/starwind/radio-group";
import { Label } from "@/components/starwind/label";
---

<RadioGroup name="demo-radio" defaultValue="option-1" legend="Choose an option">
  <div class="flex items-center gap-2">
    <RadioGroupItem id="option-1" value="option-1" name="demo-radio" />
    <Label for="option-1">Option 1</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem id="option-2" value="option-2" name="demo-radio" />
    <Label for="option-2">Option 2</Label>
  </div>
  <div class="flex items-center gap-2">
    <RadioGroupItem id="option-3" value="option-3" name="demo-radio" />
    <Label for="option-3">Option 3</Label>
  </div>
</RadioGroup>
```

### Select

- **Documentation**: https://starwind.dev/docs/components/select
- **Import pattern**: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/starwind/select";`
- **Key props**:
  - `<SelectContent>`
    - `animationDuration`: number - Duration of the content animation (in ms) (default: 200)
    - `side`: "top" | "bottom" (default: "bottom")
    - `sideOffset`: number - Offset distance in pixels (default: 4)
  - `<SelectItem>`
    - `disabled`: boolean - Disables the item
    - `value`: string - Value of the item
- **Example usage**:

```astro
---
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/starwind/select";
---

<Select>
  <SelectTrigger class="w-[180px]">
    <SelectValue placeholder="Select" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Frameworks</SelectLabel>
      <SelectItem value="astro">Astro</SelectItem>
      <SelectItem value="next">Next.js</SelectItem>
      <SelectItem value="svelte">SvelteKit</SelectItem>
      <SelectItem value="solid">SolidStart</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Separator

- **Documentation**: https://starwind.dev/docs/components/separator
- **Import pattern**: `import { Separator } from "@/components/starwind/separator";`
- **Key props**:
  - `orientation`: "horizontal" | "vertical" (default: "horizontal")
  - All standard HTML attributes for div elements (excluding `role` and `aria-orientation` which are set automatically)
- **Example usage**:

```astro
---
import { Separator } from "@/components/starwind/separator";
---

<div>
  <h4 class="text-sm font-medium">Starwind UI</h4>
  <p class="text-sm text-muted-foreground">A beautiful component library for Astro.</p>
</div>
<Separator />
<div class="flex h-5 items-center space-x-4 text-sm">
  <div>Components</div>
  <Separator orientation="vertical" />
  <div>Documentation</div>
  <Separator orientation="vertical" />
  <div>Examples</div>
</div>
```

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

```astro
---
import { Button } from "@/components/starwind/button";
import { Input } from "@/components/starwind/input";
import { Label } from "@/components/starwind/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/starwind/sheet";
---

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
      <SheetDescription>
        Make changes to your profile here. Click save when you're done.
      </SheetDescription>
    </SheetHeader>
    <div class="grid gap-4 px-4">
      <div class="grid gap-2">
        <Label for="name">Name</Label>
        <Input id="name" value="Pedro Duarte" />
      </div>
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        <Input id="username" value="@peduarte" />
      </div>
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button type="submit">Save changes</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>

<!-- Sheet with different sides -->
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Top Sheet</Button>
  </SheetTrigger>
  <SheetContent side="top">
    <SheetHeader>
      <SheetTitle>Top Sheet</SheetTitle>
      <SheetDescription>This sheet opens from the top of the screen.</SheetDescription>
    </SheetHeader>
    <!-- Content -->
  </SheetContent>
</Sheet>
```

### Skeleton

- **Documentation**: https://starwind.dev/docs/components/skeleton
- **Import pattern**: `import { Skeleton } from "@/components/starwind/skeleton";`
- **Key props**:
  - The Skeleton component accepts all standard HTML attributes for the `<div>` element
  - Use the `class` prop to control dimensions, shape, and appearance
- **Example usage**:

```astro
---
import { Skeleton } from "@/components/starwind/skeleton";
---

<!-- Avatar and text skeleton loading state example -->
<div class="flex items-center space-x-4">
  <Skeleton class="h-12 w-12 rounded-full" />
  <div class="space-y-2">
    <Skeleton class="h-4 w-[250px]" />
    <Skeleton class="h-4 w-[200px]" />
  </div>
</div>

<!-- Card skeleton loading state example -->
<div class="flex flex-col space-y-3">
  <Skeleton class="h-[125px] w-[250px] rounded-xl" />
  <div class="space-y-2">
    <Skeleton class="h-4 w-[250px]" />
    <Skeleton class="h-4 w-[200px]" />
  </div>
</div>
```

### Spinner

- **Documentation**: https://starwind.dev/docs/components/spinner
- **Import pattern**: `import { Spinner } from "@/components/starwind/spinner";`
- **Key props**:
  - All standard HTML attributes for svg elements (excluding `role` and `aria-label` which are set automatically for accessibility)
  - Use the `class` prop to control size and color
- **Example usage**:

```astro
---
import { Spinner } from "@/components/starwind/spinner";
import { Button } from "@/components/starwind/button";
---

<!-- Basic spinner -->
<Spinner />

<!-- Custom size -->
<Spinner class="size-8" />

<!-- Custom color -->
<Spinner class="text-blue-500" />

<!-- In button -->
<Button disabled>
  <Spinner />
  Loading...
</Button>
```

### Switch

- **Documentation**: https://starwind.dev/docs/components/switch
- **Import pattern**: `import { Switch } from "@/components/starwind/switch";`
- **Key props**:
  - `id`: string - The required ID attribute
  - `variant`: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error" (default: "default")
  - `size`: "sm" | "md" | "lg" (default: "md")
  - `checked`: boolean - Controls the checked state
  - `disabled`: boolean - Disables the switch
- **Example usage**:

```astro
---
import { Switch } from "@/components/starwind/switch";
---

<Switch id="demo-switch" label="Switch" />
```

### Table

- **Documentation**: https://starwind.dev/docs/components/table
- **Import pattern**: `import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell, TableCaption, TableFoot } from "@/components/starwind/table";`
- **Example usage**:

```astro
---
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
  TableFoot,
} from "@/components/starwind/table";
---

<Table>
  <TableCaption>Example of a simple table</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Ada Lovelace</TableCell>
      <TableCell>ada@starwind.dev</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>Grace Hopper</TableCell>
      <TableCell>grace@starwind.dev</TableCell>
      <TableCell>Inactive</TableCell>
    </TableRow>
  </TableBody>
  <TableFoot>
    <TableRow>
      <TableCell colspan="3">Total: 2 users</TableCell>
    </TableRow>
  </TableFoot>
</Table>
```

### Tabs

- **Documentation**: https://starwind.dev/docs/components/tabs
- **Import pattern**: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/starwind/tabs";`
- **Key props**:
  - `<Tabs>`
    - `defaultValue`: string - The value of the tab that should be active by default
    - `syncKey`: string - The key to sync the active tab with another component
  - `<TabsTrigger>`
    - `value`: string - The value of the tab
  - `<TabsContent>`
    - `value`: string - The value of the tab
- **Example usage**:

```astro
---
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/starwind/tabs";
---

<Tabs defaultValue="astro" class="max-w-[400px]">
  <TabsList>
    <TabsTrigger value="astro">Astro</TabsTrigger>
    <TabsTrigger value="next">Next.js</TabsTrigger>
  </TabsList>
  <TabsContent value="astro">
    Build fast websites, faster with Astro's next-gen island architecture.
  </TabsContent>
  <TabsContent value="next">
    The React framework for production-grade applications that scale.
  </TabsContent>
</Tabs>
```

### Textarea

- **Documentation**: https://starwind.dev/docs/components/textarea
- **Import pattern**: `import { Textarea } from "@/components/starwind/textarea";`
- **Key props**:
  - `size`: "sm" | "md" | "lg" (default: "md")
  - All standard HTML textarea attributes
- **Example usage**:

```astro
---
import { Textarea } from "@/components/starwind/textarea";
---

<Textarea placeholder="Type something..." />
```

### Tooltip

- **Documentation**: https://starwind.dev/docs/components/tooltip
- **Import pattern**: `import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/starwind/tooltip";`
- **Key props**:
  - `<Tooltip>`
    - `openDelay`: number - Delay in ms before showing the tooltip (default: 200)
    - `closeDelay`: number - Delay in ms before hiding the tooltip (default: 200)
    - `disableHoverableContent`: boolean - When true, prevents the tooltip from staying open when hovering over its content (default: false)
  - `<TooltipContent>`
    - `side`: "top" | "right" | "bottom" | "left" (default: "top")
    - `align`: "start" | "center" | "end" (default: "center")
    - `animationDuration`: number - Duration in ms of the open/close animation (default: 150)
- **Example usage**:

```astro
---
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/starwind/tooltip";
import { Button } from "@/components/starwind/button";
---

<Tooltip>
  <TooltipTrigger>
    <Button>Hover me</Button>
  </TooltipTrigger>
  <TooltipContent> Add to library </TooltipContent>
</Tooltip>
```

## Examples

### Form Card

A complete implementation example of a form with Starwind components:

```astro
---
import { Button } from "@/components/starwind/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/starwind/card";

import { Input } from "@/components/starwind/input";
import { Label } from "@/components/starwind/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/starwind/select";
---

<Card class="w-[400px]">
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <form id="create-project-form">
    <CardContent class="flex flex-col gap-4">
      <div class="flex w-full flex-col gap-2">
        <Label for="name">Name</Label>
        <Input type="text" id="name" name="name" placeholder="Name of your project" />
      </div>
      <div class="flex w-full flex-col gap-2">
        <Label for="framework">Framework</Label>
        <Select id="framework" name="framework">
          <SelectTrigger class="w-full" required>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Frameworks</SelectLabel>
              <SelectItem value="astro">Astro</SelectItem>
              <SelectItem value="next">Next.js</SelectItem>
              <SelectItem value="svelte">SvelteKit</SelectItem>
              <SelectItem value="solid">SolidStart</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
    <CardFooter class="flex justify-between">
      <Button variant="outline">Cancel</Button>
      <Button type="submit">Deploy</Button>
    </CardFooter>
  </form>
</Card>

<script>
  function handleFormSubmit() {
    const form = document.querySelector("#create-project-form") as HTMLFormElement;
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const formValues = Object.fromEntries(formData.entries());

        // demo form data logging
        console.log("Form submission values:", formValues);

        // You can add additional logic here like:
        // - Form validation
        // - API submission
        // - Success/error handling
      });
    }
  }

  handleFormSubmit();

  document.addEventListener("astro:after-swap", handleFormSubmit);
</script>
```

## Resources

- Official Website: [starwind.dev](https://starwind.dev)
- Documentation: [starwind.dev/docs](https://starwind.dev/docs/getting-started)
- Components: [starwind.dev/docs/components](https://starwind.dev/docs/components)
- Premium Templates: [cosmicthemes.com](https://cosmicthemes.com)
  - Templates include internationalization features, CMS, custom animations, SEO, and more
