import type { StyledPackageRequirementContract } from "./types.js";

/**
 * tailwind-variants imports tailwind-merge. Releases before 3.7 do not see `px-*` as a conflict
 * with logical `ps-*` and `pe-*` classes, so a user `px-*` override loses to them. Styled
 * contracts that use logical classes declare this floor so add and update raise tailwind-merge.
 */
export const LOGICAL_CLASS_TAILWIND_MERGE_REQUIREMENT = {
  name: "tailwind-merge",
  range: "^3.7.0",
} as const satisfies StyledPackageRequirementContract;
