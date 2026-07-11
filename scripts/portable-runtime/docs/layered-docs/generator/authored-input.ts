import { type RuntimeAdapterContract } from "../../../contracts/primitive/types.js";
import {
  type PrimitiveDocsAuthoredExampleFrameworkMetadata,
  type PrimitiveDocsAuthoredExampleMetadata,
  type PrimitiveDocsEnrichment,
  type PrimitiveDocsExampleRegistry,
  type PrimitiveDocsSectionMetadata,
  type PrimitiveDocsUsageGuidelineMetadata,
} from "../types.js";
import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import { isPrimitivePropTargetedAtPart } from "./descriptions/primitive-reference.js";
import {
  getPrimitiveAuthoredExampleFrameworksInDisplayOrder,
  isPrimitiveDocsFrameworkTarget,
} from "./render-reference.js";

const PRIMITIVE_AUTHORED_USAGE_FILE_NAME = "usage.md";

const PRIMITIVE_AUTHORED_EXAMPLES_MANIFEST_FILE_NAME = "manifest.ts";

const PRIMITIVE_AUTHORED_USAGE_SECTION_ORDER = [
  "Usage Guidelines",
  "Positioning",
  "Examples",
] as const;

const PRIMITIVE_AUTHORED_USAGE_SECTION_ORDER_BY_TITLE = new Map<string, number>(
  PRIMITIVE_AUTHORED_USAGE_SECTION_ORDER.map((title, index) => [title, index]),
);

const PRIMITIVE_GENERATOR_OWNED_USAGE_HEADINGS = new Set([
  "Anatomy",
  "API Reference",
  "Runtime API",
  "Related Styled Components",
]);

const PRIMITIVE_AUTHORED_EXAMPLE_MANIFEST_FRAMEWORK_TARGETS = {
  astro: { framework: "astro", language: "astro" },
  react: { framework: "react", language: "tsx" },
  html: { framework: "raw-html", language: "html" },
} as const satisfies Readonly<
  Record<string, Pick<PrimitiveDocsAuthoredExampleFrameworkMetadata, "framework" | "language">>
>;

type PrimitiveAuthoredUsageMetadata = {
  readonly usageGuidelines?: readonly PrimitiveDocsUsageGuidelineMetadata[];
  readonly sections?: readonly PrimitiveDocsSectionMetadata[];
  readonly exampleIds?: readonly string[];
  readonly authoredExamples?: readonly PrimitiveDocsAuthoredExampleMetadata[];
};

type PrimitiveAuthoredExamplesManifest = Readonly<
  Record<
    string,
    {
      readonly title?: unknown;
      readonly summary?: unknown;
      readonly draft?: unknown;
      readonly files?: unknown;
    }
  >
>;

type PrimitiveAuthoredExampleFilesManifest = Readonly<
  Partial<Record<keyof typeof PRIMITIVE_AUTHORED_EXAMPLE_MANIFEST_FRAMEWORK_TARGETS, unknown>>
>;

type PrimitiveAuthoredExampleManifestValue =
  | string
  | boolean
  | PrimitiveAuthoredExamplesManifest
  | PrimitiveAuthoredExampleFilesManifest;

