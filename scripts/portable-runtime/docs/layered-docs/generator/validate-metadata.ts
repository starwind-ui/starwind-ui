import {
  type BehaviorFoundationType,
  type DocsPageStatus,
  type LayeredDocsMetadata,
  type PrimitiveDocsMetadata,
  type PrimitivePartApiReferenceMetadata,
  type RuntimeFactoryReferenceMetadata,
  type StyledComponentDocsMetadata,
} from "../types.js";
import { FOUNDATION_LABELS, RUNTIME_DOCS_PATH, STYLING_DOCS_PATH } from "./constants.js";
import {
  buildPrimitiveCanonicalNames,
  buildPrimitiveExportGroups,
  getPublicPrimitiveAdapterParts,
} from "./descriptions/primitive-reference.js";
import type {
  LayeredDocsCheckFailureOptions,
  LayeredDocsRuntimeContract,
  LayeredDocsValidationReport,
} from "./options.js";
import { renderCanonicalLayeredDocsMetadata } from "./serialize-metadata.js";
import { dedupe } from "./shared.js";

const DEFERRED_API_DEPTH_VALIDATION_GAP =
  "Deferred API-depth checks: prop prose, event narratives, setter examples, state prose, variant option prose, and per-framework API differences.";

export const validateLayeredDocsMetadata = (
  metadata: LayeredDocsMetadata,
  runtimeContracts: readonly LayeredDocsRuntimeContract[],
  missingPublishedPages: readonly string[] = [],
): LayeredDocsValidationReport => {
  const requiredFailures: string[] = [];
  const primitiveById = new Map(metadata.primitives.map((primitive) => [primitive.id, primitive]));
  const styledById = new Map(
    metadata.styledComponents.map((component) => [component.id, component]),
  );
  const runtimeFactoryByName = new Map(
    metadata.runtime.factories.map((factory) => [factory.factory, factory]),
  );

  for (const component of metadata.styledComponents) {
    validateStyledComponentDocsMetadata(
      component,
      primitiveById,
      runtimeFactoryByName,
      requiredFailures,
    );
  }

  for (const primitive of metadata.primitives) {
    validatePrimitiveDocsMetadata(
      primitive,
      runtimeFactoryByName,
      runtimeContracts,
      requiredFailures,
    );
  }

  validateRuntimeDocsMetadata(metadata, primitiveById, runtimeFactoryByName, requiredFailures);
  validateStylingDocsMetadata(metadata, styledById, primitiveById, requiredFailures);

  return {
    requiredFailures: dedupe(requiredFailures),
    optionalGaps: [DEFERRED_API_DEPTH_VALIDATION_GAP, ...findPrimitiveDocsEnrichmentGaps(metadata)],
    missingDocsPages: findDocsPagesByStatus(metadata, "missing"),
    missingPublishedPages,
    plannedDocsPages: findDocsPagesByStatus(metadata, "planned"),
  };
};

export const validateLayeredDocsMetadataArtifact = (
  metadata: LayeredDocsMetadata,
  artifactSource: string,
  runtimeContracts: readonly LayeredDocsRuntimeContract[],
  missingPublishedPages: readonly string[] = [],
): LayeredDocsValidationReport => {
  const report = validateLayeredDocsMetadata(metadata, runtimeContracts, missingPublishedPages);
  const expectedSource = renderCanonicalLayeredDocsMetadata(metadata);

  return {
    ...report,
    requiredFailures:
      artifactSource === expectedSource
        ? report.requiredFailures
        : [
            ...report.requiredFailures,
            "Generated layered docs metadata artifact is stale. Run pnpm runtime:docs:metadata.",
          ],
  };
};

export const validateFoundation = (
  componentId: string,
  foundationType: BehaviorFoundationType,
  primitiveIds: readonly string[],
  validationIssues: string[],
) => {
  if (foundationType === "styled-only" && primitiveIds.length > 0) {
    validationIssues.push(
      `${componentId} is marked styled-only but references primitives: ${primitiveIds.join(", ")}.`,
    );
  }

  if (foundationType !== "styled-only" && primitiveIds.length === 0) {
    validationIssues.push(`${componentId} is marked ${foundationType} but has no primitive.`);
  }

  if (foundationType === "direct-primitive" && !primitiveIds.includes(componentId)) {
    validationIssues.push(
      `${componentId} is marked direct-primitive but does not reference a matching primitive.`,
    );
  }

  if (foundationType === "direct-primitive" && primitiveIds.length !== 1) {
    validationIssues.push(
      `${componentId} is marked direct-primitive but references ${primitiveIds.length} primitives: ${primitiveIds.join(", ")}.`,
    );
  }
};

