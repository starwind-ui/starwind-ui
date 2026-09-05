import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SliderTrack: import("svelte").Component<Props, {}, "">;
type SliderTrack = ReturnType<typeof SliderTrack>;
export default SliderTrack;
//# sourceMappingURL=SliderTrack.svelte.d.ts.map