export const loadPrimitiveAuthoredUsage = (
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  usageRoot: string | false,
  sourceRoot: string,
  validationIssues: string[],
) => {
  const authoredUsageById: Record<string, PrimitiveAuthoredUsageMetadata> = {};

  if (usageRoot === false || !fs.existsSync(usageRoot)) {
    return authoredUsageById;
  }

  for (const entry of fs.readdirSync(usageRoot, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      !primitiveById.has(entry.name) &&
      (fs.existsSync(path.join(usageRoot, entry.name, PRIMITIVE_AUTHORED_USAGE_FILE_NAME)) ||
        fs.existsSync(
          path.join(usageRoot, entry.name, PRIMITIVE_AUTHORED_EXAMPLES_MANIFEST_FILE_NAME),
        ))
    ) {
      validationIssues.push(`Unknown primitive usage docs id ${entry.name}.`);
    }
  }

  for (const [primitiveId, contract] of primitiveById) {
    const primitiveUsageRoot = path.join(usageRoot, primitiveId);
    const usagePath = path.join(primitiveUsageRoot, PRIMITIVE_AUTHORED_USAGE_FILE_NAME);
    const manifestPath = path.join(
      primitiveUsageRoot,
      PRIMITIVE_AUTHORED_EXAMPLES_MANIFEST_FILE_NAME,
    );
    const hasUsage = fs.existsSync(usagePath);
    const hasManifest = fs.existsSync(manifestPath);

    if (!hasUsage && !hasManifest) {
      continue;
    }

    let authoredUsage: PrimitiveAuthoredUsageMetadata = {};

    try {
      if (hasUsage) {
        authoredUsage = parsePrimitiveAuthoredUsageMarkdown(
          primitiveId,
          fs.readFileSync(usagePath, "utf8"),
          validationIssues,
        );
      }
    } catch (error) {
      validationIssues.push(
        `${primitiveId} primitive usage.md could not be read: ${String(error)}`,
      );
    }

    const authoredExamples = loadPrimitiveAuthoredExampleManifest(
      primitiveId,
      contract,
      primitiveUsageRoot,
      sourceRoot,
      validationIssues,
    );

    validatePrimitiveAuthoredExampleUsage(
      primitiveId,
      authoredUsage.exampleIds ?? [],
      authoredExamples,
      validationIssues,
    );

    authoredUsageById[primitiveId] = {
      ...authoredUsage,
      authoredExamples,
    };
  }

  return authoredUsageById;
};

export const mergePrimitiveDocsEnrichmentWithAuthoredUsage = (
  enrichmentById: Readonly<Record<string, PrimitiveDocsEnrichment>>,
  authoredUsageById: Readonly<Record<string, PrimitiveAuthoredUsageMetadata>>,
) => {
  const merged: Record<string, PrimitiveDocsEnrichment> = {};

  for (const [primitiveId, enrichment] of Object.entries(enrichmentById)) {
    merged[primitiveId] = copyPrimitiveDocsEnrichment(enrichment);
  }

  for (const [primitiveId, authoredUsage] of Object.entries(authoredUsageById)) {
    const enrichment = merged[primitiveId] ?? {};
    const usageGuidelines = authoredUsage.usageGuidelines ?? [];
    const sections = authoredUsage.sections ?? [];
    const authoredExamples = authoredUsage.authoredExamples ?? [];

    merged[primitiveId] = {
      ...enrichment,
      ...(usageGuidelines.length > 0
        ? { usageGuidelines: usageGuidelines.map((guideline) => ({ ...guideline })) }
        : {}),
      ...(authoredExamples.length > 0
        ? { authoredExamples: authoredExamples.map(copyPrimitiveDocsAuthoredExample) }
        : {}),
      sections:
        sections.length > 0
          ? [
              ...sections.map((section) => ({ ...section })),
              ...(enrichment.sections ?? []).map((section) => ({ ...section })),
            ]
          : (enrichment.sections ?? []).map((section) => ({ ...section })),
    };
  }

  return merged;
};

