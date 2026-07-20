import type { GenericAdapterPlanClassification } from "../../generic-adapter-plan/types.js";
import type { FrameworkAdapterFutureFrameworkTracer } from "../future-framework-tracer-types.js";
import { printGenericFutureFrameworkTracerPlan } from "./generic-future-framework-tracer.js";
import {
  printSelectFutureFrameworkTracerSpec,
  printSpecializedFutureFrameworkTracerSpec,
} from "./specialized-future-framework-tracer.js";

const vueFutureFrameworkTracerClassifications = [
  {
    component: "toggle/vue",
    reason:
      "Unsupported, non-normative Vue SFC tracer evidence for the Toggle boolean-control generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "collapsible/vue",
    reason:
      "Unsupported, non-normative Vue SFC tracer evidence for the Collapsible disclosure/presence generic adapter plan; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "menu/vue",
    reason:
      "Unsupported, non-normative Vue SFC tracer evidence for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "navigation-menu/vue",
    reason:
      "Unsupported, non-normative Vue SFC tracer evidence for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
  {
    component: "combobox/vue",
    reason:
      "Unsupported, non-normative Vue SFC tracer evidence for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
    strategy: "future-framework-tracer",
  },
] as const satisfies readonly GenericAdapterPlanClassification[];

export const vueFutureFrameworkTracer = {
  classifications: vueFutureFrameworkTracerClassifications,
  printGenericAdapterPlan: printGenericFutureFrameworkTracerPlan,
  printSelectSpecializedAdapterSpec: printSelectFutureFrameworkTracerSpec,
  printSpecializedAdapterSpec: printSpecializedFutureFrameworkTracerSpec,
} satisfies FrameworkAdapterFutureFrameworkTracer;
