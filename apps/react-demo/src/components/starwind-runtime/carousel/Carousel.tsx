import CarouselPrimitive from "@starwind-ui/react/carousel";
import type * as React from "react";
import { carousel } from "./variants";

export type CarouselProps = React.ComponentPropsWithoutRef<"div"> & {
  orientation?: "horizontal" | "vertical";
  opts?: import("@starwind-ui/react/carousel").CarouselOptions["opts"];
  plugins?: import("@starwind-ui/react/carousel").CarouselOptions["plugins"];
  setApi?: (api: import("@starwind-ui/react/carousel").CarouselInstance["api"]) => void;
};

function Carousel(props: CarouselProps) {
  const { orientation = "horizontal", opts, plugins, setApi, className, children, ...rest } = props;

  return (
    <CarouselPrimitive.Root
      orientation={orientation}
      opts={opts}
      plugins={plugins}
      setApi={setApi}
      className={carousel({ class: className })}
      {...rest}
      data-slot="carousel"
    >
      {children}
    </CarouselPrimitive.Root>
  );
}

export default Carousel;