const copyPrimitiveDocsEnrichment = (
  enrichment: PrimitiveDocsEnrichment,
): PrimitiveDocsEnrichment => ({
  ...enrichment,
  ...(enrichment.behaviorNotes ? { behaviorNotes: [...enrichment.behaviorNotes] } : {}),
  ...(enrichment.frameworkNotes
    ? {
        frameworkNotes: Object.fromEntries(
          Object.entries(enrichment.frameworkNotes).map(([framework, notes]) => [
            framework,
            [...notes],
          ]),
        ),
      }
    : {}),
  ...(enrichment.usageGuidelines
    ? { usageGuidelines: enrichment.usageGuidelines.map((guideline) => ({ ...guideline })) }
    : {}),
  ...(enrichment.sections
    ? { sections: enrichment.sections.map((section) => ({ ...section })) }
    : {}),
  ...(enrichment.examples
    ? { examples: enrichment.examples.map((example) => ({ ...example })) }
    : {}),
  ...(enrichment.authoredExamples
    ? { authoredExamples: enrichment.authoredExamples.map(copyPrimitiveDocsAuthoredExample) }
    : {}),
  ...(enrichment.parts
    ? {
        parts: Object.fromEntries(
          Object.entries(enrichment.parts).map(([partName, part]) => [
            partName,
            {
              ...part,
              ...(part.props ? { props: { ...part.props } } : {}),
              ...(part.dataAttributes ? { dataAttributes: { ...part.dataAttributes } } : {}),
            },
          ]),
        ),
      }
    : {}),
  ...(enrichment.props ? { props: { ...enrichment.props } } : {}),
  ...(enrichment.dataAttributes ? { dataAttributes: { ...enrichment.dataAttributes } } : {}),
});

export const copyPrimitiveDocsAuthoredExample = (
  example: PrimitiveDocsAuthoredExampleMetadata,
): PrimitiveDocsAuthoredExampleMetadata => ({
  ...example,
  frameworks: example.frameworks.map((framework) => ({ ...framework })),
});

const loadPrimitiveAuthoredExampleManifest = (
  primitiveId: string,
  contract: RuntimeAdapterContract,
  primitiveUsageRoot: string,
  sourceRoot: string,
  validationIssues: string[],
) => {
  const manifestPath = path.join(
    primitiveUsageRoot,
    PRIMITIVE_AUTHORED_EXAMPLES_MANIFEST_FILE_NAME,
  );

  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  let manifest: PrimitiveAuthoredExamplesManifest = {};

  try {
    manifest = parsePrimitiveAuthoredExampleManifest(
      primitiveId,
      fs.readFileSync(manifestPath, "utf8"),
      validationIssues,
    );
  } catch (error) {
    validationIssues.push(
      `${primitiveId} primitive authored examples manifest could not be read: ${String(error)}`,
    );
  }

  return Object.entries(manifest).map(([exampleId, example]) =>
    buildPrimitiveAuthoredExampleMetadata(
      primitiveId,
      contract,
      primitiveUsageRoot,
      sourceRoot,
      exampleId,
      example,
      validationIssues,
    ),
  );
};

const parsePrimitiveAuthoredExampleManifest = (
  primitiveId: string,
  source: string,
  validationIssues: string[],
): PrimitiveAuthoredExamplesManifest => {
  const sourceFile = ts.createSourceFile(
    PRIMITIVE_AUTHORED_EXAMPLES_MANIFEST_FILE_NAME,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const manifestDeclaration = sourceFile.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) =>
      statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ? [...statement.declarationList.declarations]
        : [],
    )
    .find(
      (declaration) =>
        ts.isIdentifier(declaration.name) && declaration.name.text === "primitiveAuthoredExamples",
    );

  if (!manifestDeclaration?.initializer) {
    validationIssues.push(
      `${primitiveId} primitive authored examples manifest must export primitiveAuthoredExamples.`,
    );
    return {};
  }

  const parsedManifest = parsePrimitiveAuthoredExampleManifestValue(
    manifestDeclaration.initializer,
  );

  if (!isRecord(parsedManifest)) {
    validationIssues.push(
      `${primitiveId} primitive authored examples manifest must export an object.`,
    );
    return {};
  }

  return parsedManifest as PrimitiveAuthoredExamplesManifest;
};

const parsePrimitiveAuthoredExampleManifestValue = (
  expression: ts.Expression,
): PrimitiveAuthoredExampleManifestValue | undefined => {
  if (
    ts.isAsExpression(expression) ||
    ts.isSatisfiesExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    return parsePrimitiveAuthoredExampleManifestValue(expression.expression);
  }

  if (ts.isObjectLiteralExpression(expression)) {
    const result: Record<string, PrimitiveAuthoredExampleManifestValue | undefined> = {};

    for (const property of expression.properties) {
      if (!ts.isPropertyAssignment(property)) {
        continue;
      }

      const propertyName = getObjectLiteralPropertyName(property.name);

      if (!propertyName) {
        continue;
      }

      result[propertyName] = parsePrimitiveAuthoredExampleManifestValue(property.initializer);
    }

    return result as PrimitiveAuthoredExamplesManifest;
  }

  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  return undefined;
};

