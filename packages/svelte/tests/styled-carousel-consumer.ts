import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledCarouselConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["carousel", "button"]);

export const carouselPositive = `<script lang="ts">
import Parts, { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselVariants, type CarouselProps, type CarouselContentProps, type CarouselItemProps, type CarouselPreviousProps, type CarouselNextProps } from "./carousel/index.js";
import type { CarouselInstance, CarouselOptions } from "@starwind-ui/svelte/carousel";
import { createAttachmentKey, type Attachment } from "svelte/attachments";
const ref = (node: HTMLDivElement | null) => { void node; };
const controlRef = (node: HTMLButtonElement | null) => { void node; };
const attachment: Attachment<HTMLDivElement> = (node) => { void node.style; return () => {}; };
const attrs = { [createAttachmentKey()]: attachment };
const opts: CarouselOptions["opts"] = { align: "start", loop: true };
const plugins: CarouselOptions["plugins"] = [{ name: "consumer", options: {}, init(api) { const current: CarouselInstance["api"] = api; void current; }, destroy() {} }];
const root: CarouselProps = { orientation: "vertical", opts, plugins, setApi(api) { const next: CarouselInstance["api"] = api; next.scrollNext(); }, ref, class: ["caller", { active: true }] };
const content: CarouselContentProps = { ref, class: "h-60" };
const item: CarouselItemProps = { ref };
const previous: CarouselPreviousProps = { variant: "outline", size: "icon", ref: controlRef };
const next: CarouselNextProps = { variant: "primary", size: "sm", ref: controlRef };
void CarouselVariants.carouselControl({ variant: "secondary", size: "lg" });
</script>
<Carousel {...root} {...attrs}><CarouselContent {...content}><CarouselItem {...item}><strong>Custom slide</strong></CarouselItem></CarouselContent><CarouselPrevious {...previous} /><CarouselNext {...next} onclick={(event) => { const button: HTMLButtonElement = event.currentTarget; void button; }} /></Carousel>
<Parts.Root><Parts.Content><Parts.Item>Namespace</Parts.Item></Parts.Content><Parts.Previous /><Parts.Next>Next</Parts.Next></Parts.Root>`;
