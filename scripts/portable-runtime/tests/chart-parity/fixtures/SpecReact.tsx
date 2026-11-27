// React form of the chart spec part cases. The Vue and Svelte fixtures render the same cases.
import { useState } from "react";

import {
  ChartArea,
  ChartBar,
  ChartContainer,
  ChartGrid,
  ChartLabel,
  ChartLegend,
  ChartLine,
  ChartLinearGradient,
  ChartPie,
  ChartPolarAngleAxis,
  ChartPolarGrid,
  ChartRadar,
  ChartRadialBar,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
} from "../../../../../apps/react-demo/src/components/starwind-runtime/chart";
import {
  legendFirstConfig,
  nestedLabel,
  nestedStops,
  shadcnGradient,
  shadcnPie,
  shadcnTopLabel,
  specChart,
  specKind,
  tooltipKeysConfig,
} from "./spec-charts";
import type { SpecCase } from "./cases";
import type { ParityControls } from "./controls";

/**
 * shadcn bar-label, line-label-custom and pie-label on one page. The bar labels format with an
 * inline function that reads the currency state.
 */
function LabelCharts({ controls }: { controls: ParityControls }) {
  const [currency, setCurrency] = useState<"usd" | "eur">("usd");
  const [renders, setRenders] = useState(0);
  Object.assign(controls, {
    toggleCurrency: () => setCurrency((value) => (value === "usd" ? "eur" : "usd")),
    rerender: () => setRenders((value) => value + 1),
  });
  const symbol = currency === "usd" ? "$" : "€";
  const { data, config } = specChart("bar");
  return (
    <div>
      <ChartContainer id="spec-labels-bar" data={data} config={config} data-renders={renders}>
        <ChartGrid vertical={false} />
        <ChartXAxis dataKey="month" tickMargin={10} tickFormatter={{ maxLength: 3 }} />
        <ChartBar
          dataKey="desktop"
          radius={8}
          label={{ ...shadcnTopLabel, formatter: (value: number) => `${symbol}${value}` }}
        />
      </ChartContainer>
      <ChartContainer id="spec-labels-line" data={shadcnPie.data} config={shadcnPie.config}>
        <ChartGrid vertical={false} />
        <ChartLine
          dataKey="visitors"
          label={{ ...shadcnTopLabel, dataKey: "browser", formatter: { configLabel: true } }}
        />
      </ChartContainer>
      <ChartContainer id="spec-labels-pie" data={shadcnPie.data} config={shadcnPie.config}>
        <ChartPie dataKey="visitors" nameKey="browser" label />
      </ChartContainer>
    </div>
  );
}

function LiveChart({ controls }: { controls: ParityControls }) {
  const [radius, setRadius] = useState(4);
  const [showMobile, setShowMobile] = useState(true);
  const [renders, setRenders] = useState(0);
  const [currency, setCurrency] = useState<"usd" | "eur">("usd");
  Object.assign(controls, {
    setRadius,
    toggleMobile: () => setShowMobile((value) => !value),
    toggleCurrency: () => setCurrency((value) => (value === "usd" ? "eur" : "usd")),
    rerender: () => setRenders((value) => value + 1),
  });
  const { data, config } = specChart("bar");
  return (
    <ChartContainer id="spec-live" data={data} config={config} data-renders={renders}>
      <ChartGrid vertical={false} />
      <ChartXAxis dataKey="month" tickFormatter={(value: string) => value.slice(0, 3)} />
      <ChartYAxis tickFormatter={(value: number) => `${currency === "usd" ? "$" : "€"}${value}`} />
      <ChartBar dataKey="desktop" radius={radius} />
      {showMobile && <ChartBar dataKey="mobile" radius={radius} />}
      <ChartLegend />
      <ChartTooltip content={<ChartTooltipContent formatter={{ suffix: " visits" }} />} />
    </ChartContainer>
  );
}

/** Stacked bars that expand to 100%, with a ChartTooltip cursor that the parent switches. */
function OptionsChart({ controls }: { controls: ParityControls }) {
  const [cursor, setCursor] = useState(false);
  Object.assign(controls, { toggleCursor: () => setCursor((value) => !value) });
  const { data, config } = specChart("bar");
  return (
    <ChartContainer id="spec-options" data={data} config={config} stackOffset="expand">
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartYAxis />
      <ChartBar dataKey="desktop" stackId="a" />
      <ChartBar dataKey="mobile" stackId="a" />
      <ChartTooltip cursor={cursor} />
    </ChartContainer>
  );
}

