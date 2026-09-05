import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectLabel: import("svelte").Component<Props, {}, "">;
type SelectLabel = ReturnType<typeof SelectLabel>;
export default SelectLabel;
//# sourceMappingURL=SelectLabel.svelte.d.ts.map