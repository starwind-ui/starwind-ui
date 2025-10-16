// @ts-check
import compress from "@playform/compress";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [
    compress({
      HTML: true,
      JavaScript: true,
      CSS: false,
      Image: false, // astro:assets handles this. Enabling this can dramatically increase build times
      SVG: false, // astro-icon handles this
    }),
  ],
  // adapter: cloudflare({
  // 	imageService: "compile",
  // }),

  vite: {
    plugins: [tailwindcss()],
    // ssr: {
    // 	external: ["stream", "util", "os", "fs", "svgo"],
    // },
  },
});
