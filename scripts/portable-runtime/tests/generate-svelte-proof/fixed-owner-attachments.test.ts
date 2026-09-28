import { createRequire } from "node:module";
import path from "node:path";
import { expect, it } from "vitest";

import { createDistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { verifyFixedOwnerAttachments } from "../../../../packages/svelte/tests/fixed-owner-attachments-browser.js";

it("forwards attachments through fixed roots, parts, and semantic child owners", async () => {
  const repoRoot = process.cwd();
  const vite = createRequire(path.join(repoRoot, "package.json")).resolve("vite");
  const esbuild = createRequire(vite).resolve("esbuild/package.json");
  const consumer = await createDistConsumer({
    packageRoot: `${repoRoot}/packages/svelte`,
    additionalPackages: [
      { name: "esbuild", from: vite },
      { name: `@esbuild/${process.platform}-${process.arch}`, from: esbuild },
    ],
  });
  try {
    await expect(verifyFixedOwnerAttachments(consumer)).resolves.toBeUndefined();
  } finally {
    await consumer.dispose();
  }
}, 60_000);
