import type { RuntimeAdapterContract } from "../../../contracts/primitive/types.js";
import type {
  AttributeContract,
  FrameworkTarget,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../../../contracts/styled/types.js";
import { resolveStyledVariantDefinition } from "../../../contracts/styled/variant-resolution.js";
import type {
  StyledApiExportMetadata,
  StyledApiExportAnnotation,
  StyledApiInheritanceMetadata,
  StyledApiPropMetadata,
  StyledApiTargetMetadata,
  StyledDocsAnnotation,
  StyledFrameworkTarget,
} from "../types.js";
import { commonStyledPropDescriptions } from "../styled-api-descriptions.js";

const TARGETS = ["astro", "react"] as const satisfies readonly StyledFrameworkTarget[];
const FRAMEWORK_PLUMBING_PROPS = new Set(["children", "class", "className", "data-slot", "ref"]);

type PrimitivePartReference = {
  attrs: readonly AttributeContract[];
  primitiveId: string;
  part: string;
};

type PropCandidate = StyledApiPropMetadata & {
  exactPrimitivePassthrough: boolean;
};

export const buildStyledApiMetadata = (
  contract: StyledAdapterContract,
  allStyledContracts: readonly StyledAdapterContract[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  annotation: StyledDocsAnnotation,
  validationIssues: string[],
): Readonly<Record<StyledFrameworkTarget, StyledApiTargetMetadata>> =>
  Object.fromEntries(
    TARGETS.map((framework) => [
      framework,
      buildTargetMetadata(
        contract,
        allStyledContracts,
        primitiveById,
        annotation,
        framework,
        validationIssues,
      ),
    ]),
  ) as Readonly<Record<StyledFrameworkTarget, StyledApiTargetMetadata>>;

export const buildEmptyStyledApiMetadata = (): Readonly<
  Record<StyledFrameworkTarget, StyledApiTargetMetadata>
> => ({
  astro: { framework: "astro", exports: [] },
  react: { framework: "react", exports: [] },
});

const buildTargetMetadata = (
  contract: StyledAdapterContract,
  allStyledContracts: readonly StyledAdapterContract[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  annotation: StyledDocsAnnotation,
  framework: StyledFrameworkTarget,
  validationIssues: string[],
): StyledApiTargetMetadata => {
  if (!isInFramework(contract.frameworks, framework)) {
    return { framework, exports: [] };
  }

  return {
    framework,
    exports: contract.components
      .filter((component) => contract.publicExports.includes(component.exportName))
      .map((component) =>
        buildExportMetadata(
          contract,
          component,
          allStyledContracts,
          primitiveById,
          annotation,
          framework,
          validationIssues,
        ),
      ),
  };
};

const buildExportMetadata = (
  contract: StyledAdapterContract,
  component: StyledComponentContract,
  allStyledContracts: readonly StyledAdapterContract[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  annotation: StyledDocsAnnotation,
  framework: StyledFrameworkTarget,
  validationIssues: string[],
): StyledApiExportMetadata => {
  const exportAnnotation = annotation.styledApi?.[component.exportName];
  const primitiveParts = collectPrimitivePartReferences(component.render);
  const candidates = collectPropCandidates(
    contract,
    component,
    allStyledContracts,
    primitiveById,
    primitiveParts,
    framework,
    validationIssues,
  );
  const inheritance = collectInheritance(component, framework);

  validateExportAnnotations(
    contract.component,
    component.exportName,
    exportAnnotation,
    candidates,
    inheritance,
    validationIssues,
  );

  const props = [...candidates.values()]
    .filter((candidate) => {
      const propAnnotation = exportAnnotation?.props?.[candidate.name];
      if (propAnnotation?.include === false) return false;
      if (propAnnotation?.include === true) return true;
      return !candidate.exactPrimitivePassthrough;
    })
    .map(({ exactPrimitivePassthrough: _exactPrimitivePassthrough, ...candidate }) => {
      const propAnnotation = exportAnnotation?.props?.[candidate.name];
      const description =
        propAnnotation?.description ?? commonStyledPropDescriptions[candidate.name];
      if (!description) {
        validationIssues.push(
          `${contract.component}.${component.exportName} styled API prop ${candidate.name} is missing an authored description.`,
        );
      }

      return {
        ...candidate,
        ...(propAnnotation?.classification
          ? { classification: propAnnotation.classification }
          : {}),
        ...(propAnnotation?.defaultValue !== undefined
          ? { defaultValue: propAnnotation.defaultValue }
          : {}),
        ...(propAnnotation?.deprecated ? { deprecated: propAnnotation.deprecated } : {}),
        ...(description ? { description } : {}),
        descriptionSource: propAnnotation?.description ? "annotation" : "catalog",
        ...(propAnnotation?.type ? { type: propAnnotation.type } : {}),
      } satisfies StyledApiPropMetadata;
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    exportName: component.exportName,
    ...(exportAnnotation?.description ? { description: exportAnnotation.description } : {}),
    props,
    inheritance: inheritance.map((entry) => ({
      ...entry,
      ...(exportAnnotation?.inheritance?.[entry.key]?.description
        ? { description: exportAnnotation.inheritance[entry.key]?.description }
        : {}),
    })),
  };
};

const collectPropCandidates = (
  contract: StyledAdapterContract,
  component: StyledComponentContract,
  allStyledContracts: readonly StyledAdapterContract[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  primitiveParts: readonly PrimitivePartReference[],
  framework: StyledFrameworkTarget,
  validationIssues: string[],
) => {
  const candidates = new Map<string, PropCandidate>();
  const destructuredProps = new Map(
    (component.destructure?.props ?? [])
      .filter((prop) => isInFramework(prop.frameworks, framework))
      .map((prop) => [prop.name, prop]),
  );

  for (const extend of component.props?.extends ?? []) {
    if (extend.type !== "variantProps" || !isInFramework(extend.frameworks, framework)) continue;

    const definition = resolveVariantDefinition(contract, allStyledContracts, extend.variant);
    if (!definition) {
      validationIssues.push(
        `${contract.component}.${component.exportName} references undocumented variant ${extend.variant}.`,
      );
      continue;
    }

    const omitted = new Set(extend.omit ?? []);
    for (const name of omitted) {
      if (!Object.hasOwn(definition.variants ?? {}, name)) {
        validationIssues.push(
          `${contract.component}.${component.exportName} omits unknown ${extend.variant} variant prop ${name}.`,
        );
      }
    }
    for (const [name, choices] of Object.entries(definition.variants ?? {})) {
      if (omitted.has(name)) continue;

      if (!destructuredProps.has(name)) {
        validationIssues.push(
          `${contract.component}.${component.exportName} exposes variant prop ${name} without consuming it. Omit it from variantProps or destructure it.`,
        );
      }

      const values = Object.keys(choices);
      const defaultValue =
        destructuredProps.get(name)?.defaultValue ??
        formatDefaultValue(definition.defaultVariants?.[name]);
      addCandidate(candidates, {
        name,
        type: isBooleanVariant(values)
          ? "boolean"
          : values.map((value) => JSON.stringify(value)).join(" | "),
        required: false,
        classification: "variant",
        ...(defaultValue !== undefined ? { defaultValue } : {}),
        values,
        exactPrimitivePassthrough: false,
      });
    }
  }

  for (const field of component.props?.fields ?? []) {
    if (!isInFramework(field.frameworks, framework) || FRAMEWORK_PLUMBING_PROPS.has(field.name)) {
      continue;
    }

    const primitive = findForwardedPrimitiveProp(
      field.name,
      primitiveParts,
      primitiveById,
      framework,
    );
    const defaultValue = destructuredProps.get(field.name)?.defaultValue;
    const primitiveDefault = primitive?.prop.defaultValue;
    const isExactPrimitivePassthrough =
      primitive !== undefined &&
      normalizeType(field.type) === normalizeType(primitive.prop.type) &&
      !field.optional === Boolean(primitive.prop.required) &&
      normalizeDefault(defaultValue) === normalizeDefault(primitiveDefault);

    addCandidate(candidates, {
      name: field.name,
      type: field.type,
      required: !field.optional,
      classification: primitive ? "primitive-override" : "wrapper",
      ...(defaultValue !== undefined ? { defaultValue } : {}),
      ...(primitive
        ? {
            primitive: {
              primitiveId: primitive.primitiveId,
              part: primitive.part,
              propName: primitive.prop.name,
            },
          }
        : {}),
      exactPrimitivePassthrough: isExactPrimitivePassthrough,
    });
  }

  return candidates;
};

const addCandidate = (candidates: Map<string, PropCandidate>, candidate: PropCandidate) => {
  const existing = candidates.get(candidate.name);
  if (!existing) {
    candidates.set(candidate.name, candidate);
    return;
  }

  candidates.set(candidate.name, {
    ...existing,
    type: mergeUnionTypes(existing.type, candidate.type),
    required: existing.required && candidate.required,
    classification:
      existing.classification === "variant" || candidate.classification === "variant"
        ? "variant"
        : candidate.classification,
    ...(existing.defaultValue !== undefined
      ? { defaultValue: existing.defaultValue }
      : candidate.defaultValue !== undefined
        ? { defaultValue: candidate.defaultValue }
        : {}),
    ...(existing.values || candidate.values
      ? { values: [...new Set([...(existing.values ?? []), ...(candidate.values ?? [])])] }
      : {}),
    ...(existing.primitive
      ? { primitive: existing.primitive }
      : candidate.primitive
        ? { primitive: candidate.primitive }
        : {}),
    exactPrimitivePassthrough:
      existing.exactPrimitivePassthrough && candidate.exactPrimitivePassthrough,
  });
};

const collectInheritance = (
  component: StyledComponentContract,
  framework: StyledFrameworkTarget,
): StyledApiInheritanceMetadata[] => {
  const inheritance = new Map<string, StyledApiInheritanceMetadata>();

  for (const extend of component.props?.extends ?? []) {
    if (!isInFramework(extend.frameworks, framework)) continue;

    if (extend.type === "htmlAttributes" || extend.type === "omitHtmlAttributes") {
      const element =
        extend.element === "template" && framework === "astro" ? "div" : extend.element;
      const key = `html:${element}`;
      inheritance.set(key, {
        key,
        kind: "element-attributes",
        displayName: `${element} attributes`,
        element,
        omittedProps: extend.type === "omitHtmlAttributes" ? [...extend.keys].sort() : [],
      });
    } else if (extend.type === "componentProps") {
      const key = `component:${extend.component}.${extend.exportName}`;
      inheritance.set(key, {
        key,
        kind: "component-props",
        displayName: `${extend.exportName} props`,
        componentId: extend.component,
        exportName: extend.exportName,
        omittedProps: [...(extend.keys ?? [])].sort(),
      });
    } else if (extend.type === "raw") {
      const key = `raw:${extend.code}`;
      inheritance.set(key, {
        key,
        kind: "raw",
        displayName: extend.code,
        omittedProps: [],
      });
    }
  }

  return [...inheritance.values()].sort((left, right) => left.key.localeCompare(right.key));
};

const findForwardedPrimitiveProp = (
  propName: string,
  primitiveParts: readonly PrimitivePartReference[],
  primitiveById: ReadonlyMap<string, RuntimeAdapterContract>,
  framework: StyledFrameworkTarget,
):
  | { primitiveId: string; part: string; prop: RuntimeAdapterContract["props"][number] }
  | undefined => {
  for (const primitiveId of new Set(primitiveParts.map((reference) => reference.primitiveId))) {
    const primitive = primitiveById.get(primitiveId);
    const prop = primitive?.props.find(
      (candidate) =>
        candidate.name === propName && !candidate.unsupportedTargets?.includes(framework),
    );
    if (!primitive || !prop) continue;

    const referencedParts = primitiveParts.filter(
      (reference) =>
        reference.primitiveId === primitiveId &&
        reference.attrs.some(
          (attr) =>
            attr.name === propName &&
            isInFramework(attr.frameworks, framework) &&
            attr.value?.type === "variable" &&
            attr.value.name === propName,
        ),
    );
    const reference = prop.targets
      ? referencedParts.find((part) =>
          prop.targets?.some((target) => target.toLowerCase() === part.part.toLowerCase()),
        )
      : (referencedParts.find(
          (part) => part.part.toLowerCase() === primitive.runtime.rootPart.toLowerCase(),
        ) ?? referencedParts[0]);
    if (reference) return { ...reference, prop };
  }

  return undefined;
};

const collectPrimitivePartReferences = (nodes: readonly RenderNode[]) => {
  const references = new Map<string, PrimitivePartReference>();

  const visit = (node: RenderNode) => {
    if (node.type === "primitive") {
      const key = `${node.component}.${node.part}`;
      const existing = references.get(key);
      references.set(key, {
        attrs: [...(existing?.attrs ?? []), ...(node.attrs ?? [])],
        primitiveId: node.component,
        part: node.part,
      });
    }
    if ("children" in node && Array.isArray(node.children)) node.children.forEach(visit);
    if (node.type === "conditional") {
      node.then.forEach(visit);
      node.else.forEach(visit);
    }
    if (node.type === "slot") node.fallback?.forEach(visit);
  };

  nodes.forEach(visit);
  return [...references.values()].sort((left, right) =>
    `${left.primitiveId}.${left.part}`.localeCompare(`${right.primitiveId}.${right.part}`),
  );
};

const resolveVariantDefinition = (
  contract: StyledAdapterContract,
  allStyledContracts: readonly StyledAdapterContract[],
  variantName: string,
) =>
  resolveStyledVariantDefinition(
    contract,
    new Map(allStyledContracts.map((candidate) => [candidate.component, candidate])),
    variantName,
  )?.definition;

const validateExportAnnotations = (
  componentId: string,
  exportName: string,
  annotation: StyledApiExportAnnotation | undefined,
  candidates: ReadonlyMap<string, PropCandidate>,
  inheritance: readonly StyledApiInheritanceMetadata[],
  validationIssues: string[],
) => {
  if (!annotation) return;

  for (const propName of Object.keys(annotation.props ?? {})) {
    if (!candidates.has(propName)) {
      validationIssues.push(
        `${componentId}.${exportName} styled API annotation references unknown prop ${propName}.`,
      );
    }
  }

  const inheritanceKeys = new Set(inheritance.map((entry) => entry.key));
  for (const inheritanceKey of Object.keys(annotation.inheritance ?? {})) {
    if (!inheritanceKeys.has(inheritanceKey)) {
      validationIssues.push(
        `${componentId}.${exportName} styled API annotation references unknown inheritance ${inheritanceKey}.`,
      );
    }
  }
};

export const validateStyledApiExportAnnotationKeys = (
  contract: StyledAdapterContract,
  annotation: StyledDocsAnnotation,
  validationIssues: string[],
) => {
  const exportNames = new Set(contract.components.map((component) => component.exportName));
  for (const exportName of Object.keys(annotation.styledApi ?? {})) {
    if (!exportNames.has(exportName)) {
      validationIssues.push(
        `${contract.component} styled API annotation references unknown export ${exportName}.`,
      );
    }
  }
};

const isInFramework = (
  frameworks: readonly FrameworkTarget[] | undefined,
  framework: StyledFrameworkTarget,
) => !frameworks || frameworks.includes(framework);

const formatDefaultValue = (value: boolean | number | string | undefined) => {
  if (value === undefined) return undefined;
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
};

const normalizeDefault = (value: string | undefined) => value?.replace(/^['"]|['"]$/g, "");

const normalizeType = (value: string) => value.replace(/\s+/g, " ").trim();

const isBooleanVariant = (values: readonly string[]) =>
  values.length > 0 && values.every((value) => value === "true" || value === "false");

const mergeUnionTypes = (left: string, right: string) => {
  if (left === right) return left;
  return [...new Set([...left.split(" | "), ...right.split(" | ")])].join(" | ");
};
