# Documentation of Starwind sidebar implementation

## Initial Analysis

### Components to Implement

Based on shadcn's sidebar, here are all the component pieces:

| Component              | Purpose                           | Complexity |
| ---------------------- | --------------------------------- | ---------- |
| `SidebarProvider`      | Wraps app, provides context/state | High       |
| `Sidebar`              | Main container with variants      | High       |
| `SidebarTrigger`       | Button to toggle sidebar          | Medium     |
| `SidebarRail`          | Drag/click area to toggle         | Low        |
| `SidebarInset`         | Main content area wrapper         | Low        |
| `SidebarHeader`        | Sticky header section             | Low        |
| `SidebarFooter`        | Sticky footer section             | Low        |
| `SidebarContent`       | Scrollable content area           | Low        |
| `SidebarSeparator`     | Divider line                      | Low        |
| `SidebarInput`         | Styled input for search           | Low        |
| `SidebarGroup`         | Section container                 | Low        |
| `SidebarGroupLabel`    | Section heading                   | Low        |
| `SidebarGroupAction`   | Action button in group header     | Low        |
| `SidebarGroupContent`  | Content wrapper in group          | Low        |
| `SidebarMenu`          | Menu list container (ul)          | Low        |
| `SidebarMenuItem`      | Menu list item (li)               | Low        |
| `SidebarMenuButton`    | Clickable menu button             | Medium     |
| `SidebarMenuAction`    | Secondary action on menu item     | Low        |
| `SidebarMenuBadge`     | Badge/count on menu item          | Low        |
| `SidebarMenuSub`       | Submenu container                 | Low        |
| `SidebarMenuSubItem`   | Submenu item                      | Low        |
| `SidebarMenuSubButton` | Submenu button/link               | Low        |
| `SidebarMenuSkeleton`  | Loading placeholder               | Low        |

### React Features in shadcn Implementation

| Feature                                   | Usage                               | Astro Alternative                      |
| ----------------------------------------- | ----------------------------------- | -------------------------------------- |
| `React.createContext` / `useContext`      | Share sidebar state                 | Data attributes on parent + JS class   |
| `useState`                                | Track open/collapsed state          | JS class with state + data attributes  |
| `useCallback` / `useMemo`                 | Memoization                         | N/A (not needed in Astro)              |
| `useEffect`                               | Keyboard shortcuts, event listeners | `<script>` tag with class              |
| `useIsMobile` hook                        | Detect mobile breakpoint            | CSS media queries + `matchMedia` in JS |
| `Slot` from Radix                         | `asChild` pattern                   | Starwind's existing `asChild` pattern  |
| Controlled props (`open`, `onOpenChange`) | External state control              | Custom events                          |
| Sheet component                           | Mobile drawer                       | Starwind Sheet component               |
| Tooltip on collapsed state                | Icon-only tooltips                  | Starwind Tooltip component             |

### Sidebar State Management Strategy

**Approach**: Use a `SidebarController` JavaScript class that:

1. Stores state: `open` (boolean), `openMobile` (boolean)
2. Sets `data-state="expanded|collapsed"` on the provider element
3. Sets `data-mobile-open="true|false"` for mobile state
4. Dispatches custom events (`sidebar:toggle`, `sidebar:open`, `sidebar:close`)
5. Handles keyboard shortcut (Ctrl/Cmd + B)
6. Persists state to cookie
7. Supports Astro view transitions via `astro:after-swap`

### CSS-Based Responsive Behavior

Instead of `isMobile` React hook:

- Use `md:hidden` / `hidden md:flex` for mobile vs desktop visibility
- Use CSS custom properties for widths: `--sidebar-width`, `--sidebar-width-icon`
- Use `matchMedia('(max-width: 768px)')` in JS only for toggle behavior

### Collapsible Modes

| Mode        | Desktop Behavior        | Mobile Behavior |
| ----------- | ----------------------- | --------------- |
| `offcanvas` | Slides off-screen       | Sheet/drawer    |
| `icon`      | Collapses to icons only | Sheet/drawer    |
| `none`      | Always visible          | Always visible  |

---

## Potential Issues (Initial Assessment)

### 🔴 High Risk - React-Specific Patterns

1. **Context-based state sharing**: shadcn uses `useSidebar()` hook everywhere
   - Components like `SidebarTrigger`, `SidebarMenuButton` (tooltip), `SidebarRail` all call `useSidebar()`
   - **Solution**: Query parent `[data-sidebar-provider]` element and read data attributes, or use custom events

2. **Controlled component pattern**: `open` / `onOpenChange` props
   - React pattern for external state control
   - **Solution**: Custom events + imperative API via JS class

3. **Mobile Sheet integration**: Conditional rendering based on `isMobile`
   - Renders completely different markup on mobile
   - **Solution**: Render both, use CSS to show/hide, or use `<script>` to hydrate Sheet

4. **Tooltip on SidebarMenuButton**: Shows tooltip when collapsed
   - Uses `hidden` prop on TooltipContent based on state
   - **Solution**: CSS-based hiding or data attribute check

