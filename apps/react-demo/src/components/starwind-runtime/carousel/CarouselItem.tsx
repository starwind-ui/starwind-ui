import CarouselPrimitive from "@starwind-ui/react/carousel";
import type * as React from "react";
import { carouselItem } from "./variants";

export type CarouselItemProps = React.ComponentPropsWithoutRef<"div">;

function CarouselItem(props: CarouselItemProps) {
  const { className, children, ...rest } = props;

  return (
    <CarouselPrimitive.Item
      className={carouselItem({ class: className })}
      {...rest}
      data-slot="carousel-item"
    >
      {children}
    </CarouselPrimitive.Item>
  );
}

export default CarouselItem;
