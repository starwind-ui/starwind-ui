import type { SidebarFacts, SidebarRecipe } from "./recipe.js";
export interface SidebarProjection {
  read(name: string): string;
  initial(expression: string): string;
  state(name: string, initial: string): string;
  readState(name: string): string;
  writeState(name: string, value: string): string;
  attribute(name: string, expression: string): string;
  print(input: SidebarInput): string;
}
export type SidebarInput = {
  facts: SidebarFacts;
  plan: SidebarRecipe;
  props: { name: string; type: string; defaultValue?: string }[];
  fields: string;
  callbacks: string;
  initial: string;
  cells: string;
  controller: string;
  lifecycle: string;
  media: string;
  context: Record<string, string>;
  attributes: string;
};
