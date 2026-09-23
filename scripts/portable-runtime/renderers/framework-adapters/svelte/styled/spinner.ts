import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { specializeSvelteStyledNative } from "./native.js";
import { supportsSvelteScope } from "./scope.js";

/** The projected SVG asset remains Spinner's native owner. */
export function specializeSvelteStyledSpinner(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
) {
  for (const entry of component.imports.filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  )) {
    if (!entry.svg)
      throw new TypeError(
        `Svelte Styled spinner/${component.exportName}.svelte: unsupported SVG import "${entry.source}".`,
      );
  }
  component.imports = [];
  return specializeSvelteStyledNative(group, component);
}
