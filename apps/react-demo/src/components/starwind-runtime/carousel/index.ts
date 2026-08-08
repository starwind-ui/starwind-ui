"use client";

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
