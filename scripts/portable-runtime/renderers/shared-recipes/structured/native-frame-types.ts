import type { NativeRecipe, NativeSurfaceOperation } from "./native.js";
export type NativeProp = { name: string; type: string; defaultValue?: string };
export type NativeRootProjectionInput = {
  component: NativeRecipe["component"];
  plan: NativeRecipe;
  portal: boolean;
  popup: string;
  props: NativeProp[];
  fields: string;
  destructure: string;
  callbacks: string;
  imports: string;
  initial: string;
  accepted: string;
  controller: string;
  refresh: string;
  lifecycle: string;
  attributes: string;
  modelObserver: string;
  surfaceConnection: string;
};
/** Target source operations. Runtime decisions arrive as emitted shared fragments and typed recipe facts. */
export interface NativeRootProjection {
  /** Empty activation means the target portal hook/attachment has already activated placement. */
  surfaceOperations: Record<NativeSurfaceOperation, string>;
  readProp(name: string): string;
  initialCell(expression: string): string;
  attribute(name: string, value?: string): string;
  destructure(props: NativeProp[]): string;
  runtimeImports(component: NativeRecipe["component"], portal: boolean): string;
  printRoot(input: NativeRootProjectionInput): string;
}
