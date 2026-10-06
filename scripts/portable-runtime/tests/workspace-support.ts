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
// Svelte is public now, so its package no longer marks the private workspace. This directory
// stays out of the public sync, together with the private measurement scripts.
export const hasPrivateWorkspace = existsSync("scripts/portable-runtime/tests/private");
export const expectedPrimitiveTargets = [
  "astro",
  "react",
  "vue",
  ...(hasPrivateSvelte ? ["svelte"] : []),
];
