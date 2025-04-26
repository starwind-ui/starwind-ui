// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import compress from "@playform/compress";

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
	experimental: {
		svg: true,
	},

	vite: {
		plugins: [tailwindcss()],
		// ssr: {
		// 	external: ["stream", "util", "os", "fs", "svgo"],
		// },
	},
});
