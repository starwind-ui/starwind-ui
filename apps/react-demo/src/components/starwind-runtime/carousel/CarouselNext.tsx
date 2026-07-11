import CarouselPrimitive from "@starwind-ui/react/carousel";
import { IconChevronRight as ChevronRight } from "@tabler/icons-react";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { carouselControl, carouselNext } from "./variants";

export type CarouselNextProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof carouselControl>;

function CarouselNext(props: CarouselNextProps) {
  const { variant = "outline", size = "icon", className, children, ...rest } = props;

  const controlClassName = carouselNext({ class: className });

  return (
    <CarouselPrimitive.Next
      aria-label="Next slide"
      className={carouselControl({ variant, size, class: controlClassName })}
      {...rest}
      data-slot="carousel-next"
    >
      {children ?? (
        <>
          <ChevronRight aria-hidden={true} />

          <span className="sr-only">Next slide</span>
        </>
      )}
    </CarouselPrimitive.Next>
  );
}

export default CarouselNext;
