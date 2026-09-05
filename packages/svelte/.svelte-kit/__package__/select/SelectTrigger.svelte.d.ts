import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children" | "disabled" | "type"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const SelectTrigger: import("svelte").Component<Props, {}, "">;
type SelectTrigger = ReturnType<typeof SelectTrigger>;
export default SelectTrigger;
//# sourceMappingURL=SelectTrigger.svelte.d.ts.map