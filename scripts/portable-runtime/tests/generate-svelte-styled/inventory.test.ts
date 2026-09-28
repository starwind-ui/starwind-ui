import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  svelteInventory,
  validateSvelteInventory,
} from "../../renderers/framework-adapters/svelte/inventory.js";
import { load } from "../../../../apps/svelte-demo/src/routes/review/+page.server.js";

const implemented = svelteInventory.styled
  .filter((entry) => entry.status === "implemented")
  .map((entry) => entry.component);

describe("Svelte Styled review inventory", () => {
  it("covers every implemented root with exactly one marked review section", async () => {
    const directory = path.resolve("apps/svelte-demo/src/lib/review");
    const sections = (
      await Promise.all(
        (await readdir(directory))
          .filter((name) => name.endsWith("Review.svelte"))
          .map(async (name) => {
            const source = await readFile(path.join(directory, name), "utf8");
            return [...source.matchAll(/<section\b[^>]*data-styled-review="([^"]+)"/g)].map(
              (match) => match[1]!,
            );
          }),
      )
    ).flat();
    validateSvelteInventory(svelteInventory, {
      reviewSections: sections,
      requireStyledClosure: true,
    });
    expect(implemented).toHaveLength(54);
    expect(new Set(sections).size).toBe(54);
    expect(load().catalog).toHaveLength(53);
    expect(load().pages).toHaveLength(1);
    expect([...sections].sort()).toEqual([...implemented].sort());
    expect(load().catalog.map((entry) => entry.component)).toEqual(
      implemented.filter((name) => name !== "sidebar"),
    );
    expect(load().pages).toEqual([{ component: "sidebar", href: "/review/sidebar/" }]);
    const general = await readFile("apps/svelte-demo/src/routes/review/+page.svelte", "utf8");
    const sidebar = await readFile(
      "apps/svelte-demo/src/routes/review/sidebar/+page.svelte",
      "utf8",
    );
    expect(general).not.toContain("SidebarReview");
    expect(general).toContain("data.pages");
    expect(sidebar.match(/<SidebarReview\s*\/>/g)).toHaveLength(1);
  });

  it.each([
    [
      "missing",
      implemented.filter((component) => component !== "button"),
      /missing review section "button"/,
    ],
    ["duplicate", [...implemented, "button"], /duplicate review section "button"/],
    [
      "unimplemented",
      [...implemented, "unimplemented-example"],
      /unimplemented review section "unimplemented-example"/,
    ],
  ])("reports a %s review section", (_label, reviewSections, message) => {
    expect(() => validateSvelteInventory(svelteInventory, { reviewSections })).toThrow(message);
  });
});
