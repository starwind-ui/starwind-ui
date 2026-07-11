import Carousel from "./Carousel";
import CarouselContent from "./CarouselContent";
import CarouselItem from "./CarouselItem";
import CarouselNext from "./CarouselNext";
import CarouselPrevious from "./CarouselPrevious";
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
