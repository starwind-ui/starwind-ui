import { initThemeController } from "@starwind-ui/react/theme";
import { IconMoon as Moon, IconSun as Sun } from "@tabler/icons-react";
import * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { themeToggle } from "./variants";

export type ThemeToggleProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-pressed" | "defaultPressed" | "disabled" | "onChange" | "type" | "value"
> &
  VariantProps<typeof themeToggle> & {
    ariaLabel?: string;
    defaultPressed?: boolean;
    disabled?: boolean;
    "data-slot"?: string;
    pressed?: boolean;
    ref?: React.Ref<HTMLButtonElement>;
    syncGroup?: string;
    value?: string;
    darkIcon?: React.ReactNode;
    lightIcon?: React.ReactNode;
  };

function ThemeToggle(props: ThemeToggleProps) {
  const {
    ariaLabel = "Toggle theme",
    variant = "outline",
    size = "md",
    defaultPressed,
    disabled = false,
    pressed,
    ref,
    syncGroup = "starwind-theme",
    value,
    "data-slot": dataSlot = "theme-toggle",
    className,
    children,
    darkIcon,
    lightIcon,
    ...rest
  } = props;

  const initialPressed = pressed ?? defaultPressed ?? false;

  React.useEffect(() => {
    initThemeController();
  }, []);

  return (
    <button
      className={themeToggle({ variant, size, class: className })}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={initialPressed ? "true" : "false"}
      data-state={initialPressed ? "on" : "off"}
      data-sw-toggle
      data-sw-theme-toggle
      data-sw-theme-control
      data-theme-on="dark"
      data-theme-off="light"
      data-sync-group={syncGroup}
      data-value={value}
      data-pressed={initialPressed ? "" : undefined}
      data-unpressed={initialPressed ? undefined : ""}
      data-disabled={disabled ? "" : undefined}
      ref={ref}
      {...rest}
      data-slot={dataSlot}
    >
      {children ?? (
        <span className="size-5" data-theme-icon-wrapper>
          {lightIcon ?? (
            <Sun
              className="hidden size-5 group-data-[state=off]:data-ready:block"
              aria-hidden="true"
              data-theme-icon
            />
          )}

          {darkIcon ?? (
            <Moon
              className="hidden size-5 group-data-[state=on]:data-ready:block"
              aria-hidden="true"
              data-theme-icon
            />
          )}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