const getObjectLiteralPropertyName = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
};

const buildPrimitiveAuthoredExampleMetadata = (
  primitiveId: string,
  contract: RuntimeAdapterContract,
  primitiveUsageRoot: string,
  sourceRoot: string,
  exampleId: string,
  example: PrimitiveAuthoredExamplesManifest[string],
  validationIssues: string[],
): PrimitiveDocsAuthoredExampleMetadata => {
  if (!isRecord(example)) {
    validationIssues.push(
      `${primitiveId} primitive authored example ${exampleId} must be an object.`,
    );

    return {
      id: exampleId,
      title: exampleId,
      summary: "",
      frameworks: [],
    };
  }

  if (typeof example.title !== "string" || !example.title.trim()) {
    validationIssues.push(
      `${primitiveId} primitive authored example ${exampleId} is missing a title.`,
    );
  }

  if (typeof example.summary !== "string" || !example.summary.trim()) {
    validationIssues.push(
      `${primitiveId} primitive authored example ${exampleId} is missing a summary.`,
    );
  }

  const files = isRecord(example.files)
    ? (example.files as PrimitiveAuthoredExampleFilesManifest)
    : {};
  const frameworks = Object.entries(files).flatMap(([frameworkKey, filePath]) => {
    if (!isPrimitiveAuthoredExampleManifestFramework(frameworkKey)) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId} references unknown framework ${frameworkKey}.`,
      );
      return [];
    }

    if (typeof filePath !== "string" || !filePath.trim()) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} must reference a file path.`,
      );
      return [];
    }

    const fileMetadata = PRIMITIVE_AUTHORED_EXAMPLE_MANIFEST_FRAMEWORK_TARGETS[frameworkKey];
    const examplePath = path.resolve(primitiveUsageRoot, filePath);
    const relativeExamplePath = path.relative(primitiveUsageRoot, examplePath);

    if (relativeExamplePath.startsWith("..") || path.isAbsolute(relativeExamplePath)) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} must stay inside the primitive docs folder.`,
      );
      return [];
    }

    if (!fs.existsSync(examplePath)) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} references missing file ${filePath}.`,
      );
      return [];
    }

    const code = fs.readFileSync(examplePath, "utf8");

    validatePrimitiveAuthoredExampleSource(
      primitiveId,
      contract,
      exampleId,
      frameworkKey,
      fileMetadata.framework,
      code,
      validationIssues,
    );

    return [
      {
        ...fileMetadata,
        source: toPortablePath(path.relative(sourceRoot, examplePath)),
        code,
      },
    ];
  });

  if (frameworks.length === 0) {
    validationIssues.push(
      `${primitiveId} primitive authored example ${exampleId} must include at least one framework file.`,
    );
  }

  return {
    id: exampleId,
    title: typeof example.title === "string" && example.title.trim() ? example.title : exampleId,
    summary: typeof example.summary === "string" ? example.summary : "",
    ...(example.draft === true ? { draft: true } : {}),
    frameworks: getPrimitiveAuthoredExampleFrameworksInDisplayOrder(frameworks),
  };
};

