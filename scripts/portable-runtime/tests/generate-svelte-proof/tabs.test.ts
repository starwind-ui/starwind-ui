import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { getPrimitiveGeneratorEntries } from "../../renderers/primitive-generator-registry.js";

async function readTabs(root: string) {
  const names = (await readdir(path.join(root, "tabs"))).sort();
  return new Map(
    await Promise.all(
      names.map(
        async (name) =>
          ["tabs/" + name, await readFile(path.join(root, "tabs", name), "utf8")] as const,
      ),
    ),
  );
}
it("generates the five Tabs parts with a private target context", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-tabs-"));
  try {
    await getPrimitiveGeneratorEntries()
      .find((entry) => entry.component === "tabs")!
      .generateTarget({ componentHeader: "", moduleHeader: "", outputRoot, target: "svelte" });
    const first = await readTabs(outputRoot);
    expect([...first.keys()].sort()).toEqual([
      "tabs/TabsContext.ts",
      "tabs/TabsIndicator.svelte",
      "tabs/TabsList.svelte",
      "tabs/TabsPanel.svelte",
      "tabs/TabsRoot.svelte",
      "tabs/TabsTab.svelte",
      "tabs/index.ts",
    ]);
    expect(first.get("tabs/index.ts")).not.toContain("TabsContext");
    const root = first.get("tabs/TabsRoot.svelte")!;
    expect(root).toContain("initialSyncKey=untrack(()=>syncKey)");
    expect(root).toContain("syncKey:initialSyncKey");
    expect(root).toContain("data-sync-key={initialSyncKey}");
    expect(root).not.toContain("appliedSyncKey");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

import { createStyledTabsConsumer } from "../../../../packages/svelte/tests/styled-tabs-consumer.js";

import { verifyTabs } from "../../../../packages/svelte/tests/tabs-browser.js";

it("hydrates Primitive Tabs models, collections, storage and lifecycle", async () => {
  const consumer = await createStyledTabsConsumer(process.cwd());
  try {
    await verifyTabs(consumer);
  } finally {
    await consumer.dispose();
  }
}, 60000);
