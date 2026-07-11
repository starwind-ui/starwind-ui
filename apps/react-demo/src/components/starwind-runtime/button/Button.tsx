import ButtonPrimitive from "@starwind-ui/react/button";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { button } from "./variants";

export type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  Omit<React.ComponentPropsWithoutRef<"a">, "type"> &
  VariantProps<typeof button> & {
    as?: "button" | "a";
    "data-slot"?: string;
    focusableWhenDisabled?: boolean;
    ref?: React.Ref<HTMLButtonElement | HTMLAnchorElement>;
  };

function Button(props: ButtonProps) {
  const {
    variant,
    size,
    as: buttonAs,
    href,
    disabled = false,
    focusableWhenDisabled,
    "data-slot": dataSlot = "button",
    ref,
    tabIndex,
    className,
    children,
    ...rest
  } = props;

  if (buttonAs === "a" || href !== undefined) {
    return (
      <a
        className={button({ variant, size, class: className })}
        href={disabled ? undefined : href}
        aria-disabled={disabled ? "true" : undefined}
        data-disabled={disabled ? "" : undefined}
        {...rest}
        tabIndex={disabled ? -1 : tabIndex}
        ref={ref as React.Ref<HTMLAnchorElement>}
        data-slot={dataSlot}
      >
        {children}
      </a>
    );
  }

  return (
    <ButtonPrimitive.Root
      className={button({ variant, size, class: className })}
      disabled={disabled}
      focusableWhenDisabled={focusableWhenDisabled}
      ref={ref as React.Ref<HTMLButtonElement>}
      {...rest}
      data-slot={dataSlot}
    >
      {children}
    </ButtonPrimitive.Root>
  );
}

export default Button;
