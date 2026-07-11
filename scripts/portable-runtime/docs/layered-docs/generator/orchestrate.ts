import { runtimeAdapterContracts } from "../../../contracts/primitive/representatives.js";
import { writeGeneratedFile } from "../../../renderers/shared.js";
import { type LayeredDocsMetadata } from "../types.js";
import fs from "node:fs";
import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { buildLayeredDocsMetadata } from "./build-metadata.js";
import { GENERATED_MDX_MARKER_TEXT } from "./constants.js";
import { findMissingPublishedPages } from "./docs-files.js";
import type {
  CheckLayeredDocsMetadataOptions,
  CheckLayeredDocsMetadataResult,
  DocsExportResult,
  GenerateLayeredDocsMetadataOptions,
  GenerateLayeredDocsMetadataResult,
  LayeredDocsValidationReport,
  ValidateLayeredDocsMetadataOptions,
} from "./options.js";
import { repoRoot } from "./paths.js";
import {
  renderPrimitiveIndexPage,
  renderPrimitiveReferencePage,
  renderRuntimeIndexPage,
} from "./render-reference.js";
import { renderCanonicalMetadataSource, renderDocsExportSource } from "./serialize-metadata.js";
import {
  validateLayeredDocsMetadata as validateLayeredDocsMetadataCore,
  validateLayeredDocsMetadataArtifact as validateLayeredDocsMetadataArtifactCore,
} from "./validate-metadata.js";
import { formatError } from "./shared.js";

export const generateLayeredDocsMetadata = (
  options: GenerateLayeredDocsMetadataOptions = {},
): Promise<GenerateLayeredDocsMetadataResult> => {
  const outputRoot = options.outputRoot ?? repoRoot;
  const docsRoot = options.docsRoot ?? path.join(repoRoot, ".local", "starwind-docs");
  const messages: string[] = [];
  const metadata = buildLayeredDocsMetadata({
    primitiveDocsUsageRoot: options.primitiveDocsUsageRoot,
  });
  const source = renderCanonicalMetadataSource(metadata);
  const canonicalDirectory = getCanonicalMetadataDirectory(outputRoot);
  const canonicalPath = path.join(canonicalDirectory, "layered-docs-metadata.ts");

  return writeGeneratedFile(canonicalDirectory, "layered-docs-metadata.ts", source).then(
    async () => {
      const docsExport = await exportDocsMetadata(
        metadata,
        docsRoot,
        options.requireDocs,
        messages,
      );

      return {
        metadata,
        canonicalPath,
        docsExport,
        messages,
      };
    },
  );
};

export const checkLayeredDocsMetadata = async (
  options: CheckLayeredDocsMetadataOptions = {},
): Promise<CheckLayeredDocsMetadataResult> => {
  const outputRoot = options.outputRoot ?? repoRoot;
  const docsRoot = options.docsRoot ?? path.join(repoRoot, ".local", "starwind-docs");
  const messages: string[] = [];
  const metadata = buildLayeredDocsMetadata({
    primitiveDocsUsageRoot: options.primitiveDocsUsageRoot,
  });
  const canonicalPath = getCanonicalMetadataPath(outputRoot);
  const missingPublishedPages = fs.existsSync(docsRoot)
    ? findMissingPublishedPages(metadata, docsRoot)
    : [];

  if (!fs.existsSync(docsRoot)) {
    messages.push("Docs app not found; export skipped.");
  }

  let report: LayeredDocsValidationReport;

  try {
    report = validateLayeredDocsMetadataArtifactCore(
      metadata,
      await readFile(canonicalPath, "utf8"),
      runtimeAdapterContracts,
      missingPublishedPages,
    );
  } catch (error) {
    const baseReport = validateLayeredDocsMetadataCore(
      metadata,
      runtimeAdapterContracts,
      missingPublishedPages,
    );
    report = {
      ...baseReport,
      requiredFailures: [
        ...baseReport.requiredFailures,
        `Unable to read generated layered docs metadata artifact at ${canonicalPath}: ${formatError(error)}.`,
      ],
    };
  }

  if (options.requireDocs && !fs.existsSync(docsRoot)) {
    report = {
      ...report,
      requiredFailures: [
        ...report.requiredFailures,
        `Docs app not found; export skipped. Expected docs root at ${docsRoot}.`,
      ],
    };
  }

  if (fs.existsSync(docsRoot)) {
    const docsExportFailures = await getDocsExportCheckFailures(metadata, docsRoot);
    if (docsExportFailures.length > 0) {
      report = {
        ...report,
        requiredFailures: [...report.requiredFailures, ...docsExportFailures],
      };
    }
  }

  if (report.missingPublishedPages.length > 0) {
    messages.push(`Missing published docs pages: ${report.missingPublishedPages.join(", ")}.`);
  }

  return {
    metadata,
    canonicalPath,
    report,
    messages,
  };
};

