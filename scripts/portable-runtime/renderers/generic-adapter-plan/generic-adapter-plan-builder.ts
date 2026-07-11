import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import type { GenericAdapterPlan } from "./types.js";

export function buildGenericAdapterPlan(contract: RuntimeAdapterContract): GenericAdapterPlan {
  const partFiles = contract.parts
    .filter((part) => shouldGeneratePartFile(contract, part))
    .map((part) => {
      const exportName = getPartExportName(contract.displayName, part.name);
      return {
        exportName,
        kind: "part" as const,
        part: part.name,
        path: `${contract.component}/${exportName}`,
      };
    });

  return {
    asChild: contract.asChild?.map((asChild) => ({
      ...asChild,
      merges: [...asChild.merges],
    })),
    category: contract.category,
    component: contract.component,
    context: contract.context?.map((context) => ({
      ...context,
      values: [...context.values],
    })),
    displayName: contract.displayName,
    events: [...(contract.events ?? [])],
    escapeDeclarations:
      contract.escapeHatches?.map((escapeHatch) => ({
        boundary: escapeHatch.boundary,
        reason: escapeHatch.reason,
        tests: escapeHatch.tests,
      })) ?? [],
    exports: {
      defaultNamespace: true,
      members: partFiles.map((file) => ({
        file: file.path,
        name: file.exportName,
        part: file.part,
      })),
      namespace: contract.displayName,
    },
    files: [
      ...partFiles,
      {
        exportName: contract.displayName,
        kind: "index" as const,
        path: `${contract.component}/index`,
      },
    ],
    floating: contract.floating
      ? {
          ...contract.floating,
          optionProps: [...contract.floating.optionProps],
        }
      : undefined,
    form: contract.form
      ? {
          ...contract.form,
          hiddenInput: contract.form.hiddenInput ? { ...contract.form.hiddenInput } : undefined,
          props: [...contract.form.props],
        }
      : undefined,
    outputDirectory: contract.component,
    parts: contract.parts.map((part) => ({
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      forwardsRef: part.forwardsRef,
      initExclusionAttributes: part.initExclusionAttributes
        ? [...part.initExclusionAttributes]
        : undefined,
      name: part.name,
      ownsRuntime: part.ownsRuntime,
      role: part.role,
    })),
    presence: contract.presence
      ? {
          ...contract.presence,
          initialHiddenParts: [...contract.presence.initialHiddenParts],
          initialVisibility: contract.presence.initialVisibility?.map((visibility) => ({
            ...visibility,
            targets: [...visibility.targets],
          })),
        }
      : undefined,
    props: contract.props.map((prop) => ({
      defaultValue: prop.defaultValue,
      kind: prop.kind,
      name: prop.name,
      required: prop.required,
      targets: prop.targets,
      type: prop.type,
      unsupportedTargets: prop.unsupportedTargets,
    })),
    refs: [...(contract.refs ?? [])],
    runtime: {
      destroys: contract.runtime.destroys,
      factory: contract.runtime.factory,
      importSource: contract.runtime.importSource,
      optionProps: contract.runtime.optionProps,
      rootPart: contract.runtime.rootPart,
    },
    sourceContract: contract.component,
    staticAttributes: contract.parts.flatMap((part) =>
      (part.initialAttributes ?? []).map((attribute) => ({
        name: attribute.name,
        part: part.name,
        source: attribute.source,
        value: attribute.value,
      })),
    ),
    stateModels: [...(contract.stateModels ?? [])],
    setters: [...(contract.setters ?? [])],
  };
}

function shouldGeneratePartFile(
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
): boolean {
  if (
    contract.category === "single-boolean-control" &&
    contract.form &&
    part.defaultElement === "input"
  ) {
    const isHiddenInput = part.name === contract.form.hiddenInput?.part;
    const isPublicRef = contract.refs?.some((ref) => ref.part === part.name && ref.public) ?? false;

    if (isHiddenInput || !isPublicRef) {
      return false;
    }
  }

  return true;
}

function getPartExportName(displayName: string, partName: string): string {
  return `${displayName}${toPascalCase(partName)}`;
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}
