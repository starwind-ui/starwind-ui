import { simpleRecipeOperations as react } from "../../framework-adapters/react/simple-recipe.js";
import { simpleRecipeOperations as svelte } from "../../framework-adapters/svelte/simple-recipe.js";
import { simpleRecipeOperations as vue } from "../../framework-adapters/vue/simple-recipe.js";
import type { CommandRecipe, Target } from "./recipe.js";

type Prop = CommandRecipe["props"][number];
export interface CommandOperations {
  owner: string;
  initialValue(name: string, expression: string): string;
  readInput(prop: Prop): string;
  fieldName(prop: Prop): string;
  attribute(name: string, expression: string): string;
  declareOwner(factory: string): string;
  lifecycle(input: {
    recipe: CommandRecipe;
    declaration: string;
    dispose: string;
    create: string;
    condition?: string;
    commands: { reads: string[]; body: string }[];
  }): string;
  frame(input: {
    kind: string;
    recipe: CommandRecipe;
    name: string;
    imports: string;
    fields: string;
    destructure: string;
    attrs: string;
    code: string;
  }): string;
}
export const operations: Record<Target, CommandOperations> = { react, vue, svelte };
