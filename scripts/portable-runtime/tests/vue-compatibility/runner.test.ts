import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import {
  type AcceptedDiagnostics,
  acceptedDiagnosticsFrom,
  checkDeclarationDiagnostics,
  type DeclarationDiagnostic,
  exportImportScript,
  installVueCompatibilityConsumer,
  readVuePacks,
  runVueCompatibility,
  typeDiagnostics,
  type VueCompatibilityResult,
  type VuePacks,
  vueCompatibilityVersions,
} from "../../check-vue-compatibility.js";

const owned: string[] = [];
async function temporary() {
  const root = await mkdtemp(path.join(os.tmpdir(), "vue-compatibility-unit-"));
  owned.push(root);
  return root;
}
afterEach(async () => {
  await Promise.all(owned.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const packs: VuePacks = {
  runtime: { tarball: "/packs/runtime.tgz", version: "1.6.0" },
  vue: { tarball: "/packs/vue.tgz", version: "1.6.0", peerRange: ">=3.5" },
};
const ACCORDION = "@starwind-ui/vue/dist/accordion/index.d.ts";
const DIALOG = "@starwind-ui/vue/dist/dialog/index.d.ts";
const GLOBAL_MESSAGE =
  "Type 'GlobalComponents' does not satisfy the constraint 'Record<string, Component>'.";
const global = (file: string, count: number): DeclarationDiagnostic => ({
  file,
  code: "TS2344",
  message: GLOBAL_MESSAGE,
  count,
});
const ARITY: DeclarationDiagnostic = {
  file: "@starwind-ui/vue/dist/accordion/AccordionHeader.vue.d.ts",
  code: "TS2707",
  message: "Generic type 'DefineComponent' requires between 0 and 19 type arguments.",
  count: 1,
};
const GLOBAL = global(ACCORDION, 2);
const accepted: AcceptedDiagnostics = {
  code: "TS2344",
  messagePrefix: "Type 'GlobalComponents' does not satisfy the constraint",
  occurrences: { [ACCORDION]: 2 },
};

function result(
  version: string,
  root: string,
  options: { failures?: string[]; diagnostics?: DeclarationDiagnostic[] } = {},
): VueCompatibilityResult {
  return {
    version,
    root,
    provenance: {} as VueCompatibilityResult["provenance"],
    types: { files: ["consumer.ts"], declarationDiagnostics: options.diagnostics ?? [GLOBAL] },
    exports: ["@starwind-ui/vue"],
    styled: { files: 1 },
    hydration: "passed",
    failures: options.failures ?? [],
  };
}

describe("Vue peer floor compatibility", () => {
  it("derives the floor from the packed peer range and ends with the built version", () => {
    expect(vueCompatibilityVersions(">=3.5", "3.5.42")).toEqual(["3.5.0", "3.5.42"]);
    expect(vueCompatibilityVersions(">=3.5.21", "3.5.42")).toEqual(["3.5.21", "3.5.42"]);
    expect(() => vueCompatibilityVersions(">=3.6", "3.5.42")).toThrow("outside");
  });

  it("imports a JSON export-map entry with the JSON import attribute", async () => {
    const root = await temporary();
    const pkg = path.join(root, "node_modules/fixture-package");
    await mkdir(pkg, { recursive: true });
    await writeFile(
      path.join(pkg, "package.json"),
      JSON.stringify({
        name: "fixture-package",
        type: "module",
        exports: { ".": "./index.js", "./package.json": "./package.json" },
      }),
    );
    await writeFile(path.join(pkg, "index.js"), "export const value = 1;\n");
    await writeFile(
      path.join(root, "import-exports.mjs"),
      exportImportScript(["fixture-package", "fixture-package/package.json"]),
    );
    const { stdout } = await promisify(execFile)(process.execPath, ["import-exports.mjs"], {
      cwd: root,
    });
    expect(stdout.trim()).toBe("2");
  });

  it("reads the accepted Runtime and Vue archives and rejects a changed archive", async () => {
    const directory = await temporary();
    const write = async (file: string, content: string) => {
      await writeFile(path.join(directory, file), content);
      return createHash("sha256").update(content).digest("hex");
    };
    const runtimeHash = await write("runtime.tgz", "runtime");
    const vueHash = await write("vue.tgz", "vue");
    const manifest = {
      schemaVersion: 2,
      packages: {
        runtime: {
          name: "@starwind-ui/runtime",
          version: "1.6.0",
          file: "runtime.tgz",
          sha256: runtimeHash,
          manifest: {},
        },
        vue: {
          name: "@starwind-ui/vue",
          version: "1.6.0",
          file: "vue.tgz",
          sha256: vueHash,
          manifest: { peerDependencies: { vue: ">=3.5" } },
        },
      },
    };
    await writeFile(path.join(directory, "manifest.json"), JSON.stringify(manifest));
    await expect(readVuePacks(directory)).resolves.toEqual({
      runtime: { tarball: path.join(directory, "runtime.tgz"), version: "1.6.0" },
      vue: { tarball: path.join(directory, "vue.tgz"), version: "1.6.0", peerRange: ">=3.5" },
    });
    await writeFile(path.join(directory, "vue.tgz"), "changed");
    await expect(readVuePacks(directory)).rejects.toThrow("Accepted archive changed");
  });

  it("installs one exact Vue version with the packed archives bound by overrides", async () => {
    const root = await temporary();
    const calls: Array<{ file: string; args: string[]; cwd: string }> = [];
    await installVueCompatibilityConsumer(root, "3.5.0", packs, async (file, args, cwd) => {
      calls.push({ file, args, cwd });
      return { stdout: "", stderr: "" };
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.cwd).toBe(root);
    expect(calls[0]!.args).toEqual(
      expect.arrayContaining([
        "--save-exact",
        "vue@3.5.0",
        "typescript@5.9.3",
        "--config.link-workspace-packages=false",
        path.join(root, ".pnpm-store"),
      ]),
    );
  });

  it("accepts only the pinned GlobalComponents occurrences on every version", () => {
    expect(() =>
      checkDeclarationDiagnostics(
        [result("3.5.21", "/a", { diagnostics: [global(ACCORDION, 1)] }), result("3.5.42", "/b")],
        accepted,
      ),
    ).not.toThrow();
  });

  it.each([
    ["the floor", "3.5.21"],
    ["the built version", "3.5.42"],
  ])("fails a new diagnostic on %s", (_name, version) => {
    const results = ["3.5.21", "3.5.42"].map((selected) =>
      result(selected, "/a", {
        diagnostics: selected === version ? [ARITY, GLOBAL] : [GLOBAL],
      }),
    );
    expect(() => checkDeclarationDiagnostics(results, accepted)).toThrow(
      `Vue ${version}:\n  ${ARITY.file}: TS2707 x1: ${ARITY.message}`,
    );
  });

  it.each([
    ["a new file", [GLOBAL, global(DIALOG, 1)], `${DIALOG}: TS2344 x1, pinned x0`],
    ["a pinned file", [global(ACCORDION, 3)], `${ACCORDION}: TS2344 x3, pinned x2`],
  ])("fails a new GlobalComponents occurrence in %s", (_name, diagnostics, message) => {
    expect(() =>
      checkDeclarationDiagnostics(
        [result("3.5.21", "/a"), result("3.5.42", "/b", { diagnostics })],
        accepted,
      ),
    ).toThrow(message);
  });

  it("counts a diagnostic without a file location as unexpected", () => {
    const missingTypes = "Cannot find type definition file for 'node'.";
    const diagnostics = typeDiagnostics(
      [
        `error TS2688: ${missingTypes}`,
        `node_modules/.pnpm/x/node_modules/${ACCORDION}(9,1): error TS2344: ${GLOBAL_MESSAGE}`,
        `node_modules/.pnpm/x/node_modules/${ACCORDION}(30,1): error TS2344: ${GLOBAL_MESSAGE}`,
      ].join("\n"),
    );
    expect(diagnostics).toContainEqual({
      file: "<global>",
      code: "TS2688",
      message: missingTypes,
      count: 1,
    });
    expect(() =>
      checkDeclarationDiagnostics(
        [result("3.5.21", "/a"), result("3.5.42", "/b", { diagnostics })],
        accepted,
      ),
    ).toThrow(`<global>: TS2688 x1: ${missingTypes}`);
  });

  it("names the refresh command when a pinned count is exceeded", () => {
    expect(() =>
      checkDeclarationDiagnostics(
        [result("3.5.42", "/b", { diagnostics: [global(ACCORDION, 3)] })],
        accepted,
      ),
    ).toThrow("pnpm vue:compatibility --packs=<dir> --write-accepted-diagnostics");
  });

  it("pins the GlobalComponents occurrences and refuses to pin another diagnostic", () => {
    expect(
      acceptedDiagnosticsFrom(
        [
          result("3.5.21", "/a", { diagnostics: [global(DIALOG, 4)] }),
          result("3.5.42", "/b", { diagnostics: [global(ACCORDION, 2), global(DIALOG, 1)] }),
        ],
        { ...accepted, occurrences: {} },
      ).occurrences,
    ).toEqual({ [ACCORDION]: 2, [DIALOG]: 4 });
    expect(() =>
      acceptedDiagnosticsFrom([result("3.5.42", "/b", { diagnostics: [ARITY] })], accepted),
    ).toThrow("cannot be pinned");
  });

  it("groups compiler output by pack-relative file, code and message", () => {
    expect(
      typeDiagnostics(
        [
          `node_modules/.pnpm/@starwind-ui+vue@file+abc/node_modules/${ARITY.file}(4,27): error ${ARITY.code}: ${ARITY.message}`,
          `node_modules/.pnpm/@starwind-ui+vue@file+def/node_modules/${ACCORDION}(9,1): error TS2344: ${GLOBAL_MESSAGE}`,
          `node_modules/.pnpm/@starwind-ui+vue@file+def/node_modules/${ACCORDION}(30,1): error TS2344: ${GLOBAL_MESSAGE}`,
          "Found 3 errors.",
        ].join("\n"),
      ),
    ).toEqual([ARITY, GLOBAL]);
  });

  it("runs every version, cleans each consumer, and reports each failing version", async () => {
    const root = await temporary();
    const created: string[] = [];
    await expect(
      runVueCompatibility({
        packsDirectory: "/packs",
        versions: ["3.5.0", "3.5.42"],
        readPacks: async () => packs,
        acceptedDiagnostics: accepted,
        createConsumer: async (version) => {
          const consumer = path.join(root, version);
          await mkdir(consumer);
          created.push(consumer);
          return consumer;
        },
        verifyConsumer: async (consumer, version) =>
          version === "3.5.0"
            ? result(version, consumer, {
                failures: ["hydration: Cannot read properties of null (reading 'type')"],
                diagnostics: [ARITY, GLOBAL],
              })
            : result(version, consumer),
        log: () => {},
      }),
    ).rejects.toThrow(
      /Vue 3\.5\.0 failed 1 checks:\nhydration: Cannot read properties of null[\s\S]*Vue 3\.5\.0:\n  .*TS2707/,
    );
    expect(created).toHaveLength(2);
    for (const consumer of created) await expect(access(consumer)).rejects.toThrow();
  });

  it("returns every result when each version passes", async () => {
    const root = await temporary();
    const messages: string[] = [];
    const results = await runVueCompatibility({
      packsDirectory: "/packs",
      versions: ["3.5.21", "3.5.42"],
      readPacks: async () => packs,
      acceptedDiagnostics: accepted,
      createConsumer: async (version) => {
        const consumer = path.join(root, version);
        await mkdir(consumer);
        return consumer;
      },
      verifyConsumer: async (consumer, version) => result(version, consumer),
      log: (message) => messages.push(message),
    });
    expect(results.map(({ version }) => version)).toEqual(["3.5.21", "3.5.42"]);
    expect(messages.filter((message) => message.includes(" passed:"))).toHaveLength(2);
  });
});
