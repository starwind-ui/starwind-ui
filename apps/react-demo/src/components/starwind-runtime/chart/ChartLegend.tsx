import type * as React from "react";
import ChartLegendContent from "./ChartLegendContent";

export type ChartLegendProps = React.ComponentProps<typeof ChartLegendContent> & {
  content?: React.ReactNode;
};

function ChartLegend(props: ChartLegendProps) {
  const { content, ...rest } = props;

  return <>{content ?? <ChartLegendContent {...rest} />}</>;
}

export default ChartLegend;
