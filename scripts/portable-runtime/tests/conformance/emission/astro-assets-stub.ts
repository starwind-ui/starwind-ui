// `astro:assets` exists only inside Astro's Vite build. The emission check needs the attributes
// that AvatarImage passes to the image, so a plain `img` stands in for it.
export { default as Image } from "./AstroImageStub.astro";