const validateStyledComponentDocsMetadata = (
  component: StyledComponentDocsMetadata,
  primitiveById: ReadonlyMap<string, PrimitiveDocsMetadata>,
  runtimeFactoryByName: ReadonlyMap<string, RuntimeFactoryReferenceMetadata>,
  requiredFailures: string[],
) => {
  if (!isBehaviorFoundationType(component.foundation?.type)) {
    requiredFailures.push(`${component.id} is missing Behavior Foundation classification.`);
    return;
  }

  if (component.foundation.type === "styled-only" && component.primitiveIds.length > 0) {
    requiredFailures.push(
      `${component.id} is styled-only but links to primitives: ${component.primitiveIds.join(", ")}.`,
    );
  }

  if (component.foundation.type !== "styled-only" && component.primitiveIds.length === 0) {
    requiredFailures.push(
      `${component.id} has no primitive link for its ${component.foundation.type} foundation.`,
    );
  }

  for (const primitiveId of component.primitiveIds) {
    const primitive = primitiveById.get(primitiveId);

    if (!primitive) {
      requiredFailures.push(`${component.id} links to missing primitive ${primitiveId}.`);
      continue;
    }

    if (
      component.foundation.type === "renamed-primitive" &&
      !component.aliases.includes(primitiveId)
    ) {
      requiredFailures.push(
        `${component.id} renamed primitive foundation must include primitive alias ${primitiveId}.`,
      );
    }

    if (
      component.foundation.type === "renamed-primitive" &&
      !component.aliases.includes(primitive.displayName)
    ) {
      requiredFailures.push(
        `${component.id} renamed primitive foundation must include primitive display alias ${primitive.displayName}.`,
      );
    }
  }

  for (const runtimeFactory of component.runtimeFactories) {
    const reference = runtimeFactoryByName.get(runtimeFactory.factory);

    if (!reference) {
      requiredFailures.push(
        `${component.id} runtime factory ${runtimeFactory.factory} does not resolve to a runtime reference.`,
      );
      continue;
    }

    if (reference.primitiveId !== runtimeFactory.primitiveId) {
      requiredFailures.push(
        `${component.id} runtime factory ${runtimeFactory.factory} points to ${runtimeFactory.primitiveId} but the runtime reference points to ${reference.primitiveId}.`,
      );
    }

    if (!reference.docsPath.startsWith(RUNTIME_DOCS_PATH)) {
      requiredFailures.push(
        `${component.id} runtime factory ${runtimeFactory.factory} links outside the Runtime docs.`,
      );
    }
  }
};

const validatePrimitiveDocsMetadata = (
  primitive: PrimitiveDocsMetadata,
  runtimeFactoryByName: ReadonlyMap<string, RuntimeFactoryReferenceMetadata>,
  runtimeContracts: readonly LayeredDocsRuntimeContract[],
  requiredFailures: string[],
) => {
  const sourceContract = runtimeContracts.find((contract) => contract.component === primitive.id);

  if (!primitive.runtime.factory) {
    requiredFailures.push(`${primitive.id} primitive runtime factory is missing.`);
  }

  if (!primitive.runtime.importSource) {
    requiredFailures.push(`${primitive.id} primitive runtime importSource is missing.`);
  }

  if (!primitive.runtime.rootPart) {
    requiredFailures.push(`${primitive.id} primitive runtime rootPart is missing.`);
  }

  if ((sourceContract?.parts.length ?? 0) > 0 && primitive.parts.length === 0) {
    requiredFailures.push(`${primitive.id} primitive must document at least one part.`);
  }

  for (const part of primitive.parts) {
    if (!part.name || !part.defaultElement || !part.discoveryAttribute) {
      requiredFailures.push(
        `${primitive.id} primitive part ${part.name || "(unknown)"} is missing public anatomy facts.`,
      );
    }
  }

  if ((sourceContract?.props.length ?? 0) > 0 && primitive.props.length === 0) {
    requiredFailures.push(`${primitive.id} primitive docs omit props from the public contract.`);
  }

  for (const prop of primitive.props) {
    if (!prop.name || !prop.kind || !prop.type) {
      requiredFailures.push(
        `${primitive.id} primitive prop ${prop.name || "(unknown)"} is missing public API facts.`,
      );
    }
  }

  for (const stateModel of primitive.stateModels) {
    if (!stateModel.name || !stateModel.valueType) {
      requiredFailures.push(
        `${primitive.id} primitive state model ${stateModel.name || "(unknown)"} is missing state facts.`,
      );
    }
  }

  for (const event of primitive.events) {
    if (!event.name || !event.callbackProp || !event.emitsFrom) {
      requiredFailures.push(
        `${primitive.id} primitive event ${event.name || "(unknown)"} is missing event contract facts.`,
      );
    }
  }

  for (const setter of primitive.setters) {
    if (!setter.method || !("stateModel" in setter || "prop" in setter || "props" in setter)) {
      requiredFailures.push(
        `${primitive.id} primitive setter ${setter.method || "(unknown)"} is missing a public target.`,
      );
    }
  }

  if (!runtimeFactoryByName.has(primitive.runtime.factory)) {
    requiredFailures.push(
      `${primitive.id} primitive runtime factory ${primitive.runtime.factory} does not resolve to a runtime reference.`,
    );
  }

  validatePrimitiveDocsReferenceMetadata(primitive, sourceContract, requiredFailures);
};

