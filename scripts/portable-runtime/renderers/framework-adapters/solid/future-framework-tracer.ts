import type { GenericAdapterPlanClassification } from "../../generic-adapter-plan/types.js";
import type { FrameworkAdapterFutureFrameworkTracer } from "../future-framework-tracer-types.js";
import { printGenericFutureFrameworkTracerPlan } from "./generic-future-framework-tracer.js";
import {
  printSelectFutureFrameworkTracerSpec,
  printSpecializedFutureFrameworkTracerSpec,
} from "./specialized-future-framework-tracer.js";

export const solidPortalPlacementProof = {
  nativePrimitive: "Portal",
  placementOwner: "solid",
  policyOwner: "runtime",
  serverAndFirstHydrationPlacement: "inline",
} as const;

export const solidPortalWrapperException = {
  element: "div",
  owner: "solid-native-portal",
  publicPart: false,
  reason:
    "Solid Portal creates one internal container for non-head mounts; the Starwind public Portal wrapper remains its child.",
} as const;

export type SolidPortalPlacementTraceInput = {
  nativeContainer: string | null;
  nativeContainerParent: string | null;
  previousRequestedTarget: string | null;
  requestedTarget: string;
  wrapperParent: string | null;
};

export function projectSolidPortalPlacementTrace(input: SolidPortalPlacementTraceInput) {
  return {
    mountTarget: input.requestedTarget,
    outerTargetChanged: input.previousRequestedTarget !== input.requestedTarget,
    readinessTarget: input.nativeContainer,
    ready:
      input.nativeContainer !== null &&
      input.nativeContainerParent === input.requestedTarget &&
      input.wrapperParent === input.nativeContainer,
  } as const;
}

const solidFutureFrameworkTracerClassifications = [
  {
    component: "button/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Button generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "toggle/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "collapsible/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "select/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "menu/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "navigation-menu/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "combobox/solid",
    reason:
      "Non-shipping Solid TSX tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
] as const satisfies readonly GenericAdapterPlanClassification[];

export const solidFutureFrameworkTracer = {
  classifications: solidFutureFrameworkTracerClassifications,
  printGenericAdapterPlan: printGenericFutureFrameworkTracerPlan,
  printSelectSpecializedAdapterSpec: printSelectFutureFrameworkTracerSpec,
  printSpecializedAdapterSpec: printSpecializedFutureFrameworkTracerSpec,
} satisfies FrameworkAdapterFutureFrameworkTracer;
