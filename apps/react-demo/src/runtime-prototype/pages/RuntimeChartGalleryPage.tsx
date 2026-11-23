import { ChartGallery } from "../charts/ChartGallery";
import { type ChartGalleryType, isChartGalleryType } from "../charts/chart-catalog";

export function RuntimeChartGalleryPage({ type }: { type: string }) {
  const view: ChartGalleryType = isChartGalleryType(type) ? type : "area";

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <header className="mb-8 space-y-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Runtime chart gallery
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Charts</h1>
        <p className="text-muted-foreground max-w-3xl">
          Compare each chart with the same chart on the shadcn charts page. Check light and dark
          mode, and move the pointer over each chart to see its tooltip.
        </p>
        <a className="text-sm font-medium underline underline-offset-4" href="/runtime-charts">
          Back to the chart examples
        </a>
      </header>
      <ChartGallery type={view} />
    </main>
  );
}