const validatePrimitiveAuthoredExampleUsage = (
  primitiveId: string,
  exampleIds: readonly string[],
  examples: readonly PrimitiveDocsAuthoredExampleMetadata[],
  validationIssues: string[],
) => {
  const manifestExampleIds = new Set(examples.map((example) => example.id));
  const usedExampleIds = new Set(exampleIds);

  for (const exampleId of usedExampleIds) {
    if (!manifestExampleIds.has(exampleId)) {
      validationIssues.push(
        `${primitiveId} primitive usage.md references unknown authored example ${exampleId}.`,
      );
    }
  }

  for (const example of examples) {
    if (example.draft !== true && !usedExampleIds.has(example.id)) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${example.id} is not referenced by usage.md.`,
      );
    }
  }
};

const validatePrimitiveAuthoredExampleSource = (
  primitiveId: string,
  contract: RuntimeAdapterContract,
  exampleId: string,
  frameworkKey: string,
  framework: PrimitiveDocsAuthoredExampleFrameworkMetadata["framework"],
  code: string,
  validationIssues: string[],
) => {
  if (framework === "astro" && !code.includes(`@starwind-ui/astro/${contract.component}`)) {
    validationIssues.push(
      `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} must import the Astro primitive adapter.`,
    );
  }

  if (framework === "react") {
    const output = ts.transpileModule(code, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const diagnostics = output.diagnostics ?? [];

    if (diagnostics.length > 0) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} failed React syntax validation.`,
      );
    }
  }

  if (framework === "raw-html") {
    const rootHook = contract.parts.find(
      (part) => part.name === contract.runtime.rootPart,
    )?.discoveryAttribute;

    if (!rootHook || !code.includes(rootHook) || !code.includes(contract.runtime.factory)) {
      validationIssues.push(
        `${primitiveId} primitive authored example ${exampleId}.${frameworkKey} must include the Runtime root hook and factory initializer.`,
      );
    }
  }
};

const isPrimitiveAuthoredExampleManifestFramework = (
  value: string,
): value is keyof typeof PRIMITIVE_AUTHORED_EXAMPLE_MANIFEST_FRAMEWORK_TARGETS =>
  value in PRIMITIVE_AUTHORED_EXAMPLE_MANIFEST_FRAMEWORK_TARGETS;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toPortablePath = (value: string) => value.split(path.sep).join("/");

