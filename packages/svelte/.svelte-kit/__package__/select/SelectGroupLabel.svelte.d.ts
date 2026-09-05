import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectGroupLabel: import("svelte").Component<Props, {}, "">;
type SelectGroupLabel = ReturnType<typeof SelectGroupLabel>;
export default SelectGroupLabel;
//# sourceMappingURL=SelectGroupLabel.svelte.d.ts.map