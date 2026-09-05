import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children" | "disabled" | "type"> & {
    children?: Snippet;
    disabled?: boolean;
    focusableWhenDisabled?: boolean;
    type?: HTMLButtonAttributes["type"];
};
declare const ButtonRoot: import("svelte").Component<Props, {}, "">;
type ButtonRoot = ReturnType<typeof ButtonRoot>;
export default ButtonRoot;
//# sourceMappingURL=ButtonRoot.svelte.d.ts.map