/** Two chart-level Tooltips. The first one supplies the body, so it decides the cursor. */
function CursorOrderChart({ controls }: { controls: ParityControls }) {
  const [cursors, setCursors] = useState<[boolean | undefined, boolean | undefined]>([
    undefined,
    false,
  ]);
  const [showFirst, setShowFirst] = useState(true);
  Object.assign(controls, {
    setCursors: (first: boolean | undefined, second: boolean | undefined) =>
      setCursors([first, second]),
    removeFirst: () => setShowFirst(false),
  });
  const { data, config } = specChart("bar");
  return (
    <ChartContainer id="spec-cursor-order" data={data} config={config}>
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartBar dataKey="desktop" />
      {showFirst && <ChartTooltip cursor={cursors[0]} />}
      <ChartTooltip cursor={cursors[1]} />
    </ChartContainer>
  );
}

/** A bar label and gradient stops that the parent edits in place, then renders again. */
function NestedChart({ controls }: { controls: ParityControls }) {
  const [label] = useState(nestedLabel);
  const [stops] = useState(nestedStops);
  const [, setRenders] = useState(0);
  Object.assign(controls, {
    editNested: () => {
      label.formatter.prefix = "€";
      stops[0]!.stopColor = "blue";
      setRenders((value) => value + 1);
    },
  });
  const { data, config } = specChart("bar");
  return (
    <ChartContainer id="spec-nested" data={data} config={config}>
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartLinearGradient id="fill-nested" stops={stops} />
      <ChartBar dataKey="desktop" fill="url(#fill-nested)" label={label} />
    </ChartContainer>
  );
}

/**
 * A legend before its bars and one after them, with a config key that no bar draws. The parent
 * removes a bar.
 */
function LegendFirstChart({ controls }: { controls: ParityControls }) {
  const [showMobile, setShowMobile] = useState(true);
  Object.assign(controls, { toggleMobile: () => setShowMobile((value) => !value) });
  return (
    <ChartContainer id="spec-legend-first" data={specChart("bar").data} config={legendFirstConfig}>
      <ChartLegend />
      <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
      <ChartBar dataKey="desktop" />
      {showMobile && <ChartBar dataKey="mobile" />}
      <ChartLegend />
    </ChartContainer>
  );
}

function WrappedBar({ dataKey }: { dataKey: string }) {
  return <ChartBar dataKey={dataKey} />;
}

