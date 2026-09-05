import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const CarouselContainer: import("svelte").Component<Props, {}, "">;
type CarouselContainer = ReturnType<typeof CarouselContainer>;
export default CarouselContainer;
//# sourceMappingURL=CarouselContainer.svelte.d.ts.map