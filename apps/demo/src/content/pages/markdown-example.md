---
title: Markdown Example
description: A comprehensive example of all standard markdown elements for styling purposes.
---

# Heading 1 this is a really long heading to see word wrapping if it's an issue

## Heading 2 this is a really long heading to see word wrapping if it's an issue

### Heading 3 this is a really long heading to see word wrapping if it's an issue

This is a paragraph with **bold text**, _italic text_, and **_bold italic text_**. You can also use `inline code` within paragraphs.

## Heading 2

Here's a paragraph with a [link to Astro](https://astro.build) and an [external link](https://github.com) to demonstrate anchor styling.

### Heading 3

Sometimes you need to ~~strikethrough~~ text or add <mark>highlighted text</mark> for emphasis.

#### Heading 4

This paragraph contains a footnote reference[^1].

##### Heading 5

Let's demonstrate various list types below.

###### Heading 6

The smallest heading level, useful for minor sections.

---

## Unordered Lists

- First item
- Second item
  - Nested item one
  - Nested item two
    - Deeply nested item
- Third item

## Ordered Lists

1. First step
2. Second step
   1. Sub-step one
   2. Sub-step two
3. Third step

## Task Lists

- [x] Completed task
- [ ] Incomplete task
- [ ] Another task to do

---

## Blockquotes

> This is a blockquote. It can span multiple lines and is often used for citations or callouts.
>
> — Author Name

> Nested blockquotes are also possible:
>
> > This is a nested quote inside the main quote.

---

## Code Blocks

Inline code was shown above. Here's a fenced code block:

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

greet("World");
```

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
};
```

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

```bash
npm install astro
pnpm dev
```

---

## Tables

| Feature       | Status  | Notes                     |
| ------------- | ------- | ------------------------- |
| Markdown      | ✅ Done | Full support              |
| Styling       | 🚧 WIP  | In progress               |
| Accessibility | ✅ Done | ARIA labels included      |
| Dark Mode     | ✅ Done | Automatic theme switching |

### Right-Aligned Table

| Item        |       Price |   Qty |
| :---------- | ----------: | ----: |
| Widget      |      $10.00 |     5 |
| Gadget      |      $25.00 |     2 |
| Thingamajig |     $100.00 |     1 |
| **Total**   | **$180.00** | **8** |

---

## Images

![Placeholder image](https://via.placeholder.com/800x400?text=Example+Image)

_Caption: This is an example image with a caption below it._

---

## Horizontal Rules

Content above the rule.

---

Content below the rule.

---

## Definition Lists

Term 1
: Definition for term 1

Term 2
: Definition for term 2
: Another definition for term 2

---

## Keyboard Input

Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy text.

Use <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> to open the command palette.

---

## Subscript and Superscript

Water is H<sub>2</sub>O.

Einstein's famous equation: E = mc<sup>2</sup>

---

## Details/Summary (Collapsible)

<details>
<summary>Click to expand</summary>

This content is hidden by default and can be revealed by clicking the summary.

- Hidden list item 1
- Hidden list item 2

</details>

---

## Footnotes

Here's a sentence with a footnote[^2].

[^1]: This is the first footnote.

[^2]: This is the second footnote with more detail.

---

## Embedded HTML

<div class="not-starwind-prose text-foreground border-primary-accent bg-primary-accent/10 p-4 border rounded-md">
  <p>This is a custom HTML block embedded in markdown.</p>
</div>

---

## Long Paragraph

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit.

---

## Summary

This document demonstrates all standard markdown elements that should be styled by a wrapper component:

1. **Headings** (h1-h6)
2. **Text formatting** (bold, italic, strikethrough, code)
3. **Links** (internal and external)
4. **Lists** (ordered, unordered, task lists)
5. **Blockquotes** (single and nested)
6. **Code blocks** (with syntax highlighting)
7. **Tables** (with alignment options)
8. **Images** (with captions)
9. **Horizontal rules**
10. **Special elements** (kbd, sub, sup, details)
11. **Footnotes**
