import Carousel from "./Carousel.svelte";
import CarouselContent from "./CarouselContent.svelte";
import CarouselItem from "./CarouselItem.svelte";
import CarouselPrevious from "./CarouselPrevious.svelte";
import CarouselNext from "./CarouselNext.svelte";
import {
  carousel,
  carouselContainer,
  carouselContent,
  carouselControl,
  carouselItem,
  carouselNext,
  carouselPrevious,
} from "./variants.js";
export type { CarouselProps } from "./Carousel.svelte";
export type { CarouselContentProps } from "./CarouselContent.svelte";
export type { CarouselItemProps } from "./CarouselItem.svelte";
export type { CarouselPreviousProps } from "./CarouselPrevious.svelte";
export type { CarouselNextProps } from "./CarouselNext.svelte";
const CarouselVariants = {
  carousel,
  carouselContainer,
  carouselContent,
  carouselControl,
  carouselItem,
  carouselNext,
  carouselPrevious,
};
const CarouselParts = {
  Root: Carousel,
  Content: CarouselContent,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
};
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselVariants,
};
export default CarouselParts;
