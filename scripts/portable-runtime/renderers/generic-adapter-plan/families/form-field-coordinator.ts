import type {
  AdapterComponentFile,
  AdapterFormFieldCoordinatorFacts,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  getAdapterFamilyProp,
  getPart,
  getPartExportName,
  getPlanProp,
  getRequiredPlanValue,
  getRuntimeTypeImportSource,
  getStaticAttributeName,
  getStaticAttributeValue,
  hasExactNames,
  pluralizeDisplayName,
  toCamelCase,
} from "./toolkit.js";

export const formFieldCoordinatorAdapterFamilyPlan = {
  buildOutputModel: buildFormFieldCoordinatorOutputModel,
  id: "form-field-coordinator",
  matches: isFormFieldCoordinatorOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildFormFieldCoordinatorOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getFormFieldCoordinatorFacts(plan);

  return {
    files: [
      createFormFieldCoordinatorComponentFile(plan, "root", facts),
      createFormFieldCoordinatorComponentFile(plan, "error-summary", facts),
      {
        exports: {
          kind: "namespace",
          members: [
            { from: `./${facts.exports.errorSummary}`, name: facts.exports.errorSummary },
            { from: `./${facts.exports.root}`, name: facts.exports.root },
          ],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "form-field-coordinator" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: facts.runtime.typeExports.map((typeName) => ({
          body: {
            code: `export type { ${typeName} } from "${facts.runtime.typeImportSource}";`,
          },
          exports: [typeName],
          name: typeName,
        })),
      },
    ],
  };
}

function createFormFieldCoordinatorComponentFile(
  plan: GenericAdapterPlan,
  partName: "error-summary" | "root",
  facts: AdapterFormFieldCoordinatorFacts,
): AdapterComponentFile {
  const part = facts.parts[partName === "root" ? "root" : "errorSummary"];
  const exportName = facts.exports[partName === "root" ? "root" : "errorSummary"];
  const refId = `${toCamelCase(partName)}Ref`;

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "form-field-coordinator", part: partName },
      imports: [],
      lifecycle:
        partName === "root"
          ? {
              cleanup: { code: "instance.destroy();" },
              factory: facts.runtime.factory,
              factoryImport: {
                id: "runtime",
                kind: "value",
                members: [{ imported: facts.runtime.factory }],
                source: facts.runtime.importSource,
              },
              mount: { code: `${facts.runtime.factory}(root)` },
              options: [],
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props:
        partName === "root"
          ? [
              facts.props.dataErrorVisibility,
              facts.props.dataRevalidationTiming,
              facts.props.dataValidationTiming,
              facts.props.errorVisibility,
              facts.props.revalidationTiming,
              facts.props.validationTiming,
            ].map((prop) => ({ kind: "string" as const, name: prop.name, type: prop.type }))
          : [],
      refs: [{ id: refId, part: part.name, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: refId, part: part.name, public: true }],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${exportName}`,
  };
}

function isFormFieldCoordinatorOutputModelPlan(plan: GenericAdapterPlan): boolean {
  if (plan.category !== "field-control-coordinator" || plan.component !== "form") {
    return false;
  }

  const partNames = plan.parts.map((part) => part.name);
  const rootPart = plan.parts.find((part) => part.name === "root");
  const errorSummaryPart = plan.parts.find((part) => part.name === "error-summary");
  const propNames = plan.props.map((prop) => prop.name);

  return (
    hasExactNames(partNames, ["root", "error-summary"]) &&
    rootPart?.defaultElement === "form" &&
    rootPart.ownsRuntime === true &&
    errorSummaryPart?.defaultElement === "div" &&
    hasExactNames(propNames, [
      "data-error-visibility",
      "data-revalidation-timing",
      "data-validation-timing",
      "errorVisibility",
      "revalidationTiming",
      "validationTiming",
    ])
  );
}

function getFormFieldCoordinatorFacts(plan: GenericAdapterPlan): AdapterFormFieldCoordinatorFacts {
  if (!isFormFieldCoordinatorOutputModelPlan(plan)) {
    throw new Error(
      `${plan.displayName} generic adapter plan is not a form-field coordinator plan.`,
    );
  }

  const rootPart = getPart(plan, "root");
  const errorSummaryPart = getPart(plan, "error-summary");
  const rootSlotValue = getStaticAttributeValue(plan, rootPart, "data-slot");
  const errorSummarySlotValue = getStaticAttributeValue(plan, errorSummaryPart, "data-slot");
  const validationTimingProp = getAdapterFamilyProp(getPlanProp(plan, "validationTiming"));

  return {
    attrs: {
      errorSummary: errorSummaryPart.discoveryAttribute,
      errorSummaryAriaAtomic: getStaticAttributeName(plan, errorSummaryPart, "aria-atomic"),
      errorSummaryAriaLive: getStaticAttributeName(plan, errorSummaryPart, "aria-live"),
      errorSummaryHidden: getStaticAttributeName(plan, errorSummaryPart, "hidden"),
      errorSummaryRole: getStaticAttributeName(plan, errorSummaryPart, "role"),
      errorSummarySlot: getStaticAttributeName(plan, errorSummaryPart, "data-slot"),
      errorVisibility: getStaticAttributeName(plan, rootPart, "data-error-visibility"),
      revalidationTiming: getStaticAttributeName(plan, rootPart, "data-revalidation-timing"),
      root: rootPart.discoveryAttribute,
      rootSlot: getStaticAttributeName(plan, rootPart, "data-slot"),
      validationTiming: getStaticAttributeName(plan, rootPart, "data-validation-timing"),
    },
    displayName: plan.displayName,
    exports: {
      errorSummary: getPartExportName(plan, "error-summary"),
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
    },
    parts: {
      errorSummary: {
        ...errorSummaryPart,
        namespaceKey: "ErrorSummary",
        slotValue: getRequiredPlanValue(
          errorSummarySlotValue,
          `${plan.displayName} error summary data-slot must be constant.`,
        ),
      },
      root: {
        ...rootPart,
        namespaceKey: "Root",
        slotValue: getRequiredPlanValue(
          rootSlotValue,
          `${plan.displayName} root data-slot must be constant.`,
        ),
      },
    },
    props: {
      dataErrorVisibility: getAdapterFamilyProp(getPlanProp(plan, "data-error-visibility")),
      dataRevalidationTiming: getAdapterFamilyProp(getPlanProp(plan, "data-revalidation-timing")),
      dataValidationTiming: getAdapterFamilyProp(getPlanProp(plan, "data-validation-timing")),
      errorVisibility: getAdapterFamilyProp(getPlanProp(plan, "errorVisibility")),
      revalidationTiming: getAdapterFamilyProp(getPlanProp(plan, "revalidationTiming")),
      validationTiming: validationTimingProp,
    },
    runtime: {
      factory: plan.runtime.factory,
      helperExports: [plan.runtime.factory, "createFormSchemaValidator", "validateFormSchema"],
      importSource: plan.runtime.importSource,
      rootVariable: rootPart.defaultElement,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
      typeExports: ["FormExternalErrors", "FormSchemaResult", "FormValidationTiming", "FormValues"],
      typeImportSource: getRuntimeTypeImportSource(plan),
      validationTimingType: validationTimingProp.type,
    },
  };
}
