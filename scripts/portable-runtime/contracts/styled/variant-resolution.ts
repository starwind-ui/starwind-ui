import type { ClassVariantDefinition, StyledAdapterContract } from "./types.js";

export type ResolvedStyledVariantDefinition = {
  readonly definition: ClassVariantDefinition;
  readonly sourceComponent: string;
};

export const resolveStyledVariantDefinition = (
  contract: StyledAdapterContract,
  contractsByComponent: ReadonlyMap<string, StyledAdapterContract>,
  variantName: string,
): ResolvedStyledVariantDefinition | undefined => {
  const local = contract.variants?.[variantName];
  if (local) {
    return { definition: local, sourceComponent: contract.component };
  }

  const alias = contract.variantAliases?.[variantName];
  if (!alias) return undefined;

  const sourceComponent = getLocalVariantAliasSourceComponent(alias.source);
  if (!sourceComponent || !contract.dependencies?.styledComponents?.includes(sourceComponent)) {
    return undefined;
  }

  const importedDefinition =
    contractsByComponent.get(sourceComponent)?.variants?.[alias.importName];
  if (!importedDefinition) return undefined;

  return {
    sourceComponent,
    definition: {
      ...importedDefinition,
      defaultVariants: {
        ...importedDefinition.defaultVariants,
        ...alias.defaultVariants,
      },
    },
  };
};

export const getLocalVariantAliasSourceComponent = (source: string) =>
  /^\.\.\/([^/]+)\/variants$/.exec(source)?.[1];
