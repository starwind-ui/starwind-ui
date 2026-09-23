import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
} from "../../../styled-output-model/index.js";
import { specializeSvelteStyledMenu } from "./dropdown.js";
import type { SvelteStyledRenderOptions } from "./types.js";

export function specializeSvelteStyledContextMenu(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: SvelteStyledRenderOptions,
) {
  return specializeSvelteStyledMenu(group, component, options, {
    primitive: "context-menu",
    primitiveName: "ContextMenu",
    styledName: "ContextMenu",
    buttonChild: false,
  });
}
