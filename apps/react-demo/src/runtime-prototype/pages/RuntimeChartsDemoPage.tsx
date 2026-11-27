import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/starwind-runtime/chart";
import { ChartPartsExamples } from "../charts/ChartPartsExamples";
import {
  areaChart,
  barChart,
  donutChart,
  monthConfig,
  radarChart,
  visitorConfig,
  visitorData,
} from "../charts/chart-recipes";

const card =
  "bg-card text-card-foreground flex min-w-0 flex-col gap-4 rounded-xl border p-6 shadow-sm";

export function RuntimeChartsDemoPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10 space-y-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Runtime component review
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Charts</h1>
        <p className="text-muted-foreground max-w-3xl">
          Review the bar, area, donut and radar examples in light and dark mode. Move the pointer
          over a chart or focus it and use the arrow keys to see the tooltip. Click a legend item to
          hide or show its series.
        </p>
        <a className="text-sm font-medium underline underline-offset-4" href="/runtime-charts/area">
          Open the chart gallery
        </a>
      </header>

      <div className="grid gap-6 md:grid-cols-2" data-testid="chart-examples">
        <section className={card} data-chart-example="bar" aria-labelledby="chart-bar-heading">
          <div className="space-y-1">
            <h2 id="chart-bar-heading" className="text-lg font-semibold">
              Bar chart
            </h2>
            <p className="text-muted-foreground text-sm">
              Desktop and mobile visitors from January to June, with the default dot tooltip.
            </p>
          </div>
          <ChartContainer
            id="chart-visitors-bar"
            chart={barChart}
            config={visitorConfig}
            data={visitorData}
          >
            <ChartLegend />
          </ChartContainer>
        </section>

        <section className={card} data-chart-example="area" aria-labelledby="chart-area-heading">
          <div className="space-y-1">
            <h2 id="chart-area-heading" className="text-lg font-semibold">
              Area chart
            </h2>
            <p className="text-muted-foreground text-sm">
              Stacked visitors with a line indicator from a ChartTooltip.
            </p>
          </div>
          <ChartContainer
            id="chart-visitors-area"
            chart={areaChart}
            config={visitorConfig}
            data={visitorData}
          >
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend />
          </ChartContainer>
        </section>

        <section className={card} data-chart-example="donut" aria-labelledby="chart-donut-heading">
          <div className="space-y-1">
            <h2 id="chart-donut-heading" className="text-lg font-semibold">
              Donut chart
            </h2>
            <p className="text-muted-foreground text-sm">
              Desktop visitors by month. This chart has no id, so the component makes one.
            </p>
          </div>
          <ChartContainer chart={donutChart} config={monthConfig} data={visitorData}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend />
          </ChartContainer>
        </section>

        <section className={card} data-chart-example="radar" aria-labelledby="chart-radar-heading">
          <div className="space-y-1">
            <h2 id="chart-radar-heading" className="text-lg font-semibold">
              Radar chart
            </h2>
            <p className="text-muted-foreground text-sm">
              Desktop and mobile visitors on one polar grid. Use the legend to hide a series.
            </p>
          </div>
          <ChartContainer
            id="chart-visitors-radar"
            chart={radarChart}
            config={visitorConfig}
            data={visitorData}
          >
            <ChartLegend />
          </ChartContainer>
        </section>
      </div>

      <header className="mt-16 mb-10 space-y-3">
        <h2 className="font-heading text-3xl font-semibold tracking-tight">Charts from parts</h2>
        <p className="text-muted-foreground max-w-3xl">
          The six docs charts built from chart parts, with no chart module.
        </p>
      </header>
      <ChartPartsExamples />
    </main>
  );
}
