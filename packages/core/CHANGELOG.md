# @starwind-ui/core

## 1.12.4

### Patch Changes

- 13b7c60: Unlock package versions for potential dependency bug fixes

## 1.12.2

## 1.12.1

### Patch Changes

- f7ad6e1: style: add aria-invalid styling for form related components
- 88e2d11: feat(select): enable "required" attribute for form handling purposes

## 1.12.0

### Minor Changes

- 2320eaf: feat: add button-group component
- fb5651f: feat: add combobox component leveraging the select component
- 7773330: feat: add toggle component

### Patch Changes

- 7b43fcb: feat: add "size" prop to `SelectTrigger` and `SelectContent`, implement `SelectSearch` for a combobox-like implementation, and improve select component styling
- ce55d46: fix: alert dialog and dropdown components no longer risk having a class of "undefined"
- 64c1c3a: fix: button group now better handles select and dropdowns within the group
- 5121926: feat(pagination): add size prop to PaginationEllipsis, and adjust PaginationNext and PaginationPrevious to use button variant props for sizes

## 1.11.2

### Patch Changes

- 33dd20a: chore: update registry component versions

## 1.11.1

### Patch Changes

- e2e411c: Avatar: add ability to pass additional attributes to components
- b255995: Removed debug logging statements from Dropdown and RadioGroup components

## 1.11.0

### Minor Changes

- 6793ef1: Add Kbd component for keyboard shortcuts

### Patch Changes

- c0a2da8: feat: add slots for various components to enable easier styling, including accordion, alert-dialog, breadcrumb, carousel, dialog, pagination, radio-group, select, and sheet components

## 1.10.1

### Patch Changes

- eaaec1b: simplify default accordion styling to enable easier custom styling

## 1.10.0

### Minor Changes

- 1f83bc0: add item component
- bdcbfe3: add spinner component
- 96de92c: Update various component styles and focus states
- 9261789: Add new separator component
- 680f584: add new aspect-ratio component

## 1.9.0

### Minor Changes

- ef55ef6: add a "data-slot" for every component to enable global styling updates
- b83b5d5: feat: add variant function exports for all components to enable reusing styling in your own files
- 5f3769c: feat: add alert-dialog component
- e8e9a39: add carousel component leveraging embla-carousel
- 9a5187d: Add sheet component

### Patch Changes

- 432168d: Dialog trigger now correctly preserves its default styling while appending user-provided class names when used as a child component. This ensures custom styles work without overriding core styles and maintains consistent appearance across usage patterns. No API changes; improved compatibility with theming and design systems.
- f9c3fa3: various fixes to alert-dialog, alert, and dialog components

## 1.8.0

### Patch Changes

- - Initial changeset setup.
