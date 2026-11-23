import { useMemo, useState } from "react";

import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/starwind-runtime/chart";
import {
  type ChartGalleryEntry,
  type ChartGalleryFormat,
  type ChartGalleryTooltipRow,
  type ChartGalleryType,
  chartGallery,
  chartGalleryRows,
  chartGalleryTooltipClasses,
  chartGalleryTypes,
  trendingUpIcon,
} from "./chart-catalog";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/** The chart gallery for one type, laid out like shadcn's `/charts/<type>` page. */
export function ChartGallery({ type }: { type: ChartGalleryType }) {
  const entries = chartGallery[type];
  const label = chartGalleryTypes.find((item) => item.type === type)?.label ?? type;
  // shadcn fills a 12-slot grid and shows the empty slots as dashed boxes on wide screens.
  const slots = Array.from({ length: Math.max(12, entries.length) }, (_, index) => entries[index]);

  return (
    <div className="space-y-6" data-chart-gallery={type}>
      <nav className="flex flex-wrap items-center" aria-label="Chart types">
        {chartGalleryTypes.map((item) => (
          <a
            key={item.type}
            href={`/runtime-charts/${item.type}`}
            className="text-muted-foreground hover:text-primary data-[active=true]:text-primary flex h-7 shrink-0 items-center justify-center px-4 text-center text-base font-medium transition-colors"
            data-active={item.type === type ? "true" : "false"}
            aria-current={item.type === type ? "page" : undefined}
            data-chart-gallery-nav={item.type}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <h2 className="sr-only">{label}</h2>
      {entries.length === 0 && (
        <p className="text-muted-foreground text-sm" data-chart-gallery-empty>
          This view has no charts yet.
        </p>
      )}
      <div
        className="grid flex-1 scroll-mt-20 items-stretch gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10"
        data-chart-gallery-grid
      >
        {slots.map((entry, index) =>
          entry ? (
            <ChartGalleryCard key={entry.id} entry={entry} />
          ) : (
            <div
              key={`empty-${index}`}
              className="hidden aspect-square w-full rounded-lg border border-dashed xl:block"
            />
          ),
        )}
      </div>
    </div>
  );
}

/** A formatted tooltip row from the catalog, as React views. */
function TooltipRow({ row }: { row: ChartGalleryTooltipRow }) {
  const classes = chartGalleryTooltipClasses;
  const amount = (value: string) => (
    <div className={classes.value}>
      {value}
      <span className={classes.unit}>{row.unit}</span>
    </div>
  );
  if (row.kind === "unit") {
    return (
      <div className={classes.unitRow}>
        {row.name}
        {amount(row.value)}
      </div>
    );
  }
  return (
    <div className={classes.swatchRow}>
      <div className={classes.swatch} style={{ background: `var(--sw-chart-color-${row.key})` }} />
      {row.name}
      {amount(row.value)}
      {row.total !== undefined && (
        <div className={classes.total}>
          Total
          {amount(row.total)}
        </div>
      )}
    </div>
  );
}

/** shadcn's formatter props on a tooltip content, from the catalog format. */
function FormattedTooltip({ format }: { format: ChartGalleryFormat }) {
  const row = format.row;
  const label = format.label;
  return (
    <ChartTooltip
      content={
        <ChartTooltipContent
          formatter={
            row
              ? (value, name, item, index) => (
                  <TooltipRow row={row(value, name, item as never, index)} />
                )
              : undefined
          }
          labelFormatter={label ? (value) => label(value) : undefined}
        />
      }
    />
  );
}

/** One gallery card: the shadcn card look around a catalog chart. */
export function ChartGalleryCard({ entry }: { entry: ChartGalleryEntry }) {
  const control = entry.control;
  const [range, setRange] = useState(
    control?.kind === "range" || control?.kind === "active" ? control.initial : undefined,
  );
  const [series, setSeries] = useState(control?.kind === "series" ? control.initial : undefined);
  const data = useMemo(() => chartGalleryRows(entry, range), [entry, range]);
  const visible = useMemo(() => (series ? [series] : undefined), [series]);

  return (
    <div
      className={cx(
        "bg-card text-card-foreground flex min-w-0 flex-col gap-6 rounded-xl border shadow-sm",
        control?.kind === "range" ? "pb-6" : control?.kind === "series" ? "" : "py-6",
        entry.fullWidth && "md:col-span-2 lg:col-span-3",
      )}
      data-chart-gallery-card={entry.id}
    >
      {control?.kind === "range" ? (
        <div className="flex items-center gap-2 border-b px-6 py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <h3 className="leading-none font-semibold">{entry.title}</h3>
            <p className="text-muted-foreground text-sm">{entry.description}</p>
          </div>
          <select
            className="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 hidden h-9 w-[160px] rounded-lg border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:ml-auto sm:flex"
            aria-label={control.label}
            data-chart-gallery-range
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            {control.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : control?.kind === "series" ? (
        <div className="flex flex-col items-stretch border-b sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
            <h3 className="leading-none font-semibold">{entry.title}</h3>
            <p className="text-muted-foreground text-sm">{entry.description}</p>
          </div>
          <div className="flex">
            {control.options.map((option) => (
              <button
                key={option.key}
                type="button"
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                data-active={option.key === series ? "true" : "false"}
                aria-pressed={option.key === series}
                data-chart-gallery-series={option.key}
                onClick={() => setSeries(option.key)}
              >
                <span className="text-muted-foreground text-xs">{option.label}</span>
                <span className="text-lg leading-none font-bold sm:text-3xl">{option.total}</span>
              </button>
            ))}
          </div>
        </div>
      ) : control?.kind === "active" ? (
        <div className="flex items-start gap-2 px-6">
          <div className="grid gap-1">
            <h3 className="leading-none font-semibold">{entry.title}</h3>
            <p className="text-muted-foreground text-sm">{entry.description}</p>
          </div>
          <select
            className="border-input dark:bg-input/30 focus-visible:border-outline focus-visible:ring-outline/50 ml-auto h-7 w-[130px] rounded-lg border bg-transparent py-0 pr-2 pl-2.5 text-xs shadow-xs outline-none focus-visible:ring-[3px]"
            aria-label={control.label}
            data-chart-gallery-active
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            {control.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid gap-2 px-6">
          <h3 className="leading-none font-semibold">{entry.title}</h3>
          <p className="text-muted-foreground text-sm">{entry.description}</p>
        </div>
      )}

      <div
        className={cx(
          "px-6",
          control?.kind === "series" && "px-2 sm:p-6",
          !!entry.square && "flex flex-1 items-center",
        )}
      >
        <div
          className={cx(!!entry.square && "mx-auto w-full")}
          style={entry.square ? { maxWidth: entry.square } : undefined}
        >
          <ChartContainer
            id={entry.id}
            chart={entry.chart}
            config={entry.config}
            data={data}
            visible={visible}
            tooltip={entry.tooltip}
          >
            {entry.format && <FormattedTooltip format={entry.format} />}
            {entry.legend && <ChartLegend />}
          </ChartContainer>
        </div>
      </div>

      {entry.footer && (
        <div
          className={cx(
            "flex flex-col gap-2 px-6 text-sm",
            entry.square ? "items-center" : "items-start",
          )}
        >
          <div className="flex items-center gap-2 leading-none font-medium">
            {entry.footer.trend}
            <svg
              className="size-4"
              viewBox={trendingUpIcon.viewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {trendingUpIcon.paths.map((path) => (
                <path key={path} d={path} />
              ))}
            </svg>
          </div>
          <div className="text-muted-foreground leading-none">{entry.footer.detail}</div>
        </div>
      )}
    </div>
  );
}
