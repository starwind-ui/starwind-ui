import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SelectList: import("svelte").Component<Props, {}, "">;
type SelectList = ReturnType<typeof SelectList>;
export default SelectList;
//# sourceMappingURL=SelectList.svelte.d.ts.map