import {
  frameworkAdapterTargets,
  getPrimitiveFrameworkAdapterTargetsForComponent,
} from "../../../renderers/framework-adapters/target-registry.js";
import type { PublicFrameworkMetadata, PrimitivePackageMetadata } from "../types.js";

export const publicFrameworks: readonly PublicFrameworkMetadata[] = frameworkAdapterTargets
  .filter(({ publicSupport }) => publicSupport.publicDocsClaim)
  .map(({ target, displayName, packageName, publicSupport }) => {
    if (!packageName) throw new Error(`Public framework ${target} needs a package name.`);
    if (target !== "astro" && target !== "react" && target !== "vue") {
      throw new Error(`Public docs metadata needs a declared framework target: ${target}.`);
    }
    const maturity = publicSupport.status === "public-beta" ? "beta" : "stable";
    return {
      target,
      label: displayName,
      maturity,
      packageName,
      installSpecifier: maturity === "beta" ? `${packageName}@beta` : packageName,
    };
  });

export const buildPrimitivePackages = (component: string): readonly PrimitivePackageMetadata[] => {
  const supported = getPrimitiveFrameworkAdapterTargetsForComponent(component);
  return publicFrameworks
    .filter(({ target }) => supported.includes(target))
    .map(({ target, packageName, installSpecifier }) => ({
      framework: target,
      packageName,
      importSource: `${packageName}/${component}`,
      installSpecifier,
    }));
};
