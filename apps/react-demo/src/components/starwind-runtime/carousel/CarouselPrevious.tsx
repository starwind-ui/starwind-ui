import CarouselPrimitive from "@starwind-ui/react/carousel";
import { IconChevronLeft as ChevronLeft } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { carouselControl, carouselPrevious } from "./variants";

export type CarouselPreviousProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof carouselControl>;

function CarouselPrevious(props: CarouselPreviousProps) {
  const { variant = "outline", size = "icon", className, children, ...rest } = props;

  const controlClassName = carouselPrevious({ class: className });

  return (
    <CarouselPrimitive.Previous
      aria-label="Previous slide"
      className={carouselControl({ variant, size, class: controlClassName })}
      {...rest}
      data-slot="carousel-previous"
    >
      {children ?? (
        <>
          <ChevronLeft aria-hidden={true} />

          <span className="sr-only">Previous slide</span>
        </>
      )}
    </CarouselPrimitive.Previous>
  );
}

export default CarouselPrevious;
