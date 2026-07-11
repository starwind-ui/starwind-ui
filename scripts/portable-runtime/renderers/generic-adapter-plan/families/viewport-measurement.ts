import type {
  AdapterComponentFile,
  AdapterOutputModel,
  AdapterViewportMeasurementFacts,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  findPlanPropForTarget,
  getAdapterFamilyProp,
  getPart,
  getPartExportName,
  getPlanPropForTarget,
  getRequiredPlanValue,
  getStaticAttributeName,
  pluralizeDisplayName,
} from "./toolkit.js";

export const viewportMeasurementAdapterFamilyPlan = {
  buildOutputModel: buildViewportMeasurementOutputModel,
  id: "viewport-measurement",
  matches: isViewportMeasurementOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildViewportMeasurementOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getViewportMeasurementFacts(plan);

  return {
    files: [
      createViewportMeasurementComponentFile(plan, "root", facts),
      createViewportMeasurementComponentFile(plan, "viewport", facts),
      createViewportMeasurementComponentFile(plan, "content", facts),
      createViewportMeasurementComponentFile(plan, "scrollbar", facts),
      createViewportMeasurementComponentFile(plan, "thumb", facts),
      createViewportMeasurementComponentFile(plan, "corner", facts),
      {
        exports: {
          kind: "namespace",
          members: [
            { from: `./${facts.exports.content}`, name: facts.exports.content },
            { from: `./${facts.exports.corner}`, name: facts.exports.corner },
            { from: `./${facts.exports.root}`, name: facts.exports.root },
            { from: `./${facts.exports.scrollbar}`, name: facts.exports.scrollbar },
            { from: `./${facts.exports.thumb}`, name: facts.exports.thumb },
            { from: `./${facts.exports.viewport}`, name: facts.exports.viewport },
          ],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "viewport-measurement" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createViewportMeasurementComponentFile(
  plan: GenericAdapterPlan,
  partName: "content" | "corner" | "root" | "scrollbar" | "thumb" | "viewport",
  facts: AdapterViewportMeasurementFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

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
      family: { facts, kind: "viewport-measurement", part: partName },
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
      props: getViewportMeasurementPropsForPart(partName, facts),
      refs: [{ id: `${partName}Ref`, part: part.name, public: true }],
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

function getViewportMeasurementPropsForPart(
  partName: "content" | "corner" | "root" | "scrollbar" | "thumb" | "viewport",
  facts: AdapterViewportMeasurementFacts,
) {
  if (partName === "root") {
    return [
      {
        kind: "unknown" as const,
        name: facts.props.overflowEdgeThreshold.name,
        type: facts.props.overflowEdgeThreshold.type,
      },
    ];
  }

  if (partName === "scrollbar") {
    return [
      {
        kind: "boolean" as const,
        name: facts.props.keepMounted.name,
        type: facts.props.keepMounted.type,
      },
      {
        kind: "string" as const,
        name: facts.props.orientation.name,
        type: facts.props.orientation.type,
      },
    ];
  }

  return [];
}

function isViewportMeasurementOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const viewportPart = plan.parts.find((part) => part.name === "viewport");
  const contentPart = plan.parts.find((part) => part.name === "content");
  const scrollbarPart = plan.parts.find((part) => part.name === "scrollbar");
  const thumbPart = plan.parts.find((part) => part.name === "thumb");
  const cornerPart = plan.parts.find((part) => part.name === "corner");
  const optionProps = plan.runtime.optionProps ?? [];
  const overflowEdgeThresholdProp = findPlanPropForTarget(plan, "overflowEdgeThreshold", "root");
  const keepMountedProp = findPlanPropForTarget(plan, "keepMounted", "scrollbar");
  const orientationProp = findPlanPropForTarget(plan, "orientation", "scrollbar");

  return (
    plan.category === "viewport-measurement" &&
    rootPart?.defaultElement === "div" &&
    rootPart.ownsRuntime === true &&
    viewportPart?.defaultElement === "div" &&
    contentPart?.defaultElement === "div" &&
    scrollbarPart?.defaultElement === "div" &&
    thumbPart?.defaultElement === "div" &&
    cornerPart?.defaultElement === "div" &&
    rootPart.role === "presentation" &&
    viewportPart.role === "presentation" &&
    contentPart.role === "presentation" &&
    optionProps.length === 1 &&
    optionProps.includes("overflowEdgeThreshold") &&
    overflowEdgeThresholdProp?.kind === "option" &&
    keepMountedProp?.kind === "rendering" &&
    orientationProp?.kind === "option"
  );
}

function getViewportMeasurementFacts(plan: GenericAdapterPlan): AdapterViewportMeasurementFacts {
  if (!isViewportMeasurementOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a viewport-measurement plan.`);
  }

  const rootPart = getPart(plan, plan.runtime.rootPart);
  const viewportPart = getPart(plan, "viewport");
  const contentPart = getPart(plan, "content");
  const scrollbarPart = getPart(plan, "scrollbar");
  const thumbPart = getPart(plan, "thumb");
  const cornerPart = getPart(plan, "corner");
  const overflowEdgeThresholdAttr = getStaticAttributeName(
    plan,
    rootPart,
    "data-overflow-edge-threshold",
  );

  return {
    attrs: {
      content: contentPart.discoveryAttribute,
      corner: cornerPart.discoveryAttribute,
      cornerAriaHidden: getStaticAttributeName(plan, cornerPart, "aria-hidden"),
      keepMounted: getStaticAttributeName(plan, scrollbarPart, "data-keep-mounted"),
      orientation: getStaticAttributeName(plan, scrollbarPart, "data-orientation"),
      overflowEdgeThreshold: overflowEdgeThresholdAttr,
      overflowEdgeThresholdEdges: {
        xEnd: `${overflowEdgeThresholdAttr}-x-end`,
        xStart: `${overflowEdgeThresholdAttr}-x-start`,
        yEnd: `${overflowEdgeThresholdAttr}-y-end`,
        yStart: `${overflowEdgeThresholdAttr}-y-start`,
      },
      root: rootPart.discoveryAttribute,
      scrollbar: scrollbarPart.discoveryAttribute,
      scrollbarAriaHidden: getStaticAttributeName(plan, scrollbarPart, "aria-hidden"),
      thumb: thumbPart.discoveryAttribute,
      viewport: viewportPart.discoveryAttribute,
      viewportStyle: getStaticAttributeName(plan, viewportPart, "style"),
      viewportTabIndex: getStaticAttributeName(plan, viewportPart, "tabIndex"),
      viewportTabindex: getStaticAttributeName(plan, viewportPart, "tabindex"),
    },
    displayName: plan.displayName,
    exports: {
      content: getPartExportName(plan, "content"),
      corner: getPartExportName(plan, "corner"),
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, "root"),
      scrollbar: getPartExportName(plan, "scrollbar"),
      thumb: getPartExportName(plan, "thumb"),
      viewport: getPartExportName(plan, "viewport"),
    },
    parts: {
      content: {
        ...contentPart,
        namespaceKey: "Content",
        role: getRequiredPlanValue(
          contentPart.role,
          `${plan.displayName} content part is missing role.`,
        ),
      },
      corner: { ...cornerPart, namespaceKey: "Corner" },
      root: {
        ...rootPart,
        namespaceKey: "Root",
        role: getRequiredPlanValue(rootPart.role, `${plan.displayName} root part is missing role.`),
      },
      scrollbar: { ...scrollbarPart, namespaceKey: "Scrollbar" },
      thumb: { ...thumbPart, namespaceKey: "Thumb" },
      viewport: {
        ...viewportPart,
        namespaceKey: "Viewport",
        role: getRequiredPlanValue(
          viewportPart.role,
          `${plan.displayName} viewport part is missing role.`,
        ),
      },
    },
    props: {
      keepMounted: getAdapterFamilyProp(getPlanPropForTarget(plan, "keepMounted", "scrollbar")),
      orientation: getAdapterFamilyProp(getPlanPropForTarget(plan, "orientation", "scrollbar")),
      overflowEdgeThreshold: getAdapterFamilyProp(
        getPlanPropForTarget(plan, "overflowEdgeThreshold", "root"),
      ),
    },
    runtime: {
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
    },
    threshold: {
      attributesTypeName: `${plan.displayName}OverflowEdgeThresholdAttributes`,
      helperName: "getOverflowEdgeThresholdAttributes",
      normalizeHelperName: "normalizeOverflowEdgeThresholdValue",
      typeName: `${plan.displayName}OverflowEdgeThreshold`,
    },
  };
}
