import { pathToFileURL } from "node:url";

import {
  checkLayeredDocsMetadata,
  generateLayeredDocsMetadata,
} from "./docs/layered-docs/generator/orchestrate.js";
import type {
  GenerateLayeredDocsMetadataOptions,
  LayeredDocsCheckFailureOptions,
  LayeredDocsValidationReport,
} from "./docs/layered-docs/generator/options.js";
import { getLayeredDocsCheckFailures } from "./docs/layered-docs/generator/validate-metadata.js";

export { buildLayeredDocsMetadata } from "./docs/layered-docs/generator/build-metadata.js";
export {
  checkLayeredDocsMetadata,
  generateLayeredDocsMetadata,
  validateLayeredDocsMetadata,
  validateLayeredDocsMetadataArtifact,
} from "./docs/layered-docs/generator/orchestrate.js";
export type {
  BuildLayeredDocsMetadataOptions,
  CheckLayeredDocsMetadataOptions,
  CheckLayeredDocsMetadataResult,
  DocsExportResult,
  GenerateLayeredDocsMetadataOptions,
  GenerateLayeredDocsMetadataResult,
  LayeredDocsCheckFailureOptions,
  LayeredDocsValidationReport,
  ValidateLayeredDocsMetadataOptions,
} from "./docs/layered-docs/generator/options.js";
export { formatPrimitiveStateControlSupport } from "./docs/layered-docs/generator/render-reference.js";
export { renderCanonicalLayeredDocsMetadata } from "./docs/layered-docs/generator/serialize-metadata.js";
export {
  findPrimitiveReferenceDescriptionGaps,
  getLayeredDocsCheckFailures,
} from "./docs/layered-docs/generator/validate-metadata.js";

type LayeredDocsCliOptions = GenerateLayeredDocsMetadataOptions & {
  readonly check?: boolean;
};

const parseCliOptions = (argv: readonly string[]): LayeredDocsCliOptions => {
  const options: LayeredDocsCliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--check") {
      Object.assign(options, { check: true });
      continue;
    }

    if (argument === "--require-docs") {
      Object.assign(options, { requireDocs: true });
      continue;
    }

    if (argument === "--docs-root") {
      Object.assign(options, { docsRoot: argv[index + 1] });
      index += 1;
      continue;
    }

    if (argument === "--output-root") {
      Object.assign(options, { outputRoot: argv[index + 1] });
      index += 1;
      continue;
    }

    throw new Error("Unknown argument: " + argument);
  }

  return options;
};

const formatValidationReport = (
  report: LayeredDocsValidationReport,
  options: LayeredDocsCheckFailureOptions = {},
) => {
  const failures = getLayeredDocsCheckFailures(report, options);

  return (
    "Layered docs metadata validation failed:\n" +
    failures.map((failure) => "- " + failure).join("\n")
  );
};

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const options = parseCliOptions(process.argv.slice(2));
  if (options.check) {
    const result = await checkLayeredDocsMetadata(options);

    for (const message of result.messages) console.warn(message);

    const failures = getLayeredDocsCheckFailures(result.report, {
      requireDocs: options.requireDocs,
    });
    if (failures.length > 0) {
      throw new Error(
        formatValidationReport(result.report, {
          requireDocs: options.requireDocs,
        }),
      );
    }

    console.log("Layered docs metadata check passed for " + result.canonicalPath + ".");
  } else {
    const result = await generateLayeredDocsMetadata(options);

    for (const message of result.messages) console.warn(message);

    console.log("Wrote layered docs metadata to " + result.canonicalPath + ".");
    if (result.docsExport.status === "written") {
      console.log("Exported layered docs metadata to " + result.docsExport.path + ".");
    }
  }
}
