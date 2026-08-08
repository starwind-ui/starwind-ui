import Carousel from "./Carousel.vue";
import CarouselContent from "./CarouselContent.vue";
import CarouselItem from "./CarouselItem.vue";
import CarouselNext from "./CarouselNext.vue";
import CarouselPrevious from "./CarouselPrevious.vue";
import {
  carousel,
  carouselContainer,
  carouselContent,
  carouselControl,
  carouselItem,
  carouselNext,
  carouselPrevious,
} from "./variants";

export type { CarouselProps } from "./Carousel.vue";
export type { CarouselContentProps } from "./CarouselContent.vue";
export type { CarouselItemProps } from "./CarouselItem.vue";
export type { CarouselNextProps } from "./CarouselNext.vue";
export type { CarouselPreviousProps } from "./CarouselPrevious.vue";

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
