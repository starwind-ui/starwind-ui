import semver from "semver";

import {
  type AstroIntegrationConfigReadiness,
  type AstroIntegrationPreflight,
  type AstroIntegrationPreparation,
  type AstroIntegrationSetupOutcome,
  createAstroFrameworkIntegration,
} from "./astro-framework-integration.js";
import { getMinimumVersion } from "./astro-integration-version.js";

export type AstroSvelteConfigReadiness = AstroIntegrationConfigReadiness;
export type AstroSveltePreflight = AstroIntegrationPreflight;
export type AstroSvelteSetupOutcome = AstroIntegrationSetupOutcome;
export type AstroSveltePreparation = AstroIntegrationPreparation;

/** @astrojs/svelte 7 is the only line for Astro 5, and it declares a TypeScript 5 peer. */
const ASTRO_5_TYPESCRIPT_PEER = "^5.3.3";

const astroSvelte = createAstroFrameworkIntegration({
  callName: "svelte",
  // A Svelte host that is already configured keeps working when Astro cannot be read.
  keepConfiguredWithUnknownAstro: true,
  fallbackImportName: "astroSvelteIntegration",
  importNames: ["svelte", "astroSvelte", "astroSvelteIntegration"],
  label: "Svelte",
  packageName: "@astrojs/svelte",
  async checkPeers({ astroMajor, dependencies, readInstalledVersion }) {
    if (astroMajor !== 5) return undefined;
    const installed = await readInstalledVersion("typescript");
    const version = safeMinimumVersion(installed) ?? safeMinimumVersion(dependencies.typescript);
    if (!version || semver.satisfies(version, ASTRO_5_TYPESCRIPT_PEER)) return undefined;
    return `@astrojs/svelte 7 supports Astro 5 and needs TypeScript ${ASTRO_5_TYPESCRIPT_PEER}, but this project uses TypeScript ${version.version}. Move TypeScript to ${ASTRO_5_TYPESCRIPT_PEER}, upgrade Astro, or configure the official Svelte integration manually.`;
  },
});

function safeMinimumVersion(range: string | undefined): semver.SemVer | undefined {
  try {
    return getMinimumVersion(range);
  } catch {
    return undefined;
  }
}

export const inspectAstroSvelteConfig = astroSvelte.inspectConfig;
export const updateAstroSvelteConfigContent = astroSvelte.updateConfigContent;
export const inspectAstroSvelteConfigFile = astroSvelte.inspectConfigFile;
export const preflightAstroSvelteIntegration = astroSvelte.preflight;
export const ensureAstroSvelteIntegration = astroSvelte.ensure;
export const prepareAstroSvelteIntegration = astroSvelte.prepare;
export const applyAstroSvelteIntegration = astroSvelte.apply;
export const setupAstroSvelteConfig = astroSvelte.setupConfig;
