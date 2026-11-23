import { defineChartModule } from "@starwind-ui/runtime/chart";
import {
  type VisitorRow,
  visitorBars,
  visitorConfig,
  visitorData,
} from "../../../../../packages/runtime/tests/components/chart/fixtures";

export type { VisitorRow };
export { visitorConfig, visitorData };

/** The chart module that the Astro fixtures render and the browser registers. */
export const visitors = defineChartModule<VisitorRow>({
  id: "astro-visitors",
  ariaLabel: "Visitors",
  create: visitorBars,
});

export const iconConfig = {
  ...visitorConfig,
  desktop: { ...visitorConfig.desktop, icon: { paths: ["M4 4h16v16H4z"] } },
};

/** A static native definition, which owns its visibility. */
export const visitorDefinition = visitorBars({
  data: visitorData(),
  config: visitorConfig,
  keys: ["desktop", "mobile"],
  visible: ["desktop", "mobile"],
  params: {},
  isVisible: () => true,
  label: (key: string) => key,
  color: { domain: ["desktop", "mobile"], range: ["red", "blue"] },
  theme: { foreground: "black", muted: "gray", grid: "gray", background: "white" },
  tooltip: () => false as never,
});
