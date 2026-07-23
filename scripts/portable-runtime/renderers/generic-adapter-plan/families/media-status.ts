import type {
  AdapterComponentFile,
  AdapterMediaStatusFacts,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  findPlanPropForTarget,
  getAdapterFamilyProp,
  getEvent,
  getIndefiniteArticle,
  getPart,
  getPartExportName,
  getPlanPropForTarget,
  getRequiredPlanValue,
  getStateModel,
  getStaticAttributeName,
} from "./toolkit.js";

export const mediaStatusAdapterFamilyPlan = {
  buildOutputModel: buildMediaStatusOutputModel,
  id: "media-status",
  matches: isMediaStatusOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildMediaStatusOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getMediaStatusFacts(plan);

  return {
    files: [
      createMediaStatusComponentFile(plan, "root", facts),
      createMediaStatusComponentFile(plan, "image", facts),
      createMediaStatusComponentFile(plan, "fallback", facts),
      {
        exports: {
          kind: "namespace",
          members: [
            { from: `./${facts.exports.fallback}`, name: facts.exports.fallback },
            { from: `./${facts.exports.image}`, name: facts.exports.image },
            { from: `./${facts.exports.root}`, name: facts.exports.root },
          ],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "media-status" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createMediaStatusComponentFile(
  plan: GenericAdapterPlan,
  partName: "fallback" | "image" | "root",
  facts: AdapterMediaStatusFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events:
        partName === "image"
          ? [
              {
                detailType: facts.event.detailsType,
                handlerProp: facts.event.callbackProp,
                runtimeEvent: facts.event.name,
                targetPart: "image",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "media-status", part: partName },
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
      props: getMediaStatusPropsForPart(partName, facts),
      refs: [{ id: `${partName}Ref`, part: partName, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${partName}Ref`, part: part.name, public: true }],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${exportName}`,
  };
}

function getMediaStatusPropsForPart(
  partName: "fallback" | "image" | "root",
  facts: AdapterMediaStatusFacts,
) {
  if (partName === "image") {
    return [
      {
        kind: "string" as const,
        name: facts.props.alt.name,
        required: true,
        type: facts.props.alt.type,
      },
      { kind: "unknown" as const, name: facts.props.asset.name, type: facts.props.asset.type },
      { kind: "string" as const, name: facts.props.src.name, type: facts.props.src.type },
      { kind: "callback" as const, name: facts.event.callbackProp, type: "function" },
    ];
  }

  if (partName === "fallback") {
    return [
      {
        kind: "string" as const,
        name: facts.props.delay.name,
        type: facts.props.delay.type,
      },
    ];
  }

  return [];
}

export function isMediaStatusOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const imagePart = plan.parts.find((part) => part.name === "image");
  const fallbackPart = plan.parts.find((part) => part.name === "fallback");
  const loadingStatusState = plan.stateModels.find(
    (stateModel) => stateModel.name === "imageLoadingStatus",
  );
  const loadingStatusEvent = plan.events.find((event) => event.name === "loadingStatusChange");
  const altProp = findPlanPropForTarget(plan, "alt", "image");
  const assetProp = findPlanPropForTarget(plan, "image", "image");
  const srcProp = findPlanPropForTarget(plan, "src", "image");
  const delayProp = findPlanPropForTarget(plan, "delay", "fallback");

  return (
    plan.component === "avatar" &&
    plan.category === "static-semantic" &&
    rootPart?.defaultElement === "span" &&
    rootPart.ownsRuntime === true &&
    imagePart?.defaultElement === "img" &&
    fallbackPart?.defaultElement === "span" &&
    loadingStatusState?.initialAttribute === "data-image-loading-status" &&
    loadingStatusState.runtimeGetter === "getImageLoadingStatus" &&
    loadingStatusEvent?.callbackProp === "onLoadingStatusChange" &&
    altProp?.required === true &&
    assetProp?.kind === "rendering" &&
    srcProp?.kind === "attribute" &&
    srcProp.type === "string" &&
    delayProp?.kind === "option" &&
    delayProp.type === "number"
  );
}

export function getMediaStatusFacts(plan: GenericAdapterPlan): AdapterMediaStatusFacts {
  if (!isMediaStatusOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a media-status plan.`);
  }

  const rootPart = getPart(plan, plan.runtime.rootPart);
  const imagePart = getPart(plan, "image");
  const fallbackPart = getPart(plan, "fallback");
  const loadingStatusStateModel = getStateModel(plan, "imageLoadingStatus");
  const loadingStatusAttribute = getRequiredPlanValue(
    loadingStatusStateModel.initialAttribute,
    `${plan.displayName} image loading status state is missing initialAttribute.`,
  );
  const loadingStatusEvent = getEvent(plan, "loadingStatusChange");
  const assetProp = getAdapterFamilyProp(getPlanPropForTarget(plan, "image", "image"));
  const srcProp = getAdapterFamilyProp(getPlanPropForTarget(plan, "src", "image"));
  const imageVisibility = plan.presence?.initialVisibility?.find(
    (visibility) =>
      visibility.part === "image" && visibility.hidden && visibility.mechanism === "css-visibility",
  );

  if (!imageVisibility) {
    throw new Error(
      `${plan.displayName} media-status image must declare layout-preserving CSS visibility concealment.`,
    );
  }

  return {
    attrs: {
      fallbackDelay: getStaticAttributeName(plan, fallbackPart, "data-delay"),
      fallbackStatus: getStaticAttributeName(plan, fallbackPart, loadingStatusAttribute),
      imageStatus: getStaticAttributeName(plan, imagePart, loadingStatusAttribute),
      rootStatus: getStaticAttributeName(plan, rootPart, loadingStatusAttribute),
    },
    displayName: plan.displayName,
    errors: {
      missingSource: `Either '${srcProp.name}' or '${assetProp.name}' is required for ${getIndefiniteArticle(
        plan.displayName,
      )} ${plan.displayName.toLowerCase()} image.`,
    },
    event: {
      callbackProp: loadingStatusEvent.callbackProp,
      detailsType: getRequiredPlanValue(
        loadingStatusEvent.detailsType,
        `${plan.displayName} loading-status event is missing detailsType.`,
      ),
      domEvent: getRequiredPlanValue(
        loadingStatusEvent.domEvent,
        `${plan.displayName} loading-status event is missing domEvent.`,
      ),
      name: loadingStatusEvent.name,
      valueProperty: getRequiredPlanValue(
        loadingStatusEvent.valueProperty,
        `${plan.displayName} loading-status event is missing valueProperty.`,
      ),
    },
    exports: {
      fallback: getPartExportName(plan, "fallback"),
      image: getPartExportName(plan, "image"),
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
    },
    parts: {
      fallback: {
        defaultElement: fallbackPart.defaultElement,
        discoveryAttribute: fallbackPart.discoveryAttribute,
        name: fallbackPart.name,
        namespaceKey: "Fallback",
      },
      image: {
        defaultElement: imagePart.defaultElement,
        discoveryAttribute: imagePart.discoveryAttribute,
        name: imagePart.name,
        namespaceKey: "Image",
      },
      root: {
        defaultElement: rootPart.defaultElement,
        discoveryAttribute: rootPart.discoveryAttribute,
        name: rootPart.name,
        namespaceKey: "Root",
      },
    },
    presence: {
      imageConcealment: {
        property: "visibility",
        value: "hidden",
      },
    },
    props: {
      alt: getAdapterFamilyProp(getPlanPropForTarget(plan, "alt", "image")),
      asset: assetProp,
      delay: getAdapterFamilyProp(getPlanPropForTarget(plan, "delay", "fallback")),
      src: srcProp,
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
    },
    state: {
      getter: getRequiredPlanValue(
        loadingStatusStateModel.runtimeGetter,
        `${plan.displayName} image loading status state is missing runtimeGetter.`,
      ),
      name: loadingStatusStateModel.name,
      type: getRequiredPlanValue(
        loadingStatusStateModel.valueType,
        `${plan.displayName} image loading status state is missing valueType.`,
      ),
    },
  };
}

function pluralizeDisplayName(value: string): string {
  return /(ch|sh|s|x)$/i.test(value) ? `${value}es` : `${value}s`;
}
