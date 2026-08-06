import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { getVueStyledPublicContract } from "../../renderers/framework-adapters/vue/styled/public-contracts.js";

export const PORTABLE_STYLED_CLOSURE = [
  "alert",
  "aspect-ratio",
  "badge",
  "breadcrumb",
  "button-group",
  "card",
  "input-group",
  "item",
  "kbd",
  "label",
  "native-select",
  "pagination",
  "prose",
  "separator",
  "skeleton",
  "spinner",
  "table",
  "textarea",
  "video",
] as const;

const REVIEWED_PUBLIC_CONTRACTS = {
  "input-group:InputGroupButton": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Button>['$props'], 'class' | 'style'>",
        target: { component: "button", exportName: "Button" },
      },
    ],
  },
  "input-group:InputGroupInput": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Input>['$props'], 'class' | 'style'>",
        target: { component: "input", exportName: "Input" },
      },
    ],
  },
  "input-group:InputGroupTextarea": {
    componentSpreadExpressions: [
      {
        code: "attrs as Omit<InstanceType<typeof Textarea>['$props'], 'class' | 'style'>",
        target: { component: "textarea", exportName: "Textarea" },
      },
    ],
  },
  "textarea:Textarea": {
    fields: [{ name: "data-slot", optional: true, type: "string" }],
  },
} as const;

const PROJECTOR_ROOT = path.join(
  process.cwd(),
  "scripts/portable-runtime/renderers/framework-adapters/vue/styled",
);

describe("Vue portable Styled depth baseline", () => {
  it("keeps closure identities out of projector control flow and handwritten inputs", async () => {
    const sources = await readProductionProjectorSources();
    expect(findProhibitedIdentityImplementation(sources)).toEqual([]);
  });

  it("rejects representative component branches, printers, behavior, lifecycle, and SFC inputs", () => {
    const invalid = {
      "branch.ts": 'if (groupName === "badge") return projectGeneric();',
      "behavior.ts": 'if (component.component === "video") installVideoBehavior();',
      "export-branch.ts": 'if (exportName === "Badge") return projectGeneric();',
      "lifecycle.ts": 'if (groupName === "table") onMounted(connectTable);',
      "map.ts": "const projectors = { card: projectCard };",
      "nested/printer.ts": "function renderPagination() { return serializeVueSfc(model); }",
      "nested/raw-source.ts": 'import source from "../badge/Badge.vue?raw";',
      "nested/video/Video.vue": "<template><video /></template>",
      "source.ts": 'const source = readFile("input-group/InputGroup.vue");',
    };

    expect(findProhibitedIdentityImplementation(invalid)).toEqual([
      "behavior.ts: component-keyed control flow (video)",
      "branch.ts: component-keyed control flow (badge)",
      "export-branch.ts: export-keyed control flow (Badge)",
      "lifecycle.ts: component-keyed control flow (table)",
      "map.ts: component-keyed projector implementation (card)",
      "nested/printer.ts: component-specific projector or printer (Pagination)",
      "nested/raw-source.ts: handwritten SFC input (badge)",
      "nested/video/Video.vue: handwritten SFC input (video)",
      "source.ts: handwritten SFC input (input-group)",
    ]);
  });

  it("locks typed Vue semantic mappings apart from projector implementation", () => {
    const closureContracts = starwindStyledContracts.filter(({ component }) =>
      PORTABLE_STYLED_CLOSURE.includes(component as (typeof PORTABLE_STYLED_CLOSURE)[number]),
    );
    const actual = Object.fromEntries(
      closureContracts.flatMap((contract) =>
        contract.publicExports.flatMap((exportName) => {
          const record = getVueStyledPublicContract(contract.component, exportName);
          return Object.keys(record).length > 0
            ? [[`${contract.component}:${exportName}`, record] as const]
            : [];
        }),
      ),
    );

    expect(actual).toEqual(REVIEWED_PUBLIC_CONTRACTS);
    for (const [identity, record] of Object.entries(actual)) {
      expect(findPublicContractImplementation(identity, record)).toEqual([]);
    }
  });

  it("rejects markup, behavior, lifecycle, and source printers in public-contract data", () => {
    expect(
      findPublicContractImplementation("badge:Badge", {
        markup: "<template><span /></template>",
        setup: "onMounted(connectBadge)",
      }),
    ).toEqual([
      "badge:Badge: implementation source in typed mapping",
      "badge:Badge: prohibited public-contract key markup",
      "badge:Badge: prohibited public-contract key setup",
    ]);
  });
});

