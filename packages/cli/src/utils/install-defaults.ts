// Package specs that the CLI installs from code rather than from the bundled registry.
// This file has no imports so the offline requirements entry stays small.

/** Each official integration major supports one Astro major, so npm rejects any other pairing. */
export const ASTRO_INTEGRATION_RANGES = {
  "@astrojs/react": { 5: "^4.4.2", 6: "^5.0.7", 7: "^6.0.2" },
  "@astrojs/svelte": { 5: "^7.2.5", 6: "^8.1.2", 7: "^9.1.2" },
  "@astrojs/vue": { 5: "^5.1.4", 6: "^6.0.1", 7: "^7.1.2" },
} as const satisfies Record<string, Record<5 | 6 | 7, string>>;

export const REACT_18_DEFAULTS = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "@types/react": "^18.3.20",
  "@types/react-dom": "^18.3.7",
} as const;

export const REACT_19_DEFAULTS = {
  react: "^19.2.0",
  "react-dom": "^19.2.0",
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0",
} as const;

/** Next.js projects use the PostCSS plugin instead of the Vite plugin. */
export const NEXT_TAILWIND_POSTCSS_REQUIREMENT = "@tailwindcss/postcss@^4";

/** Packages that the Starwind stylesheet imports. */
export const STARWIND_STYLESHEET_REQUIREMENTS = Object.freeze([
  "tailwindcss@^4",
  "@tailwindcss/vite@^4",
  "tw-animate-css@^1",
  "@tailwindcss/forms@^0.5",
] as const);
