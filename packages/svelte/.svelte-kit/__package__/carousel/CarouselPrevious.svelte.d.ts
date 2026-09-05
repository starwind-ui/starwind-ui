import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const CarouselPrevious: import("svelte").Component<Props, {}, "">;
type CarouselPrevious = ReturnType<typeof CarouselPrevious>;
export default CarouselPrevious;
//# sourceMappingURL=CarouselPrevious.svelte.d.ts.map