export default function SpecReact({
  mode,
  controls = {},
}: {
  mode: SpecCase;
  controls?: ParityControls;
}) {
  if (mode === "spec-live") return <LiveChart controls={controls} />;
  if (mode === "spec-labels") return <LabelCharts controls={controls} />;
  if (mode === "spec-nested") return <NestedChart controls={controls} />;
  if (mode === "spec-legend-first") return <LegendFirstChart controls={controls} />;
  // A direct bar, a bar inside another component, then the legend.
  if (mode === "spec-legend-wrapped") {
    const { data, config } = specChart("bar");
    return (
      <ChartContainer id="spec-legend-wrapped" data={data} config={config}>
        <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
        <ChartBar dataKey="desktop" />
        <WrappedBar dataKey="mobile" />
        <ChartLegend />
      </ChartContainer>
    );
  }
  // shadcn area-gradient twice on one page: both charts use the gradient id "fillArea".
  if (mode === "spec-gradient") {
    const { data, config } = specChart("area");
    return (
      <div>
        {(["desktop", "mobile"] as const).map((key) => (
          <ChartContainer key={key} id={`spec-gradient-${key}`} data={data} config={config}>
            <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
            <ChartLinearGradient {...shadcnGradient(`var(--color-${key})`)} />
            <ChartArea dataKey={key} fill="url(#fillArea)" />
          </ChartContainer>
        ))}
      </div>
    );
  }
  if (mode === "spec-options") return <OptionsChart controls={controls} />;
  if (mode === "spec-cursor-order") return <CursorOrderChart controls={controls} />;
  // shadcn pie-donut-text and pie-legend: two center lines and a legend of the drawn slices. The
  // legend comes before the pie, so its first render needs the pie from the seed.
  if (mode === "spec-pie-text")
    return (
      <ChartContainer id="spec-pie-text" data={shadcnPie.data} config={shadcnPie.config}>
        <ChartLegend />
        <ChartPie dataKey="visitors" nameKey="browser" innerRadius={60} stroke="none" />
        <ChartLabel position="center" fontWeight={700} />
        <ChartLabel
          position="center"
          value="Visitors"
          dy={24}
          fontSize={12}
          fill="var(--muted-foreground)"
        />
      </ChartContainer>
    );
  if (mode === "spec-tooltip-keys")
    return (
      <ChartContainer
        id="spec-tooltip-keys"
        data={specChart("bar").data}
        config={tooltipKeysConfig}
      >
        <ChartXAxis dataKey="month" />
        <ChartBar dataKey="desktop" />
        <ChartBar dataKey="mobile" />
        <ChartTooltip content={<ChartTooltipContent nameKey="views" labelKey="activities" />} />
      </ChartContainer>
    );
  // shadcn radar-grid-custom and radar-dots: one ring at 90px, no spokes, a dot at every value.
  if (mode === "spec-radar-grid") {
    const { data, config } = specChart("radar");
    return (
      <ChartContainer id="spec-radar-grid" data={data} config={config}>
        <ChartPolarGrid
          radialLines={false}
          polarRadius={[90]}
          strokeWidth={2}
          fill="var(--color-desktop)"
          fillOpacity={0.2}
        />
        <ChartPolarAngleAxis dataKey="month" />
        <ChartRadar dataKey="desktop" dot activeDot={{ r: 6 }} />
      </ChartContainer>
    );
  }
  const kind = specKind(mode);
  const { module, data, config } = specChart(kind);
  if (mode === "spec-no-axis")
    return (
      <ChartContainer id="spec-no-axis" data={data} config={config}>
        <ChartGrid vertical={false} />
        <ChartBar dataKey="desktop" radius={4} />
        <ChartBar dataKey="mobile" radius={4} />
      </ChartContainer>
    );
  if (mode === "spec-empty")
    return <ChartContainer id="spec-empty-react" data={data} config={config} />;
  if (mode === "spec-combined")
    return (
      <ChartContainer id="spec-combined" chart={module} data={data} config={config}>
        <ChartBar dataKey="desktop" />
      </ChartContainer>
    );
  const id = `spec-${kind}`;
  if (mode.startsWith("spec-module-"))
    return (
      <ChartContainer id={id} chart={module} data={data} config={config}>
        {kind === "bar" && <ChartLegend />}
      </ChartContainer>
    );
  return (
    <ChartContainer id={id} data={data} config={config} aria-label={module.ariaLabel}>
      {kind === "bar" && (
        <>
          <ChartGrid vertical={false} />
          <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
          <ChartYAxis />
          <ChartBar dataKey="desktop" radius={4} />
          <ChartBar dataKey="mobile" radius={4} />
          <ChartLegend />
        </>
      )}
      {kind === "area" && (
        <>
          <ChartGrid vertical={false} />
          <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
          <ChartYAxis />
          <ChartArea dataKey="desktop" type="monotone" stackId="a" />
          <ChartArea dataKey="mobile" type="monotone" stackId="a" />
        </>
      )}
      {kind === "line" && (
        <>
          <ChartGrid vertical={false} />
          <ChartXAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
          <ChartLine dataKey="desktop" type="natural" />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        </>
      )}
      {kind === "donut" && (
        <>
          <ChartPie dataKey="desktop" nameKey="month" innerRadius="58.5%" />
          <ChartLabel position="center" />
        </>
      )}
      {kind === "radar" && (
        <>
          <ChartPolarGrid />
          <ChartPolarAngleAxis dataKey="month" tickFormatter={{ maxLength: 3 }} />
          <ChartRadar dataKey="desktop" />
          <ChartRadar dataKey="mobile" />
        </>
      )}
      {kind === "radial" && <ChartRadialBar dataKey="visitors" nameKey="browser" background />}
    </ChartContainer>
  );
}
