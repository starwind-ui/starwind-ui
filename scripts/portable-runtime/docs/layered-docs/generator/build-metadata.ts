import { runtimeAdapterContracts } from "../../../contracts/primitive/representatives.js";
import { type RuntimeAdapterContract } from "../../../contracts/primitive/types.js";
import { starwindStyledContracts } from "../../../contracts/styled/components/index.js";
import { type StyledAdapterContract } from "../../../contracts/styled/types.js";
import { componentGroups, primitiveDocsEnrichment, styledDocsAnnotations } from "../annotations.js";
import { primitiveDocsExampleCoveragePolicy, primitiveDocsExamples } from "../examples.js";
import {
  type ComponentGroupMetadata,
  type LayeredDocsMetadata,
  type PrimitiveDocsEnrichment,
  type PrimitiveDocsExampleCoveragePolicy,
  type PrimitiveDocsExampleRegistry,
  type PrimitiveDocsFrameworkTarget,
  type PrimitiveDocsMetadata,
  type RuntimeFactoryMetadata,
  type StyledComponentDocsMetadata,
  type StyledDocsAnnotation,
  type StyledFrameworkTarget,
} from "../types.js";
import {
  copyPrimitiveDocsAuthoredExample,
  loadPrimitiveAuthoredUsage,
  mergePrimitiveDocsEnrichmentWithAuthoredUsage,
  validatePrimitiveDocsEnrichment,
  validatePrimitiveDocsExampleRegistry,
} from "./authored-input.js";
import {
  buildFrameworkAvailability,
  buildPlaceholderStyledComponentMetadata,
  buildRuntimeDocsMetadata,
  buildStylingDocsMetadata,
  collectPrimitiveIds,
  collectSlots,
  collectStyledAliases,
  copyOptionPropLifecycles,
  loadRuntimeIndexSource,
  loadRuntimeInitStarwindSource,
  loadRuntimePackageExports,
  loadThemeTemplateSource,
  toRuntimeFactory,
  toRuntimePackageExportPath,
} from "./build-runtime-styling.js";
import {
  FOUNDATION_LABELS,
  FRAMEWORK_TARGETS,
  PRIMITIVE_DOCS_FRAMEWORK_TARGETS,
  RUNTIME_DOCS_PATH,
} from "./constants.js";
import {
  buildPrimitiveCanonicalNames,
  buildPrimitiveExportGroups,
  buildPrimitivePartApiReference,
  copyPrimitiveStateModel,
  getPublicPrimitiveAdapterParts,
  renderPrimitiveAnatomyCode,
  toPrimitiveEventMetadata,
} from "./descriptions/primitive-reference.js";
import { toPrimitiveSetterMetadata } from "./descriptions/setters.js";
import type { BuildLayeredDocsMetadataOptions } from "./options.js";
import { PRIMITIVE_AUTHORED_USAGE_ROOT, repoRoot } from "./paths.js";
import { dedupe, toKebabCase, toTitle } from "./shared.js";
import { isBehaviorFoundationType, validateFoundation } from "./validate-metadata.js";
import {
  buildStyledApiMetadata,
  validateStyledApiExportAnnotationKeys,
} from "./build-styled-api.js";

