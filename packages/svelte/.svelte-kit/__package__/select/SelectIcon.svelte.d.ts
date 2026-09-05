import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const SelectIcon: import("svelte").Component<Props, {}, "">;
type SelectIcon = ReturnType<typeof SelectIcon>;
export default SelectIcon;
//# sourceMappingURL=SelectIcon.svelte.d.ts.map