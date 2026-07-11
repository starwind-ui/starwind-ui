// @ts-check
import { fileURLToPath } from "node:url";

import compress from "@playform/compress";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const runtimeSource = fileURLToPath(new URL("../../packages/runtime/src", import.meta.url));

// https://astro.build/config
export default defineConfig({
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  integrations: [
    compress({
      HTML: true,
      JavaScript: true,
      CSS: false,
      Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
      SVG: false, // astro-icon handles this
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "houston",
    },
  },
  image: {
    domains: ["images.unsplash.com"],
  },
  // adapter: cloudflare({
  // 	imageService: "compile",
  // }),

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: [
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
    optimizeDeps: {
      include: ["embla-carousel", "embla-carousel-autoplay", "tailwind-variants"],
    },
    // ssr: {
    // 	external: ["stream", "util", "os", "fs", "svgo"],
    // },
  },
});