export const buildLayeredDocsMetadata = (
  options: BuildLayeredDocsMetadataOptions = {},
): LayeredDocsMetadata => {
  const groups = options.groups ?? componentGroups;
  const annotations = options.styledAnnotations ?? styledDocsAnnotations;
  const styledContracts = options.styledContracts ?? starwindStyledContracts;
  const exampleRegistry = options.primitiveDocsExamples ?? primitiveDocsExamples;
  const exampleCoveragePolicy =
    options.primitiveDocsExampleCoveragePolicy ?? primitiveDocsExampleCoveragePolicy;
  const primitiveById = new Map(
    runtimeAdapterContracts.map((contract) => [contract.component, contract]),
  );
  const styledIds = new Set(styledContracts.map((contract) => contract.component));
  const validationIssues: string[] = [];
  const primitiveAuthoredUsage = loadPrimitiveAuthoredUsage(
    primitiveById,
    options.primitiveDocsUsageRoot ?? PRIMITIVE_AUTHORED_USAGE_ROOT,
    repoRoot,
    validationIssues,
  );
  const primitiveEnrichment = mergePrimitiveDocsEnrichmentWithAuthoredUsage(
    options.primitiveDocsEnrichment ?? primitiveDocsEnrichment,
    primitiveAuthoredUsage,
  );
  const runtimeExports = options.runtimeExports ?? loadRuntimePackageExports(validationIssues);
  const runtimeIndexSource = options.runtimeIndexSource ?? loadRuntimeIndexSource(validationIssues);
  const initStarwindSource =
    options.initStarwindSource ?? loadRuntimeInitStarwindSource(validationIssues);
  const themeTemplateSource =
    options.themeTemplateSource ?? loadThemeTemplateSource(validationIssues);

  validateAnnotations(
    styledIds,
    primitiveById,
    groups,
    annotations,
    runtimeExports,
    runtimeIndexSource,
    validationIssues,
  );
  validatePrimitiveDocsEnrichment(primitiveById, primitiveEnrichment, validationIssues);
  validatePrimitiveDocsExampleRegistry(primitiveById, exampleRegistry, validationIssues);

  const styledComponents = styledContracts
    .map((contract) =>
      buildStyledComponentMetadata(
        contract,
        styledContracts,
        primitiveById,
        groups,
        annotations,
        validationIssues,
      ),
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  const primitives = runtimeAdapterContracts
    .map((contract) =>
      buildPrimitiveMetadata(
        contract,
        primitiveEnrichment[contract.component],
        styledComponents,
        exampleRegistry,
        exampleCoveragePolicy,
      ),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  const runtime = buildRuntimeDocsMetadata(
    primitives,
    runtimeExports,
    runtimeIndexSource,
    initStarwindSource,
    validationIssues,
  );
  const styling = buildStylingDocsMetadata(
    styledComponents,
    primitives,
    themeTemplateSource,
    validationIssues,
  );

  if (validationIssues.length > 0) {
    throw new Error(
      `Layered docs metadata validation failed:\n${validationIssues
        .map((issue) => `- ${issue}`)
        .join("\n")}`,
    );
  }

  return {
    version: 1,
    runtime,
    styling,
    groups: [...groups].sort((left, right) => left.order - right.order),
    styledComponents,
    primitives,
  };
};

const buildStyledComponentMetadata = (
  contract: StyledAdapterContract,
  styledContracts: readonly StyledAdapterContract[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  groups: readonly ComponentGroupMetadata[],
  annotations: Readonly<Record<string, StyledDocsAnnotation>>,
  validationIssues: string[],
): StyledComponentDocsMetadata => {
  const annotation = annotations[contract.component];
  if (!annotation) {
    validationIssues.push(`Missing styled docs annotation for ${contract.component}.`);
    return buildPlaceholderStyledComponentMetadata(contract, groups, annotations);
  }

  if (!isBehaviorFoundationType(annotation.foundation?.type)) {
    validationIssues.push(`${contract.component} is missing Behavior Foundation classification.`);
    return buildPlaceholderStyledComponentMetadata(contract, groups, annotations);
  }

  validateStyledApiExportAnnotationKeys(contract, annotation, validationIssues);

  const primitiveIds = collectPrimitiveIds(contract);
  validateFoundation(
    contract.component,
    annotation.foundation.type,
    primitiveIds,
    validationIssues,
  );

  const runtimeFactories = primitiveIds
    .map((primitiveId) => {
      const primitive = primitiveById.get(primitiveId);
      if (!primitive) {
        validationIssues.push(
          `${contract.component} references missing primitive contract ${primitiveId}.`,
        );
        return undefined;
      }

      return toRuntimeFactory(primitive);
    })
    .filter((factory): factory is RuntimeFactoryMetadata => factory !== undefined);

  return {
    id: contract.component,
    title: toTitle(contract.component),
    groupId: annotation.groupId,
    docsPage: annotation.docsPage,
    foundation: {
      type: annotation.foundation.type,
      label: FOUNDATION_LABELS[annotation.foundation.type],
      ...(annotation.foundation.reason ? { reason: annotation.foundation.reason } : {}),
    },
    frameworkAvailability: buildFrameworkAvailability(contract, annotation.frameworkAvailability),
    primitiveIds,
    runtimeFactories,
    publicExports: [...contract.publicExports],
    ...(contract.defaultExport ? { defaultExport: contract.defaultExport } : {}),
    ...(contract.variantCollectionName
      ? { variantCollectionName: contract.variantCollectionName }
      : {}),
    variantNames: [...Object.keys(contract.variants ?? {})].sort(),
    slots: collectSlots(contract),
    aliases: collectStyledAliases(
      contract,
      primitiveById,
      groups,
      annotations,
      annotation.aliases,
      primitiveIds,
    ),
    styledApi: buildStyledApiMetadata(
      contract,
      styledContracts,
      primitiveById,
      annotation,
      validationIssues,
    ),
  };
};

const buildPrimitiveMetadata = (
  contract: RuntimeAdapterContract,
  enrichment: PrimitiveDocsEnrichment | undefined,
  styledComponents: readonly StyledComponentDocsMetadata[],
  exampleRegistry: PrimitiveDocsExampleRegistry,
  exampleCoveragePolicy: PrimitiveDocsExampleCoveragePolicy,
): PrimitiveDocsMetadata => ({
  id: contract.component,
  displayName: contract.displayName,
  category: contract.category,
  runtime: {
    ...toRuntimeFactory(contract),
    rootPart: contract.runtime.rootPart,
    optionProps: [...(contract.runtime.optionProps ?? [])],
    ...(copyOptionPropLifecycles(contract)
      ? { optionPropLifecycles: copyOptionPropLifecycles(contract) }
      : {}),
    destroys: contract.runtime.destroys,
  },
  parts: contract.parts.map((part) => ({
    name: part.name,
    discoveryAttribute: part.discoveryAttribute,
    defaultElement: part.defaultElement,
    ...(part.role ? { role: part.role } : {}),
    ...(part.forwardsRef !== undefined ? { forwardsRef: part.forwardsRef } : {}),
    ...(part.ownsRuntime !== undefined ? { ownsRuntime: part.ownsRuntime } : {}),
    ...(part.requiresContext ? { requiresContext: [...part.requiresContext] } : {}),
    ...(part.initialAttributes
      ? {
          initialAttributes: part.initialAttributes.map((attribute) => ({
            name: attribute.name,
            source: attribute.source,
            ...(attribute.value !== undefined ? { value: attribute.value } : {}),
          })),
        }
      : {}),
  })),
  props: contract.props.map((prop) => ({
    ...(prop.defaultValue !== undefined ? { defaultValue: prop.defaultValue } : {}),
    ...(prop.unsupportedTargets ? { unsupportedTargets: [...prop.unsupportedTargets] } : {}),
    name: prop.name,
    kind: prop.kind,
    ...(prop.required !== undefined ? { required: prop.required } : {}),
    ...(prop.targets ? { targets: [...prop.targets] } : {}),
    type: prop.type,
  })),
  stateModels: (contract.stateModels ?? []).map((stateModel) =>
    copyPrimitiveStateModel(contract, stateModel, enrichment),
  ),
  events: (contract.events ?? []).map((event) =>
    toPrimitiveEventMetadata(contract, event, enrichment),
  ),
  setters: (contract.setters ?? []).map((setter) =>
    toPrimitiveSetterMetadata(contract, setter, enrichment),
  ),
  context: (contract.context ?? []).map((context) => ({
    name: context.name,
    direction: context.direction,
    values: [...context.values],
  })),
  refs: (contract.refs ?? []).map((ref) => ({
    part: ref.part,
    public: ref.public,
  })),
  asChild: (contract.asChild ?? []).map((asChild) => ({
    part: asChild.part,
    merges: [...asChild.merges],
  })),
  initialMarkup: (contract.initialMarkup ?? []).map((initialMarkup) => ({
    part: initialMarkup.part,
    attributes: [...initialMarkup.attributes],
    reason: initialMarkup.reason,
  })),
  ...(contract.form
    ? {
        form: {
          ...(contract.form.hiddenInput ? { hiddenInput: { ...contract.form.hiddenInput } } : {}),
          ...(contract.form.fieldIntegration !== undefined
            ? { fieldIntegration: contract.form.fieldIntegration }
            : {}),
          props: [...contract.form.props],
        },
      }
    : {}),
  ...(contract.presence
    ? {
        presence: {
          ...(contract.presence.keepMountedProp
            ? { keepMountedProp: contract.presence.keepMountedProp }
            : {}),
          initialHiddenParts: [...contract.presence.initialHiddenParts],
          ...(contract.presence.initialVisibility
            ? {
                initialVisibility: contract.presence.initialVisibility.map((visibility) => ({
                  ...(visibility.condition ? { condition: visibility.condition } : {}),
                  delivery: visibility.delivery,
                  hidden: visibility.hidden,
                  part: visibility.part,
                  targets: [...visibility.targets],
                })),
              }
            : {}),
          unmountPolicy: contract.presence.unmountPolicy,
        },
      }
    : {}),
  ...(contract.floating
    ? {
        floating: {
          anchorPart: contract.floating.anchorPart,
          ...(contract.floating.portalPart ? { portalPart: contract.floating.portalPart } : {}),
          positionerPart: contract.floating.positionerPart,
          popupPart: contract.floating.popupPart,
          optionProps: [...contract.floating.optionProps],
        },
      }
    : {}),
  ...toPrimitiveFrameworkNotesMetadata(contract.frameworkNotes, enrichment?.frameworkNotes),
  docsReference: buildPrimitiveDocsReference(
    contract,
    enrichment,
    styledComponents,
    exampleRegistry,
    exampleCoveragePolicy,
  ),
  docsPage: {
    status: "published" as const,
    path: `/docs/primitives/${contract.component}/`,
  },
  aliases: dedupe([
    contract.component,
    contract.displayName,
    toTitle(contract.component),
    contract.runtime.factory,
    contract.category,
  ]),
});

const toPrimitiveFrameworkNotesMetadata = (
  contractNotes: RuntimeAdapterContract["frameworkNotes"] | undefined,
  enrichmentNotes: PrimitiveDocsEnrichment["frameworkNotes"] | undefined,
) => {
  const merged = new Map<string, string[]>();

  for (const [framework, notes] of Object.entries(contractNotes ?? {})) {
    merged.set(framework, [...notes]);
  }

  for (const [framework, notes] of Object.entries(enrichmentNotes ?? {})) {
    merged.set(framework, [...(merged.get(framework) ?? []), ...notes]);
  }

  return merged.size > 0 ? { frameworkNotes: Object.fromEntries(merged) } : {};
};

const buildPrimitiveDocsReference = (
  contract: RuntimeAdapterContract,
  enrichment: PrimitiveDocsEnrichment | undefined = {},
  styledComponents: readonly StyledComponentDocsMetadata[],
  exampleRegistry: PrimitiveDocsExampleRegistry,
  exampleCoveragePolicy: PrimitiveDocsExampleCoveragePolicy,
) => {
  const publicAdapterParts = getPublicPrimitiveAdapterParts(contract);
  const examples = [
    ...buildPrimitiveDocsExamples(contract.component, exampleRegistry),
    ...(enrichment.examples ?? []).map((example) => ({ ...example })),
  ];
  const exampleCoverage = buildPrimitiveDocsExampleCoverage(
    contract.component,
    examples,
    exampleCoveragePolicy,
  );

  return {
    summary:
      enrichment.summary ??
      `${contract.displayName} is a Starwind Runtime primitive in the ${contract.category} contract family.`,
    frameworkTargets: [...PRIMITIVE_DOCS_FRAMEWORK_TARGETS],
    behaviorNotes: [...(enrichment.behaviorNotes ?? [])],
    usageGuidelines: (enrichment.usageGuidelines ?? []).map((guideline) => ({ ...guideline })),
    sections: (enrichment.sections ?? []).map((section) => ({ ...section })),
    examples,
    authoredExamples: (enrichment.authoredExamples ?? []).map(copyPrimitiveDocsAuthoredExample),
    exampleCoverage,
    anatomy: {
      importSource: `@starwind-ui/react/${contract.component}`,
      namespace: contract.displayName,
      parts: contract.parts.map((part) => part.name),
      code: renderPrimitiveAnatomyCode(contract, publicAdapterParts),
    },
    apiReference: {
      runtimeFactory: {
        ...toRuntimeFactory(contract),
        docsPath: `${RUNTIME_DOCS_PATH}#${toKebabCase(contract.runtime.factory)}`,
      },
      parts: contract.parts.map((part) =>
        buildPrimitivePartApiReference(contract, part, enrichment),
      ),
      exportGroups: buildPrimitiveExportGroups(contract, publicAdapterParts),
      canonicalNames: buildPrimitiveCanonicalNames(contract, publicAdapterParts),
      relatedStyledComponents: styledComponents
        .filter((component) => component.primitiveIds.includes(contract.component))
        .map((component) => ({
          id: component.id,
          title: component.title,
          docsPath: component.docsPage.path,
          foundationType: component.foundation.type,
        })),
    },
  };
};

const buildPrimitiveDocsExamples = (
  primitiveId: string,
  exampleRegistry: PrimitiveDocsExampleRegistry,
) => {
  const registryEntries = exampleRegistry[primitiveId] ?? {};

  return Object.entries(registryEntries).flatMap(([exampleId, frameworkEntries]) =>
    PRIMITIVE_DOCS_FRAMEWORK_TARGETS.flatMap((framework) => {
      const example = frameworkEntries[framework];

      return example
        ? [
            {
              id: exampleId,
              framework,
              title: example.title,
              summary: example.summary,
              ...(example.language ? { language: example.language } : {}),
              ...(example.code ? { code: example.code } : {}),
              ...(example.status ? { status: example.status } : {}),
              ...(example.source ? { source: example.source } : {}),
              ...(example.href ? { href: example.href } : {}),
            },
          ]
        : [];
    }),
  );
};

const buildPrimitiveDocsExampleCoverage = (
  primitiveId: string,
  examples: readonly {
    readonly code?: string;
    readonly framework: PrimitiveDocsFrameworkTarget;
    readonly status?: "available" | "planned";
  }[],
  coveragePolicy: PrimitiveDocsExampleCoveragePolicy,
) => {
  const exampleTargets = new Set(
    examples
      .filter((example) => example.code && example.status !== "planned")
      .map((example) => example.framework),
  );
  const missingTargets = coveragePolicy.requiredTargets.filter(
    (target) => !exampleTargets.has(target),
  );
  const allowedMissingTargets = missingTargets.filter((target) =>
    isMissingPrimitiveExampleTargetAllowed(primitiveId, target, coveragePolicy),
  );

  return {
    requiredTargets: [...coveragePolicy.requiredTargets],
    missingTargets,
    allowedMissingTargets,
  };
};

const isMissingPrimitiveExampleTargetAllowed = (
  primitiveId: string,
  target: PrimitiveDocsFrameworkTarget,
  coveragePolicy: PrimitiveDocsExampleCoveragePolicy,
) => {
  const primitiveAllowedTargets = coveragePolicy.allowedMissingTargets?.[primitiveId] ?? [];
  const wildcardAllowedTargets = coveragePolicy.allowedMissingTargets?.["*"] ?? [];

  return primitiveAllowedTargets.includes(target) || wildcardAllowedTargets.includes(target);
};

const validateAnnotations = (
  styledIds: ReadonlySet<string>,
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  groups: readonly ComponentGroupMetadata[],
  annotations: Readonly<Record<string, StyledDocsAnnotation>>,
  runtimeExports: ReadonlySet<string>,
  runtimeIndexSource: string,
  validationIssues: string[],
) => {
  const groupIds = new Set(groups.map((group) => group.id));

  for (const contractId of styledIds) {
    if (!annotations[contractId]) {
      validationIssues.push(`Missing styled docs annotation for ${contractId}.`);
    }
  }

  for (const [componentId, annotation] of Object.entries(annotations)) {
    if (!styledIds.has(componentId)) {
      validationIssues.push(`Styled docs annotation references unknown contract ${componentId}.`);
    }

    if (!groupIds.has(annotation.groupId)) {
      validationIssues.push(
        `${componentId} references unknown component group ${annotation.groupId}.`,
      );
    }

    if (!annotation.docsPage.path.startsWith("/docs/")) {
      validationIssues.push(`${componentId} docsPage.path must start with /docs/.`);
    }

    if (!isBehaviorFoundationType(annotation.foundation?.type)) {
      validationIssues.push(`${componentId} is missing Behavior Foundation classification.`);
    }

    for (const framework of Object.keys(annotation.frameworkAvailability ?? {})) {
      if (!FRAMEWORK_TARGETS.includes(framework as StyledFrameworkTarget)) {
        validationIssues.push(
          `${componentId} framework override references unknown target ${framework}.`,
        );
      }
    }
  }

  for (const primitive of primitiveById.values()) {
    if (!primitive.runtime.factory || !primitive.runtime.importSource) {
      validationIssues.push(`${primitive.component} is missing runtime factory metadata.`);
      continue;
    }

    const exportPath = toRuntimePackageExportPath(primitive.runtime.importSource);
    if (!runtimeExports.has(exportPath)) {
      validationIssues.push(
        `${primitive.component} runtime import ${primitive.runtime.importSource} is not exported by packages/runtime/package.json.`,
      );
    }

    if (!runtimeIndexSource.includes(primitive.runtime.factory)) {
      validationIssues.push(
        `${primitive.component} runtime factory ${primitive.runtime.factory} is not re-exported by packages/runtime/src/index.ts.`,
      );
    }
  }
};
