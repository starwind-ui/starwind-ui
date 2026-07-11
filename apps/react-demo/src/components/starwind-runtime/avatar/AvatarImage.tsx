import AvatarPrimitive from "@starwind-ui/react/avatar";
import type * as React from "react";
import { avatarImage } from "./variants";

export type AvatarImageProps = Omit<React.ComponentPropsWithoutRef<"img">, "children"> & {
  alt: string;
  onLoadingStatusChange?: (
    status: import("@starwind-ui/react/avatar").AvatarImageLoadingStatus,
    details: import("@starwind-ui/react/avatar").AvatarLoadingStatusChangeDetails,
  ) => void;
  ref?: React.Ref<HTMLImageElement>;
};

function AvatarImage(props: AvatarImageProps) {
  const { onLoadingStatusChange, ref, className, ...rest } = props;

  return (
    <AvatarPrimitive.Image
      className={avatarImage({ class: className })}
      onLoadingStatusChange={onLoadingStatusChange}
      {...rest}
      ref={ref}
      data-slot="avatar-image"
    />
  );
}

export default AvatarImage;
