import { PATHS } from "./constants.js";
import { ensureDirectory, fileExists, readJsonFile, writeJsonFile } from "./fs.js";

const THEME_TOGGLE_SNIPPET = {
  "Starwind UI Theme Toggle": {
    prefix: "starwind-theme-toggle",
    description: "Starwind UI theme initialization script for the document head",
    scope: "astro,typescript",
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
 * Creates or merges snippets into .vscode/starwind.code-snippets.
 */
export async function setupSnippets() {
  await ensureDirectory(PATHS.VSCODE_DIR);

  const targetPath = PATHS.VSCODE_SNIPPETS_FILE;
  let existingSnippets: Record<string, any> = {};

  if (await fileExists(targetPath)) {
    try {
      existingSnippets = await readJsonFile(targetPath);
    } catch (error) {
      // If file is empty or invalid JSON, start with empty object
      existingSnippets = {};
    }
  }

  const updatedSnippets = {
    ...existingSnippets,
    "Starwind UI Theme Toggle": {
      ...THEME_TOGGLE_SNIPPET["Starwind UI Theme Toggle"],
    },
  };

  await writeJsonFile(targetPath, updatedSnippets);

  return true;
}
