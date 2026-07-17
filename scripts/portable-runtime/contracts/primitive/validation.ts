import type {
  FrameworkTarget,
  PrimitiveEscapeHatchContract,
  PrimitivePartContract,
  PrimitivePropContract,
  RuntimeAdapterContract,
} from "./types.js";

export type RuntimeAdapterContractIssue = {
  component: string;
  message: string;
  path: string;
};

const FRAMEWORK_TARGETS = ["astro", "react", "solid", "svelte", "vue"] satisfies FrameworkTarget[];

export function validateRuntimeAdapterContracts(
  contracts: readonly RuntimeAdapterContract[],
): RuntimeAdapterContractIssue[] {
  const issues: RuntimeAdapterContractIssue[] = [];
  const seenComponents = new Set<string>();

  for (const contract of contracts) {
    if (seenComponents.has(contract.component)) {
      issues.push(
        issue(contract, "component", `Duplicate primitive component "${contract.component}".`),
      );
    }
    seenComponents.add(contract.component);

    validateContract(contract, issues);
  }

  return issues;
}

function validateContract(
  contract: RuntimeAdapterContract,
  issues: RuntimeAdapterContractIssue[],
): void {
  const parts = new Map<string, PrimitivePartContract>();
  const discoveryAttributes = new Set<string>();

  for (const part of contract.parts) {
    if (parts.has(part.name)) {
      issues.push(issue(contract, `parts.${part.name}`, `Duplicate part "${part.name}".`));
    }
    parts.set(part.name, part);

    if (discoveryAttributes.has(part.discoveryAttribute)) {
      issues.push(
        issue(
          contract,
          `parts.${part.name}.discoveryAttribute`,
          `Duplicate discovery attribute "${part.discoveryAttribute}".`,
        ),
      );
    }
    discoveryAttributes.add(part.discoveryAttribute);
  }

  const props = contract.props;
  if (!contract.runtime.factory?.trim()) {
    issues.push(issue(contract, "runtime.factory", "Missing runtime factory."));
  }
  if (!contract.runtime.importSource?.trim()) {
    issues.push(issue(contract, "runtime.importSource", "Missing runtime import source."));
  }
  if (!contract.runtime.rootPart?.trim()) {
    issues.push(issue(contract, "runtime.rootPart", "Missing runtime root part."));
  } else {
    requirePart(contract, parts, contract.runtime.rootPart, "runtime.rootPart", issues);
  }
  if (contract.runtime.destroys !== true) {
    issues.push(issue(contract, "runtime.destroys", "Runtime bridge must declare destroys: true."));
  }

  for (const optionProp of contract.runtime.optionProps ?? []) {
    requireProp(contract, props, optionProp, `runtime.optionProps.${optionProp}`, issues);
  }

  for (const lifecycleProp of Object.keys(contract.runtime.optionPropLifecycles ?? {})) {
    if (!contract.runtime.optionProps?.includes(lifecycleProp)) {
      issues.push(
        issue(
          contract,
          `runtime.optionPropLifecycles.${lifecycleProp}`,
          `Lifecycle declared for non-runtime option prop "${lifecycleProp}".`,
        ),
      );
    }
  }

  for (const part of contract.parts) {
    for (const requiredContext of part.requiresContext ?? []) {
      if (!contract.context?.some((entry) => entry.name === requiredContext)) {
        issues.push(
          issue(
            contract,
            `parts.${part.name}.requiresContext`,
            `Part "${part.name}" requires missing context "${requiredContext}".`,
          ),
        );
      }
    }
  }

  for (const prop of contract.props) {
    for (const target of prop.targets ?? []) {
      requirePart(contract, parts, target, `props.${prop.name}.targets`, issues);
    }
  }

  for (const stateModel of contract.stateModels ?? []) {
    if (stateModel.controlledProp) {
      requireProp(
        contract,
        props,
        stateModel.controlledProp,
        `stateModels.${stateModel.name}`,
        issues,
      );
    }
    if (stateModel.defaultProp) {
      requireProp(
        contract,
        props,
        stateModel.defaultProp,
        `stateModels.${stateModel.name}`,
        issues,
      );
    }
  }

  for (const event of contract.events ?? []) {
    requireProp(contract, props, event.callbackProp, `events.${event.name}.callbackProp`, issues);
    requirePart(contract, parts, event.emitsFrom, `events.${event.name}.emitsFrom`, issues);
  }

  for (const setter of contract.setters ?? []) {
    if ("stateModel" in setter && setter.stateModel) {
      if (!contract.stateModels?.some((stateModel) => stateModel.name === setter.stateModel)) {
        issues.push(
          issue(
            contract,
            `setters.${setter.method}.stateModel`,
            `Setter "${setter.method}" references missing state model "${setter.stateModel}".`,
          ),
        );
      }
    }
    if ("prop" in setter && setter.prop) {
      requireProp(contract, props, setter.prop, `setters.${setter.method}.prop`, issues);
    }
    if ("props" in setter && setter.props) {
      for (const prop of setter.props) {
        requireProp(contract, props, prop, `setters.${setter.method}.props`, issues);
      }
    }
  }

  if (contract.form?.hiddenInput) {
    requirePart(contract, parts, contract.form.hiddenInput.part, "form.hiddenInput.part", issues);
  }
  for (const formProp of contract.form?.props ?? []) {
    requireProp(contract, props, formProp, `form.props.${formProp}`, issues);
  }

  for (const part of contract.presence?.initialHiddenParts ?? []) {
    requirePart(contract, parts, part, "presence.initialHiddenParts", issues);
  }
  for (const visibility of contract.presence?.initialVisibility ?? []) {
    requirePart(contract, parts, visibility.part, "presence.initialVisibility", issues);
  }

  if (contract.floating) {
    requirePart(contract, parts, contract.floating.anchorPart, "floating.anchorPart", issues);
    requirePart(
      contract,
      parts,
      contract.floating.positionerPart,
      "floating.positionerPart",
      issues,
    );
    requirePart(contract, parts, contract.floating.popupPart, "floating.popupPart", issues);
    if (contract.floating.portalPart) {
      requirePart(contract, parts, contract.floating.portalPart, "floating.portalPart", issues);
    }
    for (const floatingProp of contract.floating.optionProps) {
      requireProp(contract, props, floatingProp, `floating.optionProps.${floatingProp}`, issues);
    }
  }

  for (const ref of contract.refs ?? []) {
    requirePart(contract, parts, ref.part, "refs.part", issues);
  }

  for (const asChild of contract.asChild ?? []) {
    requirePart(contract, parts, asChild.part, "asChild.part", issues);
  }

  for (const initialMarkup of contract.initialMarkup ?? []) {
    const part = requirePart(contract, parts, initialMarkup.part, "initialMarkup.part", issues);
    if (!part) continue;

    const declaredAttributes = new Set([
      part.discoveryAttribute,
      ...(part.role ? ["role"] : []),
      ...(part.initialAttributes ?? []).map((attribute) => attribute.name),
    ]);

    for (const attribute of initialMarkup.attributes) {
      if (!declaredAttributes.has(attribute)) {
        issues.push(
          issue(
            contract,
            `initialMarkup.${initialMarkup.part}.attributes`,
            `Initial markup attribute "${attribute}" is not declared on part "${initialMarkup.part}".`,
          ),
        );
      }
    }
  }

  const initialProjection = contract.initialStateProjection;
  if (initialProjection) {
    if (!initialProjection.importSource?.trim()) {
      issues.push(
        issue(contract, "initialStateProjection.importSource", "Missing projection import source."),
      );
    }
    if (!initialProjection.createFunction?.trim()) {
      issues.push(
        issue(contract, "initialStateProjection.createFunction", "Missing state create function."),
      );
    }
    if (!initialProjection.projectFunction?.trim()) {
      issues.push(
        issue(contract, "initialStateProjection.projectFunction", "Missing part project function."),
      );
    }
    if (!/^data-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(initialProjection.ownershipAttribute)) {
      issues.push(
        issue(
          contract,
          "initialStateProjection.ownershipAttribute",
          "Projection ownership attribute must be a lowercase kebab-case data attribute.",
        ),
      );
    }
    const seenRootProps = new Set<string>();
    for (const prop of initialProjection.rootStateProps) {
      if (seenRootProps.has(prop)) {
        issues.push(
          issue(
            contract,
            "initialStateProjection.rootStateProps",
            `Duplicate root state prop "${prop}".`,
          ),
        );
      }
      seenRootProps.add(prop);
      requireProp(contract, props, prop, `initialStateProjection.rootStateProps.${prop}`, issues);
    }
    const dependencyParts = initialProjection.compositionDependencies.map((entry) => entry.part);
    const contractParts = contract.parts.map((part) => part.name);
    if (
      dependencyParts.length !== contractParts.length ||
      dependencyParts.some((part, index) => part !== contractParts[index])
    ) {
      issues.push(
        issue(
          contract,
          "initialStateProjection.compositionDependencies",
          "Projection composition dependencies must cover every part once in contract part order.",
        ),
      );
    }
    const seenDependencyParts = new Set<string>();
    for (const entry of initialProjection.compositionDependencies) {
      if (seenDependencyParts.has(entry.part)) {
        issues.push(
          issue(
            contract,
            `initialStateProjection.compositionDependencies.${entry.part}`,
            `Duplicate projection dependency entry for part "${entry.part}".`,
          ),
        );
      }
      seenDependencyParts.add(entry.part);
      requirePart(
        contract,
        parts,
        entry.part,
        `initialStateProjection.compositionDependencies.${entry.part}.part`,
        issues,
      );
      const seenDependencies = new Set<string>();
      for (const dependency of entry.dependsOn) {
        if (seenDependencies.has(dependency)) {
          issues.push(
            issue(
              contract,
              `initialStateProjection.compositionDependencies.${entry.part}.dependsOn`,
              `Duplicate composition dependency "${dependency}".`,
            ),
          );
        }
        seenDependencies.add(dependency);
        requirePart(
          contract,
          parts,
          dependency,
          `initialStateProjection.compositionDependencies.${entry.part}.dependsOn`,
          issues,
        );
      }
    }
  }

  const cssVariableNames = new Set<string>();
  for (const [index, cssVariable] of (contract.cssVariables ?? []).entries()) {
    const basePath = `cssVariables.${index}`;
    if (!/^--[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(cssVariable.name)) {
      issues.push(
        issue(
          contract,
          `${basePath}.name`,
          `Invalid CSS variable name "${cssVariable.name}"; expected a lowercase kebab-case custom property.`,
        ),
      );
    }
    if (cssVariableNames.has(cssVariable.name)) {
      issues.push(
        issue(contract, `${basePath}.name`, `Duplicate CSS variable "${cssVariable.name}".`),
      );
    }
    cssVariableNames.add(cssVariable.name);
    if (!cssVariable.description?.trim()) {
      issues.push(
        issue(contract, `${basePath}.description`, "CSS variable is missing a description."),
      );
    }
    if (!cssVariable.parts?.length) {
      issues.push(issue(contract, `${basePath}.parts`, "CSS variable must reference a part."));
    }
    for (const part of cssVariable.parts ?? []) {
      requirePart(contract, parts, part, `${basePath}.parts`, issues);
    }
  }

  for (const [index, escapeHatch] of (contract.escapeHatches ?? []).entries()) {
    validateEscapeHatch(contract, escapeHatch, index, issues);
  }
}

function validateEscapeHatch(
  contract: RuntimeAdapterContract,
  escapeHatch: PrimitiveEscapeHatchContract,
  index: number,
  issues: RuntimeAdapterContractIssue[],
): void {
  const basePath = `escapeHatches.${index}`;

  if (!escapeHatch.affectedFrameworks || escapeHatch.affectedFrameworks.length === 0) {
    issues.push(
      issue(
        contract,
        `${basePath}.affectedFrameworks`,
        "Escape hatch must list at least one affected framework.",
      ),
    );
  } else {
    validateFrameworkTargets(
      contract,
      escapeHatch.affectedFrameworks,
      `${basePath}.affectedFrameworks`,
      issues,
    );
  }

  if (!escapeHatch.boundary?.trim()) {
    issues.push(issue(contract, `${basePath}.boundary`, "Escape hatch is missing a boundary."));
  }
  if (!escapeHatch.reason?.trim()) {
    issues.push(issue(contract, `${basePath}.reason`, "Escape hatch is missing a reason."));
  }
  if (!escapeHatch.contractOwnedFacts?.some((fact) => fact.trim().length > 0)) {
    issues.push(
      issue(
        contract,
        `${basePath}.contractOwnedFacts`,
        "Escape hatch must list at least one contract-owned fact.",
      ),
    );
  }
  if (!escapeHatch.demotionCriteria?.trim()) {
    issues.push(
      issue(contract, `${basePath}.demotionCriteria`, "Escape hatch is missing demotion criteria."),
    );
  }
  if (!escapeHatch.tests?.some((test) => test.trim().length > 0)) {
    issues.push(issue(contract, `${basePath}.tests`, "Escape hatch must list at least one test."));
  }
}

function validateFrameworkTargets(
  contract: RuntimeAdapterContract,
  frameworks: readonly FrameworkTarget[],
  path: string,
  issues: RuntimeAdapterContractIssue[],
): void {
  const seen = new Set<string>();

  for (const framework of frameworks) {
    if (!FRAMEWORK_TARGETS.includes(framework)) {
      issues.push(
        issue(contract, `${path}.${framework}`, `Unsupported framework target "${framework}".`),
      );
    }
    if (seen.has(framework)) {
      issues.push(
        issue(contract, `${path}.${framework}`, `Duplicate framework target "${framework}".`),
      );
    }
    seen.add(framework);
  }
}

function requirePart(
  contract: RuntimeAdapterContract,
  parts: ReadonlyMap<string, PrimitivePartContract>,
  name: string,
  path: string,
  issues: RuntimeAdapterContractIssue[],
): PrimitivePartContract | undefined {
  const part = parts.get(name);
  if (!part) {
    issues.push(issue(contract, path, `Missing part "${name}".`));
  }

  return part;
}

function requireProp(
  contract: RuntimeAdapterContract,
  props: readonly PrimitivePropContract[],
  name: string,
  path: string,
  issues: RuntimeAdapterContractIssue[],
): void {
  if (!props.some((prop) => prop.name === name)) {
    issues.push(issue(contract, path, `Missing prop "${name}".`));
  }
}

function issue(
  contract: RuntimeAdapterContract,
  path: string,
  message: string,
): RuntimeAdapterContractIssue {
  return { component: contract.component, path, message };
}
