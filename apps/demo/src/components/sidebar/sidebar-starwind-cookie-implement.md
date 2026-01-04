# Sidebar Cookie/Persistence Implementation

This document describes how to implement cookie-based state persistence for the Starwind Sidebar component to prevent CLS (Cumulative Layout Shift) on page load.

## Overview

The implementation has 3 parts:

1. **Inline head script** - Reads cookie before paint and sets initial state
2. **CSS transition blocking** - Prevents animations during initial state setup
3. **SidebarProvider script** - Handles cookie persistence and state restoration

---

## Part 1: Inline Head Script (Per Page)

Add this script in the `<head>` section of each page that uses the sidebar, **before** other scripts:

```html
<script is:inline>
  // Read sidebar state from cookie before paint to prevent CLS
  (function () {
    const sidebarProvider = document.querySelector(".starwind-sidebar-provider");
    if (!sidebarProvider) return;

    const match = document.cookie.match(/sidebar_state=(\w+)/);

    if (match && match[1] === "false") {
      document.documentElement.dataset.sidebarInitialState = "collapsed";
      sidebarProvider.setAttribute("data-state", "collapsed");
    }
  })();
</script>
```

## Part 2: CSS Transition Blocking (Per Page)

Add this style in the `<head>` section to prevent animations until state is ready:

```html
<style is:global>
  /* Disable transitions until sidebar is ready */
  :root:not([data-sidebar-ready]) [data-slot="sidebar-gap"],
  :root:not([data-sidebar-ready]) [data-slot="sidebar-container"],
  :root:not([data-sidebar-ready]) [data-slot="sidebar-container"] * {
    transition: none !important;
  }
</style>
```

## Part 3: SidebarProvider Script Updates

### Constants (at top of script)

```ts
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
```

### restoreState method

```ts
private restoreState() {
  // Check if head script already set initial state (prevents CLS)
  const initialState = document.documentElement.dataset.sidebarInitialState;
  if (initialState === "collapsed") {
    this.provider.setAttribute("data-state", "collapsed");
    this.provider.dispatchEvent(
      new CustomEvent("sidebar:change", { detail: { open: false, state: "collapsed" } }),
    );
  } else {
    // Fall back to cookie check if head script didn't run
    const cookies = document.cookie.split(";");
    const stateCookie = cookies.find((c) => c.trim().startsWith(`${SIDEBAR_COOKIE_NAME}=`));
    if (stateCookie) {
      const value = stateCookie.split("=")[1]?.trim();
      if (value === "true" || value === "false") {
        const open = value === "true";
        const state = open ? "expanded" : "collapsed";
        this.provider.setAttribute("data-state", state);
        this.provider.dispatchEvent(
          new CustomEvent("sidebar:change", { detail: { open, state } }),
        );
      }
    }
  }

  // Enable transitions after state is set
  requestAnimationFrame(() => {
    document.documentElement.dataset.sidebarReady = "true";
  });
}
```

### persistState method

```ts
private persistState(open: boolean) {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}
```

### Call persistState in setOpen

```ts
setOpen(open: boolean) {
  const state = open ? "expanded" : "collapsed";
  this.provider.setAttribute("data-state", state);
  this.persistState(open); // <-- Add this line
  this.provider.dispatchEvent(new CustomEvent("sidebar:change", { detail: { open, state } }));
}
```

### Call restoreState in init

```ts
private init() {
  this.setupKeyboardShortcut();
  this.setupCustomEvents();
  this.setupMobileQuery();
  this.restoreState(); // <-- Add this line last
}
```

---

## File Locations

- **SidebarProvider**: `apps/demo/src/components/starwind/sidebar/SidebarProvider.astro`
- **Demo pages**:
  - `apps/demo/src/pages/pages/sidebar-demo.astro`
  - `apps/demo/src/pages/pages/sidebar-nested.astro`

## How It Works

1. Page loads, head script runs synchronously before paint
2. Head script reads `sidebar_state` cookie and sets `data-state="collapsed"` if needed
3. CSS blocks all transitions while `data-sidebar-ready` is not set
4. SidebarProvider initializes, checks `sidebarInitialState` attribute
5. After state is confirmed, `data-sidebar-ready="true"` is set on `<html>`
6. Transitions are now enabled for user interactions
7. When user toggles sidebar, `setOpen()` calls `persistState()` to save cookie
