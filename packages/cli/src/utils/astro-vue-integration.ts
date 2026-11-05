import {
  type AstroIntegrationConfigReadiness,
  type AstroIntegrationPreflight,
  type AstroIntegrationPreparation,
  type AstroIntegrationSetupOutcome,
  createAstroFrameworkIntegration,
} from "./astro-framework-integration.js";

export type AstroVueConfigReadiness = AstroIntegrationConfigReadiness;
export type AstroVuePreflight = AstroIntegrationPreflight;
export type AstroVueSetupOutcome = AstroIntegrationSetupOutcome;
export type AstroVuePreparation = AstroIntegrationPreparation;

const astroVue = createAstroFrameworkIntegration({
  callName: "vue",
  fallbackImportName: "astroVueIntegration",
  importNames: ["vue", "astroVue", "astroVueIntegration"],
  label: "Vue",
  packageName: "@astrojs/vue",
});

export const inspectAstroVueConfig = astroVue.inspectConfig;
export const updateAstroVueConfigContent = astroVue.updateConfigContent;
export const inspectAstroVueConfigFile = astroVue.inspectConfigFile;
export const preflightAstroVueIntegration = astroVue.preflight;
export const ensureAstroVueIntegration = astroVue.ensure;
export const prepareAstroVueIntegration = astroVue.prepare;
export const applyAstroVueIntegration = astroVue.apply;
export const setupAstroVueConfig = astroVue.setupConfig;
