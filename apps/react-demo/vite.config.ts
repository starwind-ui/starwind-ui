import { fileURLToPath } from "node:url";
import { getThemeInitScript } from "@starwind-ui/react/theme";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const runtimeSource = fileURLToPath(new URL("../../packages/runtime/src", import.meta.url));
const reactPrimitiveSource = fileURLToPath(new URL("../../packages/react/src", import.meta.url));

function starwindThemeInitPlugin(): Plugin {
  return {
    name: "starwind-theme-init",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { "data-starwind-theme-init": "" },
          children: getThemeInitScript(),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [starwindThemeInitPlugin(), react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@starwind-ui\/react\/(.+)$/,
        replacement: `${reactPrimitiveSource}/$1/index.ts`,
      },
      {
        find: "@starwind-ui/react",
        replacement: `${reactPrimitiveSource}/index.ts`,
      },
      // Local dev resolver for the framework package's Runtime dependency.
      // The demo app does not declare Runtime directly.
      {
        find: /^@starwind-ui\/runtime\/init-starwind$/,
        replacement: `${runtimeSource}/init-starwind.ts`,
      },
      {
        find: /^@starwind-ui\/runtime\/theme$/,
        replacement: `${runtimeSource}/theme/theme.ts`,
      },
      {
        find: /^@starwind-ui\/runtime\/(.+)$/,
        replacement: `${runtimeSource}/components/$1/index.ts`,
      },
      {
        find: "@starwind-ui/runtime",
        replacement: `${runtimeSource}/index.ts`,
      },
    ],
  },
});
