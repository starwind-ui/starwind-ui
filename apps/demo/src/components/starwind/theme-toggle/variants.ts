import { tv } from "tailwind-variants";

export const themeToggle = tv({
  base: [
    "starwind-theme-toggle",
    "group hover:border-muted-foreground hover:bg-transparent data-[state=on]:bg-transparent",
  ],
});
