import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { appendRuntimeTypeFacades, PRIMITIVE_COMPONENTS } from "../renderers/primitive-index.js";

describe("primitive index runtime facades", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-primitive-index-"));

    await Promise.all(
      PRIMITIVE_COMPONENTS.map(async (component) => {
        const dir = path.join(tempRoot, component);
        await mkdir(dir, { recursive: true });
        await writeFile(
          path.join(dir, "index.ts"),
          `export const ${toIdentifier(component)} = null;\n`,
        );
      }),
    );
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  it("does not treat non-exported identifier occurrences as existing runtime facades", async () => {
    const formIndexPath = path.join(tempRoot, "form", "index.ts");
    await writeFile(
      formIndexPath,
      `const createForm = "local helper only";
type FormExternalErrors = { field: string };
export const Form = {};
`,
    );

    await appendRuntimeTypeFacades(tempRoot);

    const contents = await readFile(formIndexPath, "utf8");

    expect(contents).toContain(
      'export { createForm, createFormSchemaValidator, validateFormSchema } from "@starwind-ui/runtime/form";',
    );
    expect(contents).toContain(
      "export type { FormExternalErrors, FormSchemaResult, FormValidationTiming, FormValues } from",
    );
  });
});

function toIdentifier(value: string): string {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}
