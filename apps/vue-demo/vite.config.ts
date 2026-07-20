import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";

import { getThemeInitScript } from "../../packages/runtime/src/theme/theme";

const runtimeSource = fileURLToPath(new URL("../../packages/runtime/src", import.meta.url));
const vuePrimitiveSource = fileURLToPath(new URL("../../packages/vue/src", import.meta.url));

export function createThemeInitTags(): HtmlTagDescriptor[] {
  return [
    {
      tag: "script",
      attrs: { "data-starwind-theme-init": "" },
      children: getThemeInitScript(),
      injectTo: "head-prepend",
    },
  ];
}

export function starwindThemeInitPlugin(): Plugin {
  return {
    name: "starwind-theme-init",
    transformIndexHtml: createThemeInitTags,
  };
}

export default defineConfig({
  plugins: [starwindThemeInitPlugin(), vue(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^@starwind-ui\/vue\/(.+)$/,
        replacement: `${vuePrimitiveSource}/$1/index.ts`,
      },
      {
        find: "@starwind-ui/vue",
        replacement: `${vuePrimitiveSource}/index.ts`,
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
