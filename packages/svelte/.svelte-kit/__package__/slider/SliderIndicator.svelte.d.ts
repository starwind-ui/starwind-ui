import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SliderIndicator: import("svelte").Component<Props, {}, "">;
type SliderIndicator = ReturnType<typeof SliderIndicator>;
export default SliderIndicator;
//# sourceMappingURL=SliderIndicator.svelte.d.ts.map