### 🟡 Medium Risk

1. **Cookie persistence**: `document.cookie` usage in React callback
   - **Solution**: Move to JS class, straightforward port

2. **Keyboard shortcut**: `useEffect` for Ctrl+B
   - **Solution**: Script tag listener, straightforward

3. **CSS variable injection**: `style` prop with CSS vars
   - **Solution**: Astro `style` attribute works the same

### 🟢 Low Risk - Mostly Static Components

- `SidebarHeader`, `SidebarFooter`, `SidebarContent` - just styled divs
- `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent` - styled containers
- `SidebarMenu`, `SidebarMenuItem` - styled ul/li
- `SidebarSeparator` - uses Separator component
- `SidebarMenuBadge`, `SidebarMenuSkeleton` - styled elements

---

## Proposed MVP Scope

### Phase 1: Core Structure (MVP)

- [ ] `SidebarProvider` - Basic wrapper with JS controller
- [ ] `Sidebar` - Container with `side`, `variant`, `collapsible` props
- [ ] `SidebarHeader`, `SidebarFooter`, `SidebarContent`
- [ ] `SidebarTrigger` - Toggle button
- [ ] `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`
- [ ] `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`
- [ ] Basic expand/collapse functionality with data attributes
- [ ] Keyboard shortcut (Ctrl/Cmd + B)
- [ ] Cookie persistence

### Phase 2: Enhanced Features

- [ ] `SidebarRail` - Drag to toggle
- [ ] `SidebarInset` - Main content wrapper
- [ ] `SidebarGroupAction`
- [ ] `SidebarMenuAction`, `SidebarMenuBadge`
- [ ] `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`
- [ ] `SidebarSeparator`, `SidebarInput`
- [ ] Mobile Sheet integration
- [ ] Tooltip on collapsed menu buttons

### Phase 3: Polish

- [ ] `SidebarMenuSkeleton`
- [ ] View transitions support
- [ ] Custom events API for external control
- [ ] Full variant support (floating, inset)

---

## Implementation Notes

### Data Attribute Strategy

```html
<!-- Provider sets state -->
<div data-sidebar-provider data-state="expanded" data-mobile-open="false">
  <!-- Sidebar reads parent state via group-data-* -->
  <div data-sidebar data-side="left" data-variant="sidebar" data-collapsible="icon">
    <!-- Children use group-data-[state=collapsed]:* classes -->
  </div>
</div>
```

### Script Architecture

```typescript
class SidebarController {
  private provider: HTMLElement;
  private state: "expanded" | "collapsed" = "expanded";
  private mobileOpen: boolean = false;

  toggle(): void {
    // Update data-state attribute (not class list)
    // Dispatch custom event
  }
}
```

### Styling with Data Attributes

```css
/* Instead of adding/removing classes, style based on data attributes */
[data-sidebar-provider][data-state="collapsed"] [data-sidebar-group-label] {
  /* collapsed styles */
}

/* Or in Tailwind */
class="group-data-[state=collapsed]:opacity-0"
```

---

## Re-Evaluation: Astro Compatibility Deep Dive

### 🔴 Critical Issue #1: Mobile Sidebar (Sheet)

**Problem**: The React version conditionally renders completely different markup:

```tsx
// React version
if (isMobile) {
  return (
    <Sheet>
      <SheetContent>...</SheetContent>
    </Sheet>
  );
}
return <div>...</div>;
```

**Options Evaluated**:

| Option                          | Pros                  | Cons                                         |
| ------------------------------- | --------------------- | -------------------------------------------- |
| A) Render both, CSS show/hide   | Simple, no JS needed  | Duplicate HTML, heavier DOM                  |
| B) JS dynamically creates Sheet | No duplicate HTML     | Complex, requires Sheet to work imperatively |
| C) CSS-only mobile slide        | No duplicate, simpler | Less polished than Sheet modal               |
| D) Defer mobile to Phase 2      | Ship faster           | Incomplete feature                           |

**Recommendation**: Option C for MVP - Use CSS transforms/positioning to slide sidebar from off-screen on mobile. The `offcanvas` mode already does this conceptually. Add Sheet integration in Phase 2.

### 🔴 Critical Issue #2: Tooltip on Collapsed Menu Buttons

**Problem**: React version conditionally wraps button in Tooltip and sets `hidden` prop based on state:

```tsx
<TooltipContent hidden={state !== "collapsed" || isMobile} />
```

**Options Evaluated**:

| Option                                | Pros                       | Cons                                          |
| ------------------------------------- | -------------------------- | --------------------------------------------- |
| A) Always render Tooltip, CSS hide    | Works with data attributes | Tooltip still in DOM                          |
| B) Skip tooltip feature for MVP       | Simpler                    | Missing useful UX                             |
| C) Tooltip with data-attribute hiding | Clean                      | Need to verify Starwind Tooltip supports this |

