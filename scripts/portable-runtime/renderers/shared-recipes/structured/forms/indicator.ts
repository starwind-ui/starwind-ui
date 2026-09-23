/** Visibility policy shared by Checkbox Indicator projections. */
export type IndicatorTransport =
  | { visibility: "context"; restoreAuthoredHidden: boolean }
  | { visibility: "runtime"; restoreAuthoredHidden: false };
type ContextInputs = {
  checked: string;
  indeterminate: string;
  keepMounted: string;
  hidden: string;
};
type ContextVisibility = { active: string; mounted: string; unmounted: string; hidden: string };
export function checkboxIndicatorPolicy(
  transport: Extract<IndicatorTransport, { visibility: "context" }>,
  inputs: ContextInputs,
): ContextVisibility;
export function checkboxIndicatorPolicy(
  transport: Extract<IndicatorTransport, { visibility: "runtime" }>,
  inputs: { keepMounted: string },
): { initialHidden: string };
export function checkboxIndicatorPolicy(
  transport: IndicatorTransport,
  inputs: ContextInputs | { keepMounted: string },
) {
  if (transport.visibility === "runtime") return { initialHidden: `!${inputs.keepMounted}` };
  const context = inputs as ContextInputs;
  return {
    active: `${context.checked} || ${context.indeterminate}`,
    mounted: `${context.keepMounted} || active`,
    unmounted: `!${context.keepMounted} && !active`,
    hidden: `${context.hidden} ?? false`,
  };
}
