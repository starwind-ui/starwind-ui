import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    keepMounted?: boolean;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const CheckboxIndicator: import("svelte").Component<Props, {}, "">;
type CheckboxIndicator = ReturnType<typeof CheckboxIndicator>;
export default CheckboxIndicator;
//# sourceMappingURL=CheckboxIndicator.svelte.d.ts.map