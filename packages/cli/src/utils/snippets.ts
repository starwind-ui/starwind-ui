import { PATHS } from "./constants.js";
import { ensureDirectory, fileExists, readJsonFile, writeJsonFile } from "./fs.js";

const THEME_TOGGLE_SNIPPET = {
  "Starwind UI Theme Toggle": {
    prefix: "starwind-theme-toggle",
    description: "Starwind UI theme initialization script for the document head",
    body: [
      "<script is:inline>",
      "  function initTheme() {",
      '    const colorTheme = localStorage.getItem("colorTheme");',
      "    if (!colorTheme) {",
      '      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {',
      '        document.documentElement.classList.add("dark");',
      '        localStorage.setItem("colorTheme", "dark");',
      "      } else {",
      '        document.documentElement.classList.remove("dark");',
      '        localStorage.setItem("colorTheme", "light");',
      "      }",
      "    } else {",
      '      if (colorTheme === "dark") {',
      '        document.documentElement.classList.add("dark");',
      '      } else if (colorTheme === "light") {',
      '        document.documentElement.classList.remove("dark");',
      '      } else if (colorTheme === "system") {',
      '        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;',
      '        document.documentElement.classList.toggle("dark", prefersDark);',
      "      }",
      "    }",
      "  }",
      "",
      "  initTheme();",
      '  document.addEventListener("astro:after-swap", initTheme);',
      "</script>",
    ],
  },
};

/**
 * Sets up VS Code snippets for Starwind UI.
 * Creates or merges snippets into .vscode/astro.json or .vscode/starwind.code-snippets.
 */
export async function setupSnippets() {
  await ensureDirectory(PATHS.VSCODE_DIR);

  let targetPath = PATHS.VSCODE_SNIPPETS_FILE;
  let existingSnippets: Record<string, any> = {};

  // Check if astro.json exists (as requested by user)
  if (await fileExists(PATHS.VSCODE_ASTRO_SNIPPETS_FILE)) {
    targetPath = PATHS.VSCODE_ASTRO_SNIPPETS_FILE;
    try {
      existingSnippets = await readJsonFile(PATHS.VSCODE_ASTRO_SNIPPETS_FILE);
    } catch (error) {
      // If file is empty or invalid JSON, start with empty object
      existingSnippets = {};
    }
  } else if (await fileExists(PATHS.VSCODE_SNIPPETS_FILE)) {
    try {
      existingSnippets = await readJsonFile(PATHS.VSCODE_SNIPPETS_FILE);
    } catch (error) {
      existingSnippets = {};
    }
  }

  const updatedSnippets = {
    ...existingSnippets,
    "Starwind UI Theme Toggle": {
      ...THEME_TOGGLE_SNIPPET["Starwind UI Theme Toggle"],
    },
  };

  // Add scope: "astro" if we are using .code-snippets extension
  if (targetPath.endsWith(".code-snippets")) {
    (updatedSnippets["Starwind UI Theme Toggle"] as any).scope = "astro";
  }

  await writeJsonFile(targetPath, updatedSnippets);

  return true;
}
