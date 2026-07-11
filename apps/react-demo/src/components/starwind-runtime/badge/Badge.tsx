import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { badge } from "./variants";

export type BadgeProps = React.ComponentPropsWithoutRef<"div"> &
  Omit<React.ComponentPropsWithoutRef<"a">, "type"> &
  Omit<VariantProps<typeof badge>, "isLink"> & {
    ref?: React.Ref<HTMLDivElement | HTMLAnchorElement>;
  };

function Badge(props: BadgeProps) {
  const { variant, tone, appearance, eyebrow, size, ref, className, children, ...rest } = props;

  const usesComposedBadgeStyle = tone !== undefined || appearance !== undefined;
  const resolvedVariant = (usesComposedBadgeStyle ? null : variant) as typeof variant;
  const resolvedTone = usesComposedBadgeStyle ? (tone ?? "neutral") : undefined;
  const resolvedAppearance = usesComposedBadgeStyle ? (appearance ?? "soft") : undefined;
  const Tag = rest.href ? "a" : "div";

  return (
    <Tag
      data-sw-badge
      className={badge({
        variant: resolvedVariant,
        tone: resolvedTone,
        appearance: resolvedAppearance,
        eyebrow,
        size,
        isLink: Boolean(rest.href),
        class: className,
      })}
      {...rest}
      ref={ref as React.Ref<HTMLDivElement> & React.Ref<HTMLAnchorElement>}
      data-slot="badge"
    >
      {children}
    </Tag>
  );
}

export default Badge;