**Recommendation**: Option B for MVP. Tooltips on collapsed icons are a nice-to-have, not essential. Add in Phase 2.

### 🟡 Medium Issue #1: Components Needing State Access

Only these components actually need sidebar state:

| Component           | State Needed                    | How to Solve in Astro                                      |
| ------------------- | ------------------------------- | ---------------------------------------------------------- |
| `SidebarProvider`   | Defines state                   | JS controller class                                        |
| `Sidebar`           | `state`, mobile detection       | Read via `closest('[data-sidebar-provider]')` + matchMedia |
| `SidebarTrigger`    | `toggleSidebar()`               | Dispatch custom event or call controller                   |
| `SidebarRail`       | `toggleSidebar()`               | Same as trigger                                            |
| `SidebarMenuButton` | `state`, `isMobile` for tooltip | Defer tooltip to Phase 2                                   |

**Solution**: The JS controller can be accessed via:

```typescript
// Any element can toggle:
document.querySelector("[data-sidebar-provider]")?.dispatchEvent(new CustomEvent("sidebar:toggle"));

// Or via global instance:
window.starwindSidebar?.toggle();
```

### 🟡 Medium Issue #2: Group/Peer Selector Chain

**Problem**: shadcn uses nested group selectors like:

```
group/sidebar-wrapper
  group (sidebar outer div)
    group-data-[collapsible=icon]:hidden
```

**Assessment**: This is pure Tailwind CSS, works fine in Astro. The `group` and `peer` patterns don't require React.

**Important**: The sidebar outer `<div>` with `data-state` must have the `group` class for `group-data-[state=collapsed]:*` to work.

### 🟢 Non-Issues (Will Work Fine)

1. **`asChild` pattern** - Starwind already has this, just use it consistently
2. **CSS variables** - Astro supports `style` attribute with CSS vars
3. **Cookie persistence** - Vanilla JS, no React needed
4. **Keyboard shortcuts** - Standard `addEventListener` in script
5. **Tailwind Variants (`tv`)** - Already used throughout Starwind
6. **Data attributes for styling** - Core to Starwind pattern
7. **View transitions** - Astro native feature, just add `astro:after-swap` listener

---

## Revised MVP Scope (Simpler)

### MVP Components (12 total)

1. `SidebarProvider` - Wrapper with JS controller, data-state management
2. `Sidebar` - Container (desktop only for MVP, `collapsible="icon"` and `collapsible="offcanvas"`)
3. `SidebarHeader` - Styled div
4. `SidebarFooter` - Styled div
5. `SidebarContent` - Scrollable container
6. `SidebarTrigger` - Toggle button
7. `SidebarGroup` - Section wrapper
8. `SidebarGroupLabel` - Section heading
9. `SidebarGroupContent` - Section content
10. `SidebarMenu` - Menu list (ul)
11. `SidebarMenuItem` - Menu item (li)
12. `SidebarMenuButton` - Menu button (no tooltip for MVP)

### Deferred to Phase 2

- Mobile Sheet integration
- `SidebarRail`
- `SidebarInset`
- `SidebarGroupAction`
- `SidebarMenuAction`, `SidebarMenuBadge`
- `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`
- `SidebarSeparator`, `SidebarInput`
- Tooltip on collapsed buttons
- `variant="floating"` and `variant="inset"`

### MVP Features

- ✅ Desktop expand/collapse (`data-state="expanded|collapsed"`)
- ✅ `collapsible="icon"` mode (collapse to icons)
- ✅ `collapsible="offcanvas"` mode (slide off-screen)
- ✅ `collapsible="none"` mode (always visible)
- ✅ `side="left"` and `side="right"`
- ✅ `variant="sidebar"` (default)
- ✅ Keyboard shortcut (Ctrl/Cmd + B)
- ✅ Cookie persistence
- ✅ CSS-based responsive (hide on mobile for MVP)
- ⏸️ Mobile drawer/sheet (Phase 2)
- ⏸️ Tooltips on collapsed icons (Phase 2)

---

## Implementation Order

```
1. SidebarProvider.astro (+ script controller)
2. Sidebar.astro
3. SidebarHeader.astro, SidebarFooter.astro, SidebarContent.astro
4. SidebarTrigger.astro
5. SidebarGroup.astro, SidebarGroupLabel.astro, SidebarGroupContent.astro
6. SidebarMenu.astro, SidebarMenuItem.astro, SidebarMenuButton.astro
7. index.ts (exports)
8. Test/demo page
```

---

## Open Questions

1. **Should SidebarProvider be a layout component or regular component?**
   - Recommendation: Regular component, used in layouts by consumer

2. **Default `collapsible` mode?**
   - shadcn uses `offcanvas` as default
   - Recommendation: Same, `offcanvas` as default

3. **Where does the script live?**
   - Recommendation: In `SidebarProvider.astro` (root component pattern from Starwind)

4. **Single sidebar or multiple sidebar support?**
   - Recommendation: MVP supports single sidebar, use unique selector
   - Phase 2: Support `id` prop for multiple sidebars