const parsePrimitiveAuthoredUsageMarkdown = (
  primitiveId: string,
  source: string,
  validationIssues: string[],
): PrimitiveAuthoredUsageMetadata => {
  const sections: { title: string; lines: string[] }[] = [];
  let currentSection: { title: string; lines: string[] } | undefined;
  let lastSectionOrder = -1;
  let lastSectionTitle = "";
  let inCodeFence = false;
  const exampleIds: string[] = [];

  const pushIssue = createValidationIssuePusher(validationIssues);

  for (const line of source.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence) {
      if (/^\s*import(?:\s|['"])/.test(line) || /^\s*export\s+/.test(line)) {
        pushIssue(`${primitiveId} primitive usage.md cannot contain MDX imports or exports.`);
      }

      if (/<\/?[A-Z][A-Za-z0-9.:-]*(?:[\s/>]|$)/.test(line)) {
        pushIssue(`${primitiveId} primitive usage.md cannot contain JSX component tags.`);
      }

      if (/^\s*::[A-Za-z]/.test(line)) {
        const exampleDirective = /^\s*::example\{id="([A-Za-z0-9-]+)"\}\s*$/.exec(line);

        if (!exampleDirective) {
          pushIssue(`${primitiveId} primitive usage.md cannot contain unsupported directives.`);
        } else if (currentSection?.title !== "Examples") {
          pushIssue(
            `${primitiveId} primitive usage.md example directives are only allowed under Examples.`,
          );
        } else {
          exampleIds.push(exampleDirective[1]);
        }
      }

      const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);

      if (heading) {
        const level = heading[1].length;
        const title = heading[2].trim();

        if (PRIMITIVE_GENERATOR_OWNED_USAGE_HEADINGS.has(title)) {
          pushIssue(
            `${primitiveId} primitive usage.md cannot define generator-owned heading ${title}.`,
          );
        }

        if (level === 2) {
          const sectionOrder = PRIMITIVE_AUTHORED_USAGE_SECTION_ORDER_BY_TITLE.get(title);

          if (sectionOrder === undefined) {
            pushIssue(
              `${primitiveId} primitive usage.md can only define ${PRIMITIVE_AUTHORED_USAGE_SECTION_ORDER.join(
                ", ",
              )} headings.`,
            );
          } else {
            if (sectionOrder < lastSectionOrder) {
              pushIssue(
                `${primitiveId} primitive usage.md heading ${title} must appear before ${lastSectionTitle}.`,
              );
            }

            lastSectionOrder = sectionOrder;
            lastSectionTitle = title;
            currentSection = { title, lines: [] };
            sections.push(currentSection);
          }
        } else if (level < 3) {
          pushIssue(`${primitiveId} primitive usage.md top-level headings must use ##.`);
        } else {
          currentSection?.lines.push(line);
        }

        continue;
      }
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else if (line.trim()) {
      pushIssue(
        `${primitiveId} primitive usage.md content must appear under Usage Guidelines, Positioning, or Examples.`,
      );
    }
  }

  const usageGuidelines: PrimitiveDocsUsageGuidelineMetadata[] = [];
  const authoredSections: PrimitiveDocsSectionMetadata[] = [];

  for (const section of sections) {
    const content = section.lines.join("\n").trim();

    if (!content) {
      continue;
    }

    if (section.title === "Usage Guidelines") {
      usageGuidelines.push(
        ...parsePrimitiveUsageGuidelinesSection(primitiveId, content, validationIssues),
      );
      continue;
    }

    authoredSections.push({
      title: section.title,
      content,
    });
  }

  return {
    usageGuidelines,
    sections: authoredSections,
    exampleIds,
  };
};

const parsePrimitiveUsageGuidelinesSection = (
  primitiveId: string,
  content: string,
  validationIssues: string[],
) => {
  const pushIssue = createValidationIssuePusher(validationIssues);
  const guidelines: PrimitiveDocsUsageGuidelineMetadata[] = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const guideline = /^\s*[-*]\s+\*\*(.+?)\*\*\s+(.+?)\s*$/.exec(line);

    if (!guideline) {
      pushIssue(
        `${primitiveId} primitive usage.md Usage Guidelines entries must use "- **Title.** Description" bullets.`,
      );
      continue;
    }

    const title = guideline[1].trim();
    const description = guideline[2].trim();

    if (!title || !description) {
      pushIssue(
        `${primitiveId} primitive usage.md Usage Guidelines entries must include a title and description.`,
      );
      continue;
    }

    guidelines.push({ title, description });
  }

  return guidelines;
};

const createValidationIssuePusher = (validationIssues: string[]) => {
  const seenIssues = new Set<string>();

  return (issue: string) => {
    if (!seenIssues.has(issue)) {
      seenIssues.add(issue);
      validationIssues.push(issue);
    }
  };
};

