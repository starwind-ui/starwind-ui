import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export async function startAstroSmokeDevServer({ root, host, port, astroPackagePath }) {
  const astroRequire = createRequire(astroPackagePath);
  const { dev } = await import(pathToFileURL(astroRequire.resolve("astro")).href);

  // The CLI can detach itself in agent environments. Own the server through Astro's API.
  return dev({
    root,
    server: { host, port },
    vite: { server: { strictPort: true } },
  });
}