export function findProhibitedIdentityImplementation(
  sources: Readonly<Record<string, string>>,
): string[] {
  const findings: string[] = [];
  const exportNames = starwindStyledContracts
    .filter(({ component }) =>
      PORTABLE_STYLED_CLOSURE.includes(component as (typeof PORTABLE_STYLED_CLOSURE)[number]),
    )
    .flatMap(({ publicExports }) => publicExports);

  for (const [file, source] of Object.entries(sources)) {
    for (const component of PORTABLE_STYLED_CLOSURE) {
      const escaped = escapeRegExp(component);
      const branch = new RegExp(
        `(?:groupName|component\\.(?:component|groupName)|projection\\.(?:component|groupName))\\s*={2,3}\\s*["']${escaped}["']`,
      );
      const switchedBranch = new RegExp(
        `switch\\s*\\(\\s*(?:groupName|component\\.(?:component|groupName)|projection\\.(?:component|groupName))\\s*\\)[\\s\\S]*?case\\s*["']${escaped}["']`,
      );
      let classified = false;
      if (branch.test(source) || switchedBranch.test(source)) {
        findings.push(`${file}: component-keyed control flow (${component})`);
        classified = true;
      }

      const sfcInput = new RegExp(
        `(?:readFile|readFileSync|copyFile|copyFileSync)\\s*\\([^\\n]*["'][^\\n]*${escaped}[^\\n]*\\.vue`,
        "i",
      );
      if (sfcInput.test(source)) {
        findings.push(`${file}: handwritten SFC input (${component})`);
        classified = true;
      }

      const identityLiteral = new RegExp(`["']${escaped}["']`);
      const componentName = toPascalCase(component);
      const unquotedProjectorMap = new RegExp(
        `\\b${escaped}\\s*:\\s*(?:project|render|print|serialize|write|build)${componentName}\\b`,
      );
      if (!classified && (identityLiteral.test(source) || unquotedProjectorMap.test(source))) {
        findings.push(`${file}: component-keyed projector implementation (${component})`);
      }

      const staticSfcInput = new RegExp(
        `(?:import\\s+[^;\\n]+\\s+from\\s+|import\\s*\\()?["'][^"'\\n]*${escaped}[^"'\\n]*\\.vue(?:\\?raw)?["']`,
        "i",
      );
      if (staticSfcInput.test(source) && !sfcInput.test(source)) {
        findings.push(`${file}: handwritten SFC input (${component})`);
      }

      if (file.endsWith(".vue") && pathContainsComponent(file, component)) {
        findings.push(`${file}: handwritten SFC input (${component})`);
      }
    }

    for (const exportName of exportNames) {
      const exportBranch = new RegExp(
        `(?:component\\.)?exportName\\s*={2,3}\\s*["']${escapeRegExp(exportName)}["']`,
      );
      if (exportBranch.test(source)) {
        findings.push(`${file}: export-keyed control flow (${exportName})`);
      }
      const namedProjector = new RegExp(
        `(?:function|const)\\s+(?:project|render|print|serialize|write|build)${escapeRegExp(exportName)}(?:Sfc|Source|Template|Behavior|Lifecycle)?\\s*(?:\\(|=)`,
      );
      if (namedProjector.test(source)) {
        findings.push(`${file}: component-specific projector or printer (${exportName})`);
      }
    }
  }

  return [...new Set(findings)].sort();
}

export function findPublicContractImplementation(identity: string, record: unknown): string[] {
  const findings: string[] = [];
  const prohibitedKeys = new Set([
    "behavior",
    "lifecycle",
    "markup",
    "printer",
    "render",
    "setup",
    "source",
    "template",
  ]);

  visitRecord(record, (key, value) => {
    if (prohibitedKeys.has(key)) {
      findings.push(`${identity}: prohibited public-contract key ${key}`);
    }
    if (
      typeof value === "string" &&
      /<script\b|<template\b|\bonMounted\s*\(|\bonBeforeUnmount\s*\(|\bwatch\s*\(/.test(value)
    ) {
      findings.push(`${identity}: implementation source in typed mapping`);
    }
  });

  return [...new Set(findings)].sort();
}

async function readProductionProjectorSources(): Promise<Record<string, string>> {
  const files = (await listProjectorFiles(PROJECTOR_ROOT)).filter(
    (file) => path.basename(file) !== "public-contracts.ts",
  );
  return Object.fromEntries(
    await Promise.all(
      files.map(
        async (file) => [file, await readFile(path.join(PROJECTOR_ROOT, file), "utf8")] as const,
      ),
    ),
  );
}

async function listProjectorFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relativePath = path.posix.join(prefix.replaceAll("\\", "/"), entry.name);
      if (entry.isDirectory()) return listProjectorFiles(root, relativePath);
      return entry.name.endsWith(".ts") || entry.name.endsWith(".vue") ? [relativePath] : [];
    }),
  );
  return files.flat().sort();
}

function visitRecord(value: unknown, visitor: (key: string, value: unknown) => void): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => visitRecord(entry, visitor));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child);
    visitRecord(child, visitor);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPascalCase(value: string): string {
  return value.replace(/(^|-)([a-z])/g, (_match, _separator, letter: string) =>
    letter.toUpperCase(),
  );
}

function pathContainsComponent(file: string, component: string): boolean {
  const normalized = `/${file.replaceAll("\\", "/").toLowerCase()}`;
  return normalized.includes(`/${component}/`) || normalized.endsWith(`/${component}.vue`);
}
