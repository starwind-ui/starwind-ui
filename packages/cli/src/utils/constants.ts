export const MIN_ASTRO_VERSION = "5.0.0";

/**
 * File system paths used throughout the application
 */
export const PATHS = {
  STARWIND_DOCS_BASE_URL: "https://starwind.dev/docs/components",
  STARWIND_PRO_REGISTRY: "https://pro.starwind.dev/r/{name}",
  LOCAL_CSS_FILE: "src/styles/starwind.css",
  LOCAL_CONFIG_FILE: "starwind.config.json",
  LOCAL_STYLES_DIR: "src/styles",
  LOCAL_COMPONENTS_DIR: "src/components",
  LOCAL_STARWIND_COMPONENTS_DIR: "src/components/starwind",
  LOCAL_STARWIND_PRIMITIVES_DIR: "src/components/starwind-primitives",
  LOCAL_UTILS_DIR: "src/lib/utils",
  VSCODE_DIR: ".vscode",
  VSCODE_SNIPPETS_FILE: ".vscode/starwind.code-snippets",
} as const;

/**
 * Core framework dependencies
 */
export const ASTRO_PACKAGES = {
  core: "astro@latest",
} as const;

/**
 * Get all Astro related packages as an array
 */
export function getAstroPackages(): string[] {
  return Object.values(ASTRO_PACKAGES);
}