export const validateLayeredDocsMetadata = (
  metadata: LayeredDocsMetadata,
  options: ValidateLayeredDocsMetadataOptions = {},
) =>
  validateLayeredDocsMetadataCore(
    metadata,
    runtimeAdapterContracts,
    options.docsRoot ? findMissingPublishedPages(metadata, options.docsRoot) : [],
  );

export const validateLayeredDocsMetadataArtifact = (
  metadata: LayeredDocsMetadata,
  artifactSource: string,
  options: ValidateLayeredDocsMetadataOptions = {},
) =>
  validateLayeredDocsMetadataArtifactCore(
    metadata,
    artifactSource,
    runtimeAdapterContracts,
    options.docsRoot ? findMissingPublishedPages(metadata, options.docsRoot) : [],
  );

const exportDocsMetadata = (
  metadata: LayeredDocsMetadata,
  docsRoot: string,
  requireDocs = false,
  messages: string[],
): Promise<DocsExportResult> => {
  if (!fs.existsSync(docsRoot)) {
    const message = "Docs app not found; export skipped.";
    messages.push(message);

    if (requireDocs) {
      throw new Error(`${message} Expected docs root at ${docsRoot}.`);
    }

    return Promise.resolve({
      status: "skipped",
      reason: message,
    });
  }

  const missingPublishedPages = findMissingPublishedPages(metadata, docsRoot);
  if (missingPublishedPages.length > 0) {
    const message = `Missing published docs pages: ${missingPublishedPages.join(", ")}.`;
    messages.push(message);

    if (requireDocs) {
      throw new Error(message);
    }
  }

  const docsExportDirectory = path.join(docsRoot, "src", "docs", "data", "starwind", "generated");
  const docsExportPath = path.join(docsExportDirectory, "layered-docs-metadata.ts");

  return Promise.all([
    writeGeneratedFile(
      docsExportDirectory,
      "layered-docs-metadata.ts",
      renderDocsExportSource(metadata),
    ),
    renderDocsTypesExportSource().then((source) =>
      writeGeneratedFile(docsExportDirectory, "layered-docs-types.ts", source),
    ),
  ])
    .then(() => writePrimitiveDocsPages(metadata, docsRoot))
    .then(() => writeRuntimeDocsPages(metadata, docsRoot))
    .then(() => removeGeneratedStylingDocsPages(docsRoot))
    .then(() => ({
      status: "written" as const,
      path: docsExportPath,
    }));
};

const getDocsExportCheckFailures = async (
  metadata: LayeredDocsMetadata,
  docsRoot: string,
): Promise<string[]> => {
  const docsExportDirectory = path.join(docsRoot, "src", "docs", "data", "starwind", "generated");
  const artifacts = [
    {
      path: path.join(docsExportDirectory, "layered-docs-metadata.ts"),
      expected: renderDocsExportSource(metadata),
    },
    {
      path: path.join(docsExportDirectory, "layered-docs-types.ts"),
      expected: await renderDocsTypesExportSource(),
    },
  ];
  const failures: string[] = [];

  for (const artifact of artifacts) {
    try {
      if ((await readFile(artifact.path, "utf8")) !== artifact.expected) {
        failures.push(
          `Generated docs export is stale at ${artifact.path}. Run pnpm runtime:docs:metadata.`,
        );
      }
    } catch (error) {
      failures.push(
        `Unable to read generated docs export at ${artifact.path}: ${formatError(error)}.`,
      );
    }
  }

  return failures;
};

