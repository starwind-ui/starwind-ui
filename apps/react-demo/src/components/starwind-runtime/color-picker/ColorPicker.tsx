import * as React from "react";
import { Popover } from "../popover";
import ColorPickerRoot from "./ColorPickerRoot";

export type ColorPickerProps = React.ComponentProps<typeof ColorPickerRoot> & {
  defaultOpen?: boolean;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideInteract?: boolean;
  modal?: boolean;
  openOnHover?: boolean;
  closeDelay?: number;
  onOpenChange?: React.ComponentProps<typeof Popover>["onOpenChange"];
  onCloseComplete?: React.ComponentProps<typeof Popover>["onCloseComplete"];
};

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  function ColorPicker(props, forwardedRef) {
    const {
      defaultOpen = false,
      open,
      closeOnEscape = true,
      closeOnOutsideInteract = true,
      modal = false,
      openOnHover = false,
      closeDelay = 200,
      onOpenChange,
      onCloseComplete,
      value,
      defaultValue = "#000000",
      format,
      alpha = true,
      allowEmpty = false,
      disabled = false,
      readOnly = false,
      name,
      form,
      required = false,
      locale,
      dir,
      onValueChange,
      onValueCommitted,
      onFormatChange,
      className,
      size = "md",
      children,
      ...rest
    } = props;

    return (
      <Popover
        defaultOpen={defaultOpen}
        open={open}
        closeOnEscape={closeOnEscape}
        closeOnOutsideInteract={closeOnOutsideInteract}
        modal={modal}
        openOnHover={openOnHover}
        closeDelay={closeDelay}
        onOpenChange={onOpenChange}
        onCloseComplete={onCloseComplete}
      >
        <ColorPickerRoot
          value={value}
          defaultValue={defaultValue}
          format={format}
          alpha={alpha}
          allowEmpty={allowEmpty}
          disabled={disabled}
          readOnly={readOnly}
          name={name}
          form={form}
          required={required}
          locale={locale}
          dir={dir}
          {...rest}
          data-floating-root={true}
          onValueChange={onValueChange}
          onValueCommitted={onValueCommitted}
          onFormatChange={onFormatChange}
          ref={forwardedRef}
          className={className}
          size={size}
        >
          {children}
        </ColorPickerRoot>
      </Popover>
    );
  },
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
