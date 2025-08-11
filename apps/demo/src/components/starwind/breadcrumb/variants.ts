import { tv } from "tailwind-variants";

const breadcrumbLinkVariants = tv({ base: "hover:text-foreground transition-colors" });
const breadcrumbEllipsisVariants = tv({
  base: "flex size-6 items-center justify-center [&>svg]:size-4",
});
const breadcrumbItemVariants = tv({ base: "inline-flex items-center gap-1.5" });
const breadcrumbListVariants = tv({
  base: "text-muted-foreground flex flex-wrap items-center gap-1.5 break-words sm:gap-2",
});
const breadcrumbPageVariants = tv({ base: "text-foreground font-normal" });
const breadcrumbSeparatorVariants = tv({ base: "[&>svg]:size-4" });

export {
  breadcrumbLinkVariants,
  breadcrumbEllipsisVariants,
  breadcrumbItemVariants,
  breadcrumbListVariants,
  breadcrumbPageVariants,
  breadcrumbSeparatorVariants,
};
