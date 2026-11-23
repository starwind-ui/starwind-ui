import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

// tailwind-merge before 3.7 does not see `px-*` as a conflict with logical classes. Any Styled
// component that ships one must declare the 3.7 floor, or a user `px-*` override can lose.
const LOGICAL_CLASS =
  /(?<![\w-])-?(?:(?:ps|pe|ms|me|start|end|inset-s|inset-e|border-s|border-e|rounded-s|rounded-e|rounded-ss|rounded-se|rounded-es|rounded-ee|scroll-ms|scroll-me|scroll-ps|scroll-pe)-[\w.[\]/()%-]+|border-s|border-e)(?![\w-])/;

interface RegistryTarget {
  files: { content?: string }[];
  packageRequirements: { name: string; range: string }[];
}

describe("logical class tailwind-merge floor", () => {
  it("requires tailwind-merge 3.7 for every Styled target that ships a logical class", async () => {
    const registry = JSON.parse(
      await readFile(
        path.join(process.cwd(), "packages/cli/src/registry/bundled-registry.json"),
        "utf8",
      ),
    ) as { components: { name: string; targets?: Record<string, RegistryTarget> }[] };

    const missing: string[] = [];
    let checked = 0;
    for (const component of registry.components) {
      for (const [target, entry] of Object.entries(component.targets ?? {})) {
        const match = entry.files
          .map((file) => file.content?.match(LOGICAL_CLASS)?.[0])
          .find(Boolean);
        if (!match) continue;
        checked += 1;
        const merge = entry.packageRequirements.find(({ name }) => name === "tailwind-merge");
        if (merge?.range !== "^3.7.0") missing.push(`${target}:${component.name} (${match})`);
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
