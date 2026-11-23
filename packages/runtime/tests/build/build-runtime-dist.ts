import { build, type Options } from "tsup";

import runtimeBuild from "../../tsup.config";

/** Build the shipping entries before browser tests import the real minified Runtime. */
export default async function buildRuntimeDist(): Promise<void> {
  await build({ ...(runtimeBuild as Options), config: false, silent: true });
}
