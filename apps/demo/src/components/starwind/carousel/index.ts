import Carousel from "./Carousel.astro";
import {
  type CarouselApi,
  type CarouselManager,
  type CarouselOptions,
  initCarousel,
} from "./carousel-script";
import CarouselContent from "./CarouselContent.astro";
import CarouselItem from "./CarouselItem.astro";
import CarouselNext from "./CarouselNext.astro";
import CarouselPrevious from "./CarouselPrevious.astro";

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  type CarouselManager,
  CarouselNext,
  type CarouselOptions,
  CarouselPrevious,
  initCarousel,
};

export default {
  Root: Carousel,
  Content: CarouselContent,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
  init: initCarousel,
};
