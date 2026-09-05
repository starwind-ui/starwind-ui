import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const SliderLabel: import("svelte").Component<Props, {}, "">;
type SliderLabel = ReturnType<typeof SliderLabel>;
export default SliderLabel;
//# sourceMappingURL=SliderLabel.svelte.d.ts.map