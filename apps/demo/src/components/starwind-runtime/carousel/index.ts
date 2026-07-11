import Carousel from "./Carousel.astro";
import CarouselContent from "./CarouselContent.astro";
import CarouselItem from "./CarouselItem.astro";
import CarouselNext from "./CarouselNext.astro";
import CarouselPrevious from "./CarouselPrevious.astro";
import {
  carousel,
  carouselContainer,
  carouselContent,
  carouselControl,
  carouselItem,
  carouselNext,
  carouselPrevious,
} from "./variants";

const CarouselVariants = {
  carousel,
  carouselContainer,
  carouselContent,
  carouselControl,
  carouselItem,
  carouselNext,
  carouselPrevious,
};

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselVariants,
};

export default {
  Root: Carousel,
  Content: CarouselContent,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
};
