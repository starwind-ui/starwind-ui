import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const runtimeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const shellBackedOverlayControllers = [
  "dialog",
  "popover",
  "tooltip",
  "preview-card",
  "menu",
  "select",
  "combobox",
] as const;

const delegatedOverlayControllers = [
  { component: "alert-dialog", delegatesTo: "createDialog" },
  { component: "drawer", delegatesTo: "createDialog" },
  { component: "context-menu", delegatesTo: "createMenu" },
] as const;

describe("overlay open-change source guard", () => {
  it("keeps migrated overlay controllers on the shared shell", async () => {
    for (const component of shellBackedOverlayControllers) {
      const source = await readComponentController(component);

      expect(source, component).toContain("runOverlayOpenChangeShell");
      expect(source, component).toContain("createCancelableDetails");
      expect(source, component).not.toContain("starwind:open-change");
    }
  });

  it("keeps delegated overlay controllers on their shared family controller", async () => {
    for (const { component, delegatesTo } of delegatedOverlayControllers) {
      const source = await readComponentController(component);

      expect(source, component).toContain(delegatesTo);
      expect(source, component).not.toContain("createOpenChangeDetails");
      expect(source, component).not.toContain("starwind:open-change");
    }
  });
});

async function readComponentController(component: string): Promise<string> {
  return readFile(
    path.join(runtimeRoot, "src", "components", component, `${component}.ts`),
    "utf8",
  );
}
