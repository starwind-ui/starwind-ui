import { reactMenuOperations } from "../../framework-adapters/react/recipe-menu-operations.js";
import { svelteMenuOperations } from "../../framework-adapters/svelte/recipe-menu-operations.js";
import { vueMenuOperations } from "../../framework-adapters/vue/recipe-menu-operations.js";
import type { FrameworkOperations, Target } from "./operations.js";
export interface MenuOperations {
  fw: FrameworkOperations;
  input(name: string): string;
  owner: string;
  root: string;
  capture:
    | { mode: "ready" }
    | {
        mode: "deferred-portal";
        captureReady(required: readonly string[], submenuRequired: readonly string[]): string;
        restoreAuthoredAttributes: string;
        prepareModels: string;
        acceptModels: string;
        afterPlacement(body: string): string;
      };
  acceptedOpen: string;
  portal: string;
  render(value: string): string;
  proposal(value: string, details: string): string;
  completion(details: string): string;
  own(instance: string): string;
  subscribe(instance: string, event: string, body: string): string;
  unsubscribe: string;
}
export const menuOperations: Record<Target, MenuOperations> = {
  react: reactMenuOperations,
  vue: vueMenuOperations,
  svelte: svelteMenuOperations,
};
