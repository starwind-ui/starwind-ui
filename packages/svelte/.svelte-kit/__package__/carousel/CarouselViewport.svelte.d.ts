import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const CarouselViewport: import("svelte").Component<Props, {}, "">;
type CarouselViewport = ReturnType<typeof CarouselViewport>;
export default CarouselViewport;
//# sourceMappingURL=CarouselViewport.svelte.d.ts.map