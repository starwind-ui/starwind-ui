import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { setupLayoutCssImport } from "../../src/utils/layout.js";

const cssFile = "src/styles/starwind.css";
const cssImport = 'import "@/styles/starwind.css";';

describe("Astro CSS import setup", () => {
  let cwd: string;
  let project: string;

  beforeEach(async () => {
    cwd = process.cwd();
    project = await mkdtemp(join(tmpdir(), "starwind-css-import-"));
    process.chdir(project);
  });

  afterEach(async () => {
    process.chdir(cwd);
    await rm(project, { recursive: true, force: true });
  });

  async function fixture(path: string, content: string) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }

  it("imports CSS in the minimal starter page and leaves one import after a second run", async () => {
    const path = "src/pages/index.astro";
    await fixture(path, "---\n---\n<html><body>Hello</body></html>\n");
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "added", path });
    expect(await readFile(path, "utf8")).toBe(
      `---\n${cssImport}\n---\n<html><body>Hello</body></html>\n`,
    );
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "present", path });
    expect((await readFile(path, "utf8")).split(cssImport)).toHaveLength(2);
  });

  it.each(["Layout", "BaseLayout"])(
    "preserves %s imports and markup and prefers it to the page",
    async (name) => {
      const path = `src/layouts/${name}.astro`;
      const content =
        '---\r\nimport Header from "../components/Header.astro";\r\nconst title = "Hello";\r\n---\r\n<Header /><slot />\r\n';
      await fixture(path, content);
      await fixture("src/pages/index.astro", "<html>Hello</html>");
      expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "added", path });
      expect(await readFile(path, "utf8")).toBe(
        content.replace("---\r\n", `---\r\n${cssImport}\r\n`),
      );
      expect(await readFile("src/pages/index.astro", "utf8")).toBe("<html>Hello</html>");
    },
  );

  it("creates frontmatter for a page that has none", async () => {
    await fixture("src/pages/index.astro", "<html>Hello</html>");
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "added" });
    expect(await readFile("src/pages/index.astro", "utf8")).toBe(
      `---\n${cssImport}\n---\n\n<html>Hello</html>`,
    );
  });

  it("recognizes an existing relative import", async () => {
    const content = "---\nimport '../styles/starwind.css';\n---\n<html />";
    await fixture("src/pages/index.astro", content);
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "present" });
    expect(await readFile("src/pages/index.astro", "utf8")).toBe(content);
  });

  it("does not count a commented import as an active import", async () => {
    await fixture("src/pages/index.astro", `---\n// ${cssImport}\n---\n<html />`);
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({ status: "added" });
    expect(await readFile("src/pages/index.astro", "utf8")).toContain(`---\n${cssImport}\n//`);
  });

  it("provides an exact manual step when no known target exists", async () => {
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({
      status: "manual",
      message: expect.stringContaining(cssImport),
    });
  });

  it("leaves malformed frontmatter untouched and gives a manual step", async () => {
    const content = "---\nconst title = ;\n---\n<html />";
    await fixture("src/pages/index.astro", content);
    expect(await setupLayoutCssImport(cssFile)).toMatchObject({
      status: "manual",
      message: expect.stringContaining(cssImport),
    });
    expect(await readFile("src/pages/index.astro", "utf8")).toBe(content);
  });
});
