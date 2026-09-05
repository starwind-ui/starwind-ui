import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectScrollDownArrow: import("svelte").Component<Props, {}, "">;
type SelectScrollDownArrow = ReturnType<typeof SelectScrollDownArrow>;
export default SelectScrollDownArrow;
//# sourceMappingURL=SelectScrollDownArrow.svelte.d.ts.map