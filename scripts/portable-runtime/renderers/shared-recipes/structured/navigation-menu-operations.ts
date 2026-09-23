import { reactNavigationMenuOperations } from "../../framework-adapters/react/recipe-navigation-menu-operations.js";
import { svelteNavigationMenuOperations } from "../../framework-adapters/svelte/recipe-navigation-menu-operations.js";
import { vueNavigationMenuOperations } from "../../framework-adapters/vue/recipe-navigation-menu-operations.js";
import type { FrameworkOperations, Target } from "./operations.js";
export interface NavigationMenuOperations {
  fw: FrameworkOperations;
  capture:
    | { mode: "ready" }
    | {
        mode: "deferred-portal";
        readParts: string;
        disconnected: string;
        restoreAuthored: string;
        afterPlacement(body: string): string;
        current: string;
        currentOptions: string;
        currentParts: string;
        desiredOptions: string;
        markInitialized: string;
      };
  input(name: string): string;
  owner: string;
  accepted: string;
  root: string;
  render(value: string): string;
  publish(value: string): string;
  proposal(value: string, details: string): string;
  request?: {
    read: string;
    assign(details: string): string;
    clear: string;
  } & (
    | { at: "proposal"; afterProposal(body: string): string }
    | { at: "accepted"; awaitCommit: string }
  );
  observeAccepted(body: string): string;
  own(instance: string): string;
  subscribe(instance: string, event: string, body: string): string;
  unsubscribe: string;
  clearOwner: string;
  restoreMovedContent: string;
}
export const navigationMenuOperations: Record<Target, NavigationMenuOperations> = {
  react: reactNavigationMenuOperations,
  vue: vueNavigationMenuOperations,
  svelte: svelteNavigationMenuOperations,
};
