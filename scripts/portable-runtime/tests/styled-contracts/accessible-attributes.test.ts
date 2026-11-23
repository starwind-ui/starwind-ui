import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AttributeContract, StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const repoRoot = process.cwd();

const STYLED_OUTPUT_ROOTS = [
  "apps/demo/src/components/starwind-runtime",
  "apps/react-demo/src/components/starwind-runtime",
  "apps/vue-demo/src/components/starwind-runtime",
  "apps/svelte-demo/src/lib/starwind-runtime",
] as const;

const STYLED_SOURCE_EXTENSIONS = new Set([".astro", ".tsx", ".vue", ".svelte"]);

function elementContract(
  component: string,
  attrs: NonNullable<
    Extract<
      StyledAdapterContract["components"][number]["render"][number],
      { type: "element" }
    >["attrs"]
  >,
): StyledAdapterContract {
  return {
    component,
    publicExports: ["Fixture"],
    defaultExport: { Root: "Fixture" },
    components: [
      {
        exportName: "Fixture",
        props: { extends: [{ type: "htmlAttributes", element: "span" }] },
        destructure: { props: [], rest: "rest" },
        render: [
          {
            type: "element",
            tag: "span",
            attrs: [...attrs, { name: "spread", value: { type: "variable", name: "rest" } }],
            children: [{ type: "slot" }],
          },
        ],
      },
    ],
  };
}

function iconContract(component: string, attrs: AttributeContract[]): StyledAdapterContract {
  return {
    component,
    publicExports: ["Fixture"],
    defaultExport: { Root: "Fixture" },
    components: [
      {
        exportName: "Fixture",
        imports: [
          { importName: "Loader2", source: "@tabler/icons/outline/loader-2.svg", type: "default" },
        ],
        render: [{ type: "icon", importName: "Loader2", attrs }],
      },
    ],
  };
}

function projectedAriaHidden(contract: StyledAdapterContract): unknown {
  const icon = projectStyledOutputComponentGroup(contract).components[0]?.render[0];
  if (icon?.type !== "icon" || !icon.asset) throw new TypeError("Expected a projected icon.");
  return icon.asset.attributes.find((attr) => attr.name === "aria-hidden");
}

describe("Styled accessible attributes", () => {
  it("keeps the asset aria-hidden in targets where a scoped label does not apply", () => {
    const hidden = projectedAriaHidden(
      iconContract("scoped-icon-label", [
        { name: "role", value: { type: "literal", value: "status" }, frameworks: ["svelte"] },
        {
          name: "aria-label",
          value: { type: "literal", value: "Loading" },
          frameworks: ["svelte"],
        },
      ]),
    );

    expect(hidden).toEqual({
      name: "aria-hidden",
      value: "true",
      targetScopes: ["astro", "react", "vue"],
    });
  });

  it("drops the asset aria-hidden in every target when the label applies everywhere", () => {
    expect(
      projectedAriaHidden(
        iconContract("named-icon", [
          { name: "aria-label", value: { type: "literal", value: "Loading" } },
        ]),
      ),
    ).toBeUndefined();
  });

  it.each(["presentation", "none"])(
    "keeps the decorative asset aria-hidden for a sole %s role",
    (role) => {
      expect(
        projectedAriaHidden(
          iconContract(`decorative-${role}`, [
            { name: "role", value: { type: "literal", value: role } },
          ]),
        ),
      ).toEqual({ name: "aria-hidden", value: "true" });
    },
  );

  it("accepts aria-hidden and a name that are scoped to different frameworks", () => {
    const issues = validateStyledAdapterContracts([
      elementContract("split-scopes", [
        { name: "aria-hidden", value: { type: "literal", value: "true" }, frameworks: ["vue"] },
        {
          name: "aria-label",
          value: { type: "literal", value: "Loading" },
          frameworks: ["svelte"],
        },
      ]),
    ]);

    expect(issues).toEqual([]);
  });

  it("rejects an aria attribute with no value", () => {
    const issues = validateStyledAdapterContracts([
      elementContract("valueless-aria", [{ name: "aria-hidden" }]),
    ]);

    expect(issues).toContainEqual({
      component: "valueless-aria",
      path: "components.Fixture.render.0.attrs.0.value",
      message:
        'Attribute "aria-hidden" requires a value, because frameworks render a bare ARIA attribute differently.',
    });
  });

  it("rejects an element that is hidden and also has an accessible name", () => {
    const issues = validateStyledAdapterContracts([
      elementContract("hidden-named", [
        { name: "aria-hidden", value: { type: "literal", value: "true" } },
        { name: "aria-label", value: { type: "literal", value: "Loading" } },
      ]),
    ]);

    expect(issues).toContainEqual({
      component: "hidden-named",
      path: "components.Fixture.render.0.attrs",
      message:
        'An element with aria-hidden="true" must not have an accessible name, because assistive technology does not announce it.',
    });
  });

  it("prints no generated Styled element that is hidden and also has an accessible name", async () => {
    const conflicts: string[] = [];

    for (const outputRoot of STYLED_OUTPUT_ROOTS) {
      for (const file of await listStyledSources(path.join(repoRoot, outputRoot))) {
        const source = await readFile(file, "utf8");
        for (const tag of openingTags(source)) {
          if (!/\saria-hidden=(?:"true"|\{true\}|\{"true"\})/.test(tag)) continue;
          if (!/\s(?:aria-label|aria-labelledby)=/.test(tag)) continue;
          conflicts.push(`${path.relative(repoRoot, file)}: ${tag.split("\n")[0]}`);
        }
      }
    }

    expect(conflicts).toEqual([]);
  });

  it("prints no generated Styled aria attribute without a value", async () => {
    const valueless: string[] = [];

    for (const outputRoot of STYLED_OUTPUT_ROOTS) {
      for (const file of await listStyledSources(path.join(repoRoot, outputRoot))) {
        const source = await readFile(file, "utf8");
        for (const tag of openingTags(source)) {
          const match = /\s(aria-[a-z]+)(?=\s|\/?>$)/.exec(tag);
          if (match) valueless.push(`${path.relative(repoRoot, file)}: ${match[1]}`);
        }
      }
    }

    expect(valueless).toEqual([]);
  });
});

async function listStyledSources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && STYLED_SOURCE_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

function openingTags(source: string): string[] {
  const markup = source
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/<script\b[\s\S]*?<\/script>/g, "");
  const braces = String.raw`\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}`;
  const tagPattern = new RegExp(
    String.raw`<[a-zA-Z][\w.:-]*(?:[^>"'{]|"[^"]*"|'[^']*'|${braces})*>`,
    "g",
  );
  return [...markup.matchAll(tagPattern)].map(([tag]) => tag);
}