const renderDocsTypesExportSource = async () => {
  const canonicalTypesPath = path.join(
    repoRoot,
    "scripts",
    "portable-runtime",
    "docs",
    "layered-docs",
    "types.ts",
  );
  const source = await readFile(canonicalTypesPath, "utf8");

  return `/**\n * Generated by scripts/portable-runtime/generate-layered-docs-metadata.ts.\n * Do not edit this file directly.\n */\n\n${source}`;
};

const writePrimitiveDocsPages = async (metadata: LayeredDocsMetadata, docsRoot: string) => {
  const primitiveDocsDirectory = path.join(
    docsRoot,
    "src",
    "docs",
    "data",
    "docs",
    "en",
    "primitives",
  );
  const expectedFileNames = new Set([
    "index.mdx",
    ...metadata.primitives.map((primitive) => `${primitive.id}.mdx`),
  ]);

  await mkdir(primitiveDocsDirectory, { recursive: true });
  await removeStaleGeneratedMdxPages(primitiveDocsDirectory, expectedFileNames);
  await writeGeneratedFile(primitiveDocsDirectory, "index.mdx", renderPrimitiveIndexPage());

  await Promise.all(
    metadata.primitives.map((primitive) =>
      writeGeneratedFile(
        primitiveDocsDirectory,
        `${primitive.id}.mdx`,
        renderPrimitiveReferencePage(primitive),
      ),
    ),
  );
};

const writeRuntimeDocsPages = async (_metadata: LayeredDocsMetadata, docsRoot: string) => {
  const runtimeDocsDirectory = path.join(docsRoot, "src", "docs", "data", "docs", "en", "runtime");
  const expectedFileNames = new Set(["index.mdx"]);

  await mkdir(runtimeDocsDirectory, { recursive: true });
  await removeStaleRuntimeDocsPages(runtimeDocsDirectory, expectedFileNames);
  await writeGeneratedFile(runtimeDocsDirectory, "index.mdx", renderRuntimeIndexPage());
};

const removeGeneratedStylingDocsPages = async (docsRoot: string) => {
  const stylingDocsDirectory = path.join(docsRoot, "src", "docs", "data", "docs", "en", "styling");

  if (!fs.existsSync(stylingDocsDirectory)) {
    return;
  }

  await removeStaleRuntimeDocsPages(stylingDocsDirectory, new Set());
};

const removeStaleRuntimeDocsPages = async (
  docsDirectory: string,
  expectedFileNames: ReadonlySet<string>,
) => {
  const entries = await readdir(docsDirectory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith(".mdx") && !expectedFileNames.has(entry.name),
      )
      .map(async (entry) => {
        const filePath = path.join(docsDirectory, entry.name);
        const source = await readFile(filePath, "utf8");

        if (source.includes(GENERATED_MDX_MARKER_TEXT)) {
          await rm(filePath, { force: true });
        }
      }),
  );
};

const removeStaleGeneratedMdxPages = async (
  docsDirectory: string,
  expectedFileNames: ReadonlySet<string>,
) => {
  const entries = await readdir(docsDirectory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith(".mdx") && !expectedFileNames.has(entry.name),
      )
      .map((entry) => rm(path.join(docsDirectory, entry.name), { force: true })),
  );
};

const getCanonicalMetadataDirectory = (outputRoot: string) =>
  path.join(outputRoot, "scripts", "portable-runtime", "docs", "layered-docs", "generated");

const getCanonicalMetadataPath = (outputRoot: string) =>
  path.join(getCanonicalMetadataDirectory(outputRoot), "layered-docs-metadata.ts");
