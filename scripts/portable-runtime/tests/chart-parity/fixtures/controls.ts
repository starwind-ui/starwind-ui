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
  /** spec-live: changes the bar radius prop. */
  setRadius?: (radius: number) => void;
  /** spec-live: removes or restores the mobile bar part. */
  toggleMobile?: () => void;
  /** spec-live: switches the y axis formatter between dollars and euros. */
  toggleCurrency?: () => void;
  /** spec-nested: edits the label formatter prefix and the first gradient stop color in place. */
  editNested?: () => void;
  /** spec-options: switches the ChartTooltip cursor between false and true. */
  toggleCursor?: () => void;
  /** spec-cursor-order: sets the cursor of the first and the second ChartTooltip. */
  setCursors?: (first: boolean | undefined, second: boolean | undefined) => void;
}
