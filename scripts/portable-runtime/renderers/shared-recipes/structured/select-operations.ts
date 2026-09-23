import { reactSelectOperations } from "../../framework-adapters/react/recipe-select-operations.js";
import { svelteSelectOperations } from "../../framework-adapters/svelte/recipe-select-operations.js";
import { vueSelectOperations } from "../../framework-adapters/vue/recipe-select-operations.js";
import type { FrameworkOperations, Target } from "./operations.js";
export type SelectChannel = { name: "open" | "value" | "inputValue"; callback: string };
export interface SelectResetOperations {
  timer: string;
  revision: string;
  generation?: string;
  isCurrent: string;
  initialValue: string;
  runtime: { read: string; availability: "lazy" | "connected" };
  nativeControl?: { value: string; needsRender: string };
  label(value: string): string;
}
export interface SelectOperations {
  fw: FrameworkOperations;
  input(name: string): string;
  accepted(channel: SelectChannel): string;
  render(channel: SelectChannel, value: string): string;
  initial(channel: SelectChannel): string;
  callback(channel: SelectChannel): string;
  owner: string;
  root: string;
  portal: string;
  publish(channel: SelectChannel, value: string): string;
  label(value: string, item?: string): string;
  observe(inputs: readonly string[], body: string): string;
  bindReset: string;
  reset: SelectResetOperations;
  attribute(name: string, expression: string): string;
}
export const selectOperations: Record<Target, SelectOperations> = {
  react: reactSelectOperations,
  vue: vueSelectOperations,
  svelte: svelteSelectOperations,
};