const validatePrimitiveDocsReferenceMetadata = (
  primitive: PrimitiveDocsMetadata,
  sourceContract: LayeredDocsRuntimeContract | undefined,
  requiredFailures: string[],
) => {
  const reference = primitive.docsReference;

  if (!reference.summary) {
    requiredFailures.push(`${primitive.id} primitive docs reference summary is missing.`);
  }

  const disallowedMissingExampleTargets = reference.exampleCoverage.missingTargets.filter(
    (target) => !reference.exampleCoverage.allowedMissingTargets.includes(target),
  );

  if (disallowedMissingExampleTargets.length > 0) {
    requiredFailures.push(
      `${primitive.id} primitive docs reference is missing required examples for ${disallowedMissingExampleTargets.join(", ")}.`,
    );
  }

  if (!reference.anatomy.importSource || !reference.anatomy.namespace) {
    requiredFailures.push(
      `${primitive.id} primitive docs reference anatomy is missing import or namespace facts.`,
    );
  }

  const anatomyParts = new Set(reference.anatomy.parts);
  const apiParts = new Map(reference.apiReference.parts.map((part) => [part.part, part]));
  const exportedGroups = new Map(
    reference.apiReference.exportGroups.map((group) => [group.importSource, group]),
  );
  const canonicalNames = new Set(
    reference.apiReference.canonicalNames.map((name) => `${name.kind}:${name.name}`),
  );

  for (const part of primitive.parts) {
    if (!anatomyParts.has(part.name)) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference anatomy omits part ${part.name}.`,
      );
    }

    const apiPart = apiParts.get(part.name);
    if (!apiPart) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference omits API reference for part ${part.name}.`,
      );
      continue;
    }

    if (!apiPart.defaultElement || !apiPart.discoveryAttribute) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference part ${part.name} is missing anatomy facts.`,
      );
    }

    if (apiPart.defaultElement && apiPart.defaultElement !== part.defaultElement) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference part ${part.name} defaultElement ${apiPart.defaultElement} does not match contract defaultElement ${part.defaultElement}.`,
      );
    }

    if (apiPart.discoveryAttribute && apiPart.discoveryAttribute !== part.discoveryAttribute) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference part ${part.name} discoveryAttribute ${apiPart.discoveryAttribute} does not match contract discoveryAttribute ${part.discoveryAttribute}.`,
      );
    }

    if (!apiPart.dataAttributes.some((attribute) => attribute.name === part.discoveryAttribute)) {
      requiredFailures.push(
        `${primitive.id} primitive docs reference part ${part.name} omits discovery attribute ${part.discoveryAttribute}.`,
      );
    }

    for (const event of primitive.events.filter((event) => event.emitsFrom === part.name)) {
      if (!apiPart.events.some((candidate) => candidate.name === event.name)) {
        requiredFailures.push(
          `${primitive.id} primitive docs reference part ${part.name} omits event ${event.name}.`,
        );
      }
    }

    if (part.name === primitive.runtime.rootPart) {
      for (const setter of primitive.setters) {
        if (!apiPart.setters.some((candidate) => candidate.method === setter.method)) {
          requiredFailures.push(
            `${primitive.id} primitive docs reference part ${part.name} omits setter ${setter.method}.`,
          );
        }
      }
    }
  }

  if (sourceContract) {
    const publicAdapterParts = getPublicPrimitiveAdapterParts(sourceContract);

    for (const expectedGroup of buildPrimitiveExportGroups(sourceContract, publicAdapterParts)) {
      const exportGroup = exportedGroups.get(expectedGroup.importSource);

      if (!exportGroup) {
        requiredFailures.push(
          `${primitive.id} primitive docs reference omits export group for ${expectedGroup.importSource}.`,
        );
        continue;
      }

      for (const exportName of expectedGroup.exports) {
        if (!exportGroup.exports.includes(exportName)) {
          requiredFailures.push(
            `${primitive.id} primitive docs reference export group ${expectedGroup.importSource} omits ${exportName}.`,
          );
        }
      }
    }

    for (const expectedName of buildPrimitiveCanonicalNames(sourceContract, publicAdapterParts)) {
      if (!canonicalNames.has(`${expectedName.kind}:${expectedName.name}`)) {
        requiredFailures.push(
          `${primitive.id} primitive docs reference omits canonical name ${expectedName.name}.`,
        );
      }
    }
  }

  if (reference.apiReference.runtimeFactory.factory !== primitive.runtime.factory) {
    requiredFailures.push(
      `${primitive.id} primitive docs reference runtime factory ${reference.apiReference.runtimeFactory.factory} does not match primitive runtime factory ${primitive.runtime.factory}.`,
    );
  }

  if (reference.apiReference.runtimeFactory.importSource !== primitive.runtime.importSource) {
    requiredFailures.push(
      `${primitive.id} primitive docs reference runtime import ${reference.apiReference.runtimeFactory.importSource} does not match primitive runtime import ${primitive.runtime.importSource}.`,
    );
  }

  if (!reference.apiReference.runtimeFactory.docsPath.startsWith(RUNTIME_DOCS_PATH)) {
    requiredFailures.push(
      `${primitive.id} primitive docs reference runtime factory links outside the Runtime docs.`,
    );
  }
};

const findPrimitiveDocsEnrichmentGaps = (metadata: LayeredDocsMetadata) => {
  const missingExampleTargets = metadata.primitives.flatMap((primitive) =>
    primitive.docsReference.exampleCoverage.missingTargets.map((target) => ({
      primitiveId: primitive.id,
      target,
      allowed: primitive.docsReference.exampleCoverage.allowedMissingTargets.includes(target),
    })),
  );
  const generatedDescriptionKeys = findPrimitiveReferenceDescriptionGaps(metadata);
  const gaps: string[] = [];

  if (missingExampleTargets.length > 0) {
    gaps.push(
      `Primitive docs example gaps: framework examples missing for ${missingExampleTargets.length} primitive targets (${missingExampleTargets.filter((gap) => gap.allowed).length} allowed during rollout; sample: ${missingExampleTargets
        .slice(0, 5)
        .map((gap) => `${gap.primitiveId}.${gap.target}`)
        .join(", ")}).`,
    );
  }

  if (generatedDescriptionKeys.length > 0) {
    gaps.push(
      `Primitive reference description gaps: generated descriptions remain for ${generatedDescriptionKeys.length} public facts (sample: ${generatedDescriptionKeys
        .slice(0, 5)
        .join(", ")}).`,
    );
  }

  return gaps;
};

export const findPrimitiveReferenceDescriptionGaps = (metadata: LayeredDocsMetadata) =>
  metadata.primitives.flatMap((primitive) =>
    primitive.docsReference.apiReference.parts.flatMap((part) =>
      collectPrimitivePartGeneratedDescriptionKeys(primitive.id, part),
    ),
  );

const collectPrimitivePartGeneratedDescriptionKeys = (
  primitiveId: string,
  part: PrimitivePartApiReferenceMetadata,
) => [
  ...(part.descriptionSource !== "authored"
    ? [`${primitiveId}.${part.part}.part.${part.part}`]
    : []),
  ...part.props
    .filter((prop) => prop.descriptionSource !== "authored")
    .map((prop) => `${primitiveId}.${part.part}.prop.${prop.name}`),
  ...part.dataAttributes
    .filter((attribute) => attribute.descriptionSource !== "authored")
    .map((attribute) => `${primitiveId}.${part.part}.data-attribute.${attribute.name}`),
  ...part.stateModels
    .filter((state) => state.descriptionSource !== "authored")
    .map((state) => `${primitiveId}.${part.part}.state.${state.name}`),
  ...part.events
    .filter((event) => event.descriptionSource !== "authored")
    .map((event) => `${primitiveId}.${part.part}.event.${event.name}`),
  ...part.setters
    .filter((setter) => setter.descriptionSource !== "authored")
    .map((setter) => `${primitiveId}.${part.part}.setter.${setter.method}`),
];

const validateRuntimeDocsMetadata = (
  metadata: LayeredDocsMetadata,
  primitiveById: ReadonlyMap<string, PrimitiveDocsMetadata>,
  runtimeFactoryByName: ReadonlyMap<string, RuntimeFactoryReferenceMetadata>,
  requiredFailures: string[],
) => {
  if (
    metadata.runtime.docsPage.status !== "published" ||
    metadata.runtime.docsPage.path !== RUNTIME_DOCS_PATH
  ) {
    requiredFailures.push("Runtime docs page must be published at /docs/runtime/.");
  }

  if (!metadata.runtime.initStarwind.docsPath.startsWith(RUNTIME_DOCS_PATH)) {
    requiredFailures.push("Runtime initStarwind reference must link into the Runtime docs page.");
  }

  if (!metadata.runtime.rawHtml.docsPath.startsWith(RUNTIME_DOCS_PATH)) {
    requiredFailures.push("Runtime raw HTML reference must link into the Runtime docs page.");
  }

  for (const factory of metadata.runtime.factories) {
    if (!primitiveById.has(factory.primitiveId)) {
      requiredFailures.push(
        `Runtime factory ${factory.factory} links to missing primitive ${factory.primitiveId}.`,
      );
    }

    if (!factory.docsPath.startsWith(RUNTIME_DOCS_PATH)) {
      requiredFailures.push(`Runtime factory ${factory.factory} links outside the Runtime docs.`);
    }
  }

  for (const initializer of metadata.runtime.rawHtml.initializers) {
    if (initializer.primitiveId && !primitiveById.has(initializer.primitiveId)) {
      requiredFailures.push(
        `Raw HTML initializer ${initializer.factory} links to missing primitive ${initializer.primitiveId}.`,
      );
    }

    if (initializer.primitiveId && !runtimeFactoryByName.has(initializer.factory)) {
      requiredFailures.push(
        `Raw HTML initializer ${initializer.factory} does not resolve to a runtime factory reference.`,
      );
    }
  }
};

const validateStylingDocsMetadata = (
  metadata: LayeredDocsMetadata,
  styledById: ReadonlyMap<string, StyledComponentDocsMetadata>,
  primitiveById: ReadonlyMap<string, PrimitiveDocsMetadata>,
  requiredFailures: string[],
) => {
  if (
    metadata.styling.docsPage.status !== "published" ||
    metadata.styling.docsPage.path !== STYLING_DOCS_PATH
  ) {
    requiredFailures.push("Styling docs page must be published at /docs/styling/.");
  }

  for (const section of metadata.styling.sections) {
    if (!section.docsPath.startsWith(STYLING_DOCS_PATH)) {
      requiredFailures.push(`Styling section ${section.id} links outside the Styling docs page.`);
    }
  }

  for (const recipe of metadata.styling.recipes) {
    if (!recipe.title || !recipe.summary) {
      requiredFailures.push(`Styling recipe ${recipe.id} is missing public docs copy.`);
    }
  }

  for (const component of metadata.styling.components) {
    const styledComponent = styledById.get(component.id);

    if (!styledComponent) {
      requiredFailures.push(
        `Styling metadata references missing styled component ${component.id}.`,
      );
      continue;
    }

    if (
      styledComponent.docsPage.status === "published" &&
      component.docsPath !== styledComponent.docsPage.path
    ) {
      requiredFailures.push(
        `styling metadata for ${component.id} is missing styled docs path ${styledComponent.docsPage.path}.`,
      );
    }

    for (const primitiveId of styledComponent.primitiveIds) {
      const primitive = primitiveById.get(primitiveId);

      if (!primitive) {
        continue;
      }

      if (!component.primitiveDocsPaths.includes(primitive.docsPage.path)) {
        requiredFailures.push(
          `styling metadata for ${component.id} is missing primitive docs path ${primitive.docsPage.path}.`,
        );
      }
    }
  }
};

const findDocsPagesByStatus = (metadata: LayeredDocsMetadata, status: DocsPageStatus) =>
  metadata.styledComponents
    .filter((component) => component.docsPage.status === status)
    .map((component) => `${component.id} (${component.docsPage.path})`);

export const isBehaviorFoundationType = (value: unknown): value is BehaviorFoundationType =>
  typeof value === "string" && Object.hasOwn(FOUNDATION_LABELS, value);

export const getLayeredDocsCheckFailures = (
  report: LayeredDocsValidationReport,
  options: LayeredDocsCheckFailureOptions = {},
) => [...report.requiredFailures, ...(options.requireDocs ? report.missingPublishedPages : [])];
