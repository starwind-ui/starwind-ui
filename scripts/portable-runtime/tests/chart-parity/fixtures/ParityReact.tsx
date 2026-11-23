// React form of every chart parity case. The other three fixtures render the same cases.
import ChartPrimitive, { useChartRoot, useChartTooltipBody } from "@starwind-ui/react/chart";
import { useState } from "react";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../../../../../apps/react-demo/src/components/starwind-runtime/chart";
import {
  PARITY_ID,
  type ParityCase,
  type VisitorRow,
  baseConfig,
  moduleFor,
  orderLog,
  parityData,
  parityDefinition,
} from "./modules";
import type { ParityControls } from "./controls";

function MobileIcon() {
  return (
    <svg data-component-icon="" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h10v20H7z" />
    </svg>
  );
}

/**
 * Reports the useChartTooltipBody shape (the body inside an open body, null elsewhere) and the
 * field names of the public useChartRoot state.
 */
function HookProbe({ place }: { place: string }) {
  const body = useChartTooltipBody();
  const fields = Object.keys(useChartRoot()).sort().join(",");
  const shape = body === null ? "null" : Array.isArray(body.points) ? "body" : "other";
  return <span data-hook={place} data-shape={shape} data-root-fields={fields} />;
}

function parityConfig(mode: string): ChartConfig {
  const base = baseConfig(mode);
  return {
    ...base,
    desktop: {
      ...base.desktop,
      label: (
        <strong data-rich-label="">
          Desktop <small>web</small>
        </strong>
      ),
      text: "Desktop",
    },
    mobile: { ...base.mobile, ...(mode === "default" ? { icon: MobileIcon } : {}) },
  } as ChartConfig;
}

const formatted = (
  <ChartTooltipContent<VisitorRow>
    indicator="dashed"
    labelFormatter={(label, items) => (
      <em data-label-formatter="">{`${String(label)} · ${items.length} series`}</em>
    )}
    formatter={(value, name, item, index, payload) => (
      <span
        data-formatter=""
        data-number={typeof value}
        data-index={index}
        data-same={String(item.payload === payload && item.point?.datum === payload)}
      >{`${name}: ${String(value)} visits`}</span>
    )}
  />
);

