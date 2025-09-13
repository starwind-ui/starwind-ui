export const MIN_ASTRO_VERSION = "5.0.0";

/**
 * File system paths used throughout the application
 */
export const PATHS = {
  STARWIND_CORE: "@starwind-ui/core",
  STARWIND_CORE_COMPONENTS: "src/components",
  STARWIND_REMOTE_COMPONENT_REGISTRY: "https://starwind.dev/registry.json",
  STARWIND_PRO_REGISTRY: "https://pro.starwind.dev/r/{name}",
  LOCAL_CSS_FILE: "src/styles/starwind.css",
  LOCAL_CONFIG_FILE: "starwind.config.json",
  LOCAL_STYLES_DIR: "src/styles",
  LOCAL_COMPONENTS_DIR: "src/components",
} as const;

/**
 * Core framework dependencies
 */
export const ASTRO_PACKAGES = {
  core: "astro@latest",
} as const;

/**
 * Tailwind CSS and other dependencies
 */
export const OTHER_PACKAGES = {
  tailwindCore: "tailwindcss@^4",
  tailwindVite: "@tailwindcss/vite@^4",
  tailwindForms: "@tailwindcss/forms@^0.5",
  tailwindAnimate: "tw-animate-css@^1",
  tailwindVariants: "tailwind-variants@^2",
  tailwindMerge: "tailwind-merge@^3",
  tablerIcons: "@tabler/icons@^3",
} as const;

/**
 * Get all Tailwind CSS related packages as an array
 */
export function getOtherPackages(): string[] {
  return Object.values(OTHER_PACKAGES);
}

/**
 * Get all Astro related packages as an array
 */
export function getAstroPackages(): string[] {
  return Object.values(ASTRO_PACKAGES);
}
