/**
 * Parent actions that a fixture hands to the test. Calling one changes the fixture's own state, so
 * the focus stays on the chart and an open tooltip stays open.
 */
export interface ParityControls {
  /** model: the parent sets every series visible. */
  command?: () => void;
  /** parts-nested: removes or restores the wrapped ChartLegend. */
  toggleLegend?: () => void;
  /** order: removes the first ChartTooltip. */
  removeFirst?: () => void;
  /** order: removes the second ChartTooltip. */
  removeSecond?: () => void;
  /** order: re-renders the parent without changing the tooltips. */
  rerender?: () => void;
  /** live-body: changes the tooltip body text. */
  bump?: () => void;
}
