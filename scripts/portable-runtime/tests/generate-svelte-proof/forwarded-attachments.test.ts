import { createRequire } from "node:module";
import path from "node:path";
import { expect, it } from "vitest";
import { createDistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { verifyForwardedAttachmentIsolation } from "../../../../packages/svelte/tests/forwarded-attachments-browser.js";

it("tracks forwarded attachment bodies independently across all shared-helper consumers", async () => {
  const repoRoot = process.cwd();
  const vite = createRequire(path.join(repoRoot, "package.json")).resolve("vite");
  const esbuild = createRequire(vite).resolve("esbuild/package.json");
  const consumer = await createDistConsumer({
    packageRoot: path.join(repoRoot, "packages/svelte"),
    additionalPackages: [
      { name: "esbuild", from: vite },
      { name: `@esbuild/${process.platform}-${process.arch}`, from: esbuild },
    ],
  });
  try {
    const result = await verifyForwardedAttachmentIsolation(consumer);
    expect(result).toMatchObject({ hydrated: true, remaining: 0 });
  } finally {
    await consumer.dispose();
  }
}, 60_000);