export default function ParityReact({
  mode,
  controls = {},
}: {
  mode: ParityCase;
  controls?: ParityControls;
}) {
  const [selected, setSelected] = useState<string[]>(["desktop", "mobile"]);
  const [changes, setChanges] = useState(0);
  const [showLegend, setShowLegend] = useState(true);
  const [showFirst, setShowFirst] = useState(true);
  const [showSecond, setShowSecond] = useState(true);
  const [tick, setTick] = useState(0);
  const [count, setCount] = useState(0);
  controls.command = () => setSelected(["desktop", "mobile"]);
  controls.toggleLegend = () => setShowLegend((value) => !value);
  controls.removeFirst = () => setShowFirst(false);
  controls.removeSecond = () => setShowSecond(false);
  controls.rerender = () => setTick((value) => value + 1);
  controls.bump = () => setCount((value) => value + 1);

  const config = parityConfig(mode);
  const common = { id: PARITY_ID, chart: moduleFor(mode), data: parityData, config };

  switch (mode) {
    case "definition":
      return (
        <ChartContainer id={PARITY_ID} definition={parityDefinition} config={config}>
          <ChartLegend />
        </ChartContainer>
      );
    case "primitive":
    case "cancel":
      return (
        <ChartPrimitive.Root {...common}>
          <ChartPrimitive.Style />
          <ChartPrimitive.Surface />
          <ChartPrimitive.Legend>
            <ChartPrimitive.LegendItem
              value="desktop"
              onClick={mode === "cancel" ? (event) => event.preventDefault() : undefined}
            >
              Desktop
            </ChartPrimitive.LegendItem>
            <ChartPrimitive.LegendItem value="mobile">Mobile</ChartPrimitive.LegendItem>
          </ChartPrimitive.Legend>
        </ChartPrimitive.Root>
      );
    case "off":
      return <ChartContainer {...common} tooltip={false} />;
    case "native":
    case "native-format":
      return (
        <ChartContainer {...common} tooltip="native">
          <ChartLegend />
        </ChartContainer>
      );
    case "custom":
      return (
        <ChartContainer {...common}>
          <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
          <ChartLegend content={<ChartLegendContent data-replacement="" />} />
        </ChartContainer>
      );
    case "formatter":
      return (
        <ChartContainer {...common}>
          <ChartTooltip content={formatted} />
          <ChartLegend />
        </ChartContainer>
      );
    case "model":
      return (
        <>
          <ChartContainer
            {...common}
            visible={selected}
            onVisibleChange={(next) => {
              setChanges((value) => value + 1);
              // The parent accepts only "mobile" alone and refuses every other change.
              if (next.length === 1) setSelected(["mobile"]);
            }}
          >
            <ChartLegend />
          </ChartContainer>
          <output data-accepted="">{selected.join(",")}</output>
          <output data-changes="">{changes}</output>
        </>
      );
    case "parts":
      return (
        <ChartContainer {...common}>
          <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
          <ChartLegend hideIcon />
        </ChartContainer>
      );
    case "parts-nested":
      return (
        <ChartContainer {...common}>
          <div data-wrapper="">
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
          </div>
          {showLegend ? (
            <div data-wrapper="">
              <ChartLegend hideIcon />
            </div>
          ) : null}
        </ChartContainer>
      );
    case "plain-body":
      return <ChartContainer {...common} tooltip={<span className="plain-body">plain</span>} />;
    case "mixed-body":
      return (
        <ChartContainer {...common}>
          <ChartTooltip
            content={
              <>
                <p className="mixed-heading">Heading</p>
                <ChartTooltipContent className="mixed-content" />
              </>
            }
          />
        </ChartContainer>
      );
    case "nested-tooltip":
      return (
        <ChartContainer
          {...common}
          tooltip={
            <div className="outer">
              <ChartTooltip content={<span className="inner">inner</span>} />
            </div>
          }
        />
      );
    case "order":
      return (
        <ChartContainer {...common}>
          <span data-tick="">{tick}</span>
          {showFirst ? <ChartTooltip content={<ChartTooltipContent className="first" />} /> : null}
          {showSecond ? (
            <ChartTooltip content={<ChartTooltipContent className="second" />} />
          ) : null}
        </ChartContainer>
      );
    case "ids":
      return (
        <>
          <ChartContainer chart={moduleFor(mode)} data={parityData} config={config}>
            <ChartLegend />
          </ChartContainer>
          <ChartContainer chart={moduleFor(mode)} data={parityData} config={config}>
            <ChartLegend />
          </ChartContainer>
        </>
      );
    case "one-way":
      return (
        <ChartContainer {...common} visible={["desktop", "mobile"]}>
          <ChartLegend />
        </ChartContainer>
      );
    case "live-body":
      return (
        <ChartContainer
          {...common}
          tooltip={<span className="live-body">{`count ${count}`}</span>}
        />
      );
    case "precedence":
      return (
        <ChartContainer {...common} tooltip={<span className="container-body">container</span>}>
          <ChartTooltip content={<span className="child-body">child</span>} />
        </ChartContainer>
      );
    case "off-child":
      return (
        <ChartContainer {...common} tooltip={false}>
          <ChartTooltip content={<span className="child-body">child</span>} />
        </ChartContainer>
      );
    case "options":
      return (
        <ChartContainer {...common}>
          <ChartTooltip content={<ChartTooltipContent label="desktop" color="rgb(255, 0, 0)" />} />
        </ChartContainer>
      );
    case "keys":
      return (
        <ChartContainer {...common}>
          <ChartTooltip
            content={<ChartTooltipContent labelKey="id" nameKey="series" valueKey="value" />}
          />
        </ChartContainer>
      );
    case "callback-order":
      return (
        <ChartContainer
          {...common}
          onVisibleChange={(next, details) =>
            orderLog().push(
              `callback ${next.join(",")} ${details.isCanceled ? "canceled" : "open"}`,
            )
          }
        >
          <ChartLegend />
        </ChartContainer>
      );
    case "hook":
      return (
        <ChartContainer {...common} tooltip={<HookProbe place="body" />}>
          <HookProbe place="outside" />
        </ChartContainer>
      );
    case "legends":
      return (
        <ChartContainer {...common}>
          <section data-wrapper="">
            <ChartLegend />
          </section>
          <ChartLegend hideIcon />
        </ChartContainer>
      );
    default:
      // default, indicator and preset differ only in config and module.
      return (
        <ChartContainer {...common}>
          <ChartLegend />
        </ChartContainer>
      );
  }
}