export const validatePrimitiveDocsEnrichment = (
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  enrichmentById: Readonly<Record<string, PrimitiveDocsEnrichment>>,
  validationIssues: string[],
) => {
  for (const [primitiveId, enrichment] of Object.entries(enrichmentById)) {
    const contract = primitiveById.get(primitiveId);

    if (!contract) {
      validationIssues.push(`Unknown primitive docs enrichment id ${primitiveId}.`);
      continue;
    }

    const partsByName = new Map(contract.parts.map((part) => [part.name, part]));

    for (const framework of Object.keys(enrichment.frameworkNotes ?? {})) {
      if (!isPrimitiveDocsFrameworkTarget(framework)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown framework target ${framework}.`,
        );
      }
    }

    for (const [partName, partEnrichment] of Object.entries(enrichment.parts ?? {})) {
      const part = partsByName.get(partName);

      if (!part) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown part ${partName}.`,
        );
        continue;
      }

      const props = contract.props.filter((prop) =>
        isPrimitivePropTargetedAtPart(prop, partName, contract.runtime.rootPart),
      );
      const propNames = new Set(props.map((prop) => prop.name));
      const dataAttributeNames = new Set([
        part.discoveryAttribute,
        ...(part.initialAttributes ?? [])
          .filter((attribute) => attribute.name.startsWith("data-"))
          .map((attribute) => attribute.name),
      ]);

      for (const propName of Object.keys(partEnrichment.props ?? {})) {
        if (!propNames.has(propName)) {
          validationIssues.push(
            `${primitiveId} primitive docs enrichment for part ${partName} references unknown prop ${propName}.`,
          );
        }
      }

      for (const attributeName of Object.keys(partEnrichment.dataAttributes ?? {})) {
        if (!dataAttributeNames.has(attributeName)) {
          validationIssues.push(
            `${primitiveId} primitive docs enrichment for part ${partName} references unknown data attribute ${attributeName}.`,
          );
        }
      }
    }

    const rootPartName = contract.runtime.rootPart;
    const rootPropNames = new Set(
      contract.props
        .filter((prop) => isPrimitivePropTargetedAtPart(prop, rootPartName, rootPartName))
        .map((prop) => prop.name),
    );
    const allDataAttributeNames = new Set(
      contract.parts.flatMap((part) => [
        part.discoveryAttribute,
        ...(part.initialAttributes ?? [])
          .filter((attribute) => attribute.name.startsWith("data-"))
          .map((attribute) => attribute.name),
      ]),
    );

    for (const propName of Object.keys(enrichment.props ?? {})) {
      if (!rootPropNames.has(propName)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown root prop ${propName}.`,
        );
      }
    }

    for (const attributeName of Object.keys(enrichment.dataAttributes ?? {})) {
      if (!allDataAttributeNames.has(attributeName)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown data attribute ${attributeName}.`,
        );
      }
    }

    const stateModelNames = new Set((contract.stateModels ?? []).map((state) => state.name));
    const eventNames = new Set((contract.events ?? []).map((event) => event.name));
    const setterNames = new Set((contract.setters ?? []).map((setter) => setter.method));

    for (const stateName of Object.keys(enrichment.stateModels ?? {})) {
      if (!stateModelNames.has(stateName)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown state model ${stateName}.`,
        );
      }
    }

    for (const eventName of Object.keys(enrichment.events ?? {})) {
      if (!eventNames.has(eventName)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown event ${eventName}.`,
        );
      }
    }

    for (const setterName of Object.keys(enrichment.setters ?? {})) {
      if (!setterNames.has(setterName)) {
        validationIssues.push(
          `${primitiveId} primitive docs enrichment references unknown setter ${setterName}.`,
        );
      }
    }
  }
};

export const validatePrimitiveDocsExampleRegistry = (
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  exampleRegistry: PrimitiveDocsExampleRegistry,
  validationIssues: string[],
) => {
  for (const [primitiveId, examplesById] of Object.entries(exampleRegistry)) {
    if (!primitiveById.has(primitiveId)) {
      validationIssues.push(`Unknown primitive docs example registry id ${primitiveId}.`);
      continue;
    }

    for (const [exampleId, frameworkEntries] of Object.entries(examplesById)) {
      const frameworks = Object.entries(frameworkEntries);

      if (frameworks.length === 0) {
        validationIssues.push(
          `${primitiveId} primitive docs example ${exampleId} has no framework examples.`,
        );
      }

      for (const [framework, example] of frameworks) {
        if (!isPrimitiveDocsFrameworkTarget(framework)) {
          validationIssues.push(
            `${primitiveId} primitive docs example ${exampleId} uses unknown framework target ${framework}.`,
          );
        }

        if (!example.title.trim()) {
          validationIssues.push(
            `${primitiveId} primitive docs example ${exampleId}.${framework} is missing a title.`,
          );
        }

        if (!example.summary.trim()) {
          validationIssues.push(
            `${primitiveId} primitive docs example ${exampleId}.${framework} is missing a summary.`,
          );
        }

        if (!example.code && example.status !== "planned") {
          validationIssues.push(
            `${primitiveId} primitive docs example ${exampleId}.${framework} is missing source code.`,
          );
        }
      }
    }
  }
};
