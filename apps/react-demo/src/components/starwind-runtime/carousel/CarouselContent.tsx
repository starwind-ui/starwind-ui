import CarouselPrimitive from "@starwind-ui/react/carousel";
import type * as React from "react";
import { carouselContainer, carouselContent } from "./variants";

export type CarouselContentProps = React.ComponentPropsWithoutRef<"div">;

function CarouselContent(props: CarouselContentProps) {
  const { className, children, ...rest } = props;

  return (
    <CarouselPrimitive.Viewport
      className={carouselContent()}
      {...rest}
      data-slot="carousel-content"
    >
      <CarouselPrimitive.Container
        className={carouselContainer({ class: className })}
        data-slot="carousel-container"
      >
        {children}
      </CarouselPrimitive.Container>
    </CarouselPrimitive.Viewport>
  );
}

export default CarouselContent;
