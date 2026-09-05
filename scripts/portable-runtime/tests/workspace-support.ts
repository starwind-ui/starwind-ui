import { existsSync } from "node:fs";
import {
  createPrimitiveFrameworkAdapterTargetLookup,
  primitiveFrameworkAdapterTargets,
} from "../renderers/framework-adapters/target-registry.js";
import type { FrameworkAdapterTargetRegistration } from "../renderers/framework-adapters/types.js";

// Shared tests accept either workspace's registered targets without importing private types.
export const workspacePrimitiveTargets: readonly FrameworkAdapterTargetRegistration[] =
  primitiveFrameworkAdapterTargets;
export const getWorkspacePrimitiveTarget =
  createPrimitiveFrameworkAdapterTargetLookup(workspacePrimitiveTargets);

// The public sync intentionally omits private adapter source and evidence.
export const hasPrivateSvelte = existsSync("packages/svelte/package.json");
export const expectedPrimitiveTargets = [
  "astro",
  "react",
  "vue",
  ...(hasPrivateSvelte ? ["svelte"] : []),
];
