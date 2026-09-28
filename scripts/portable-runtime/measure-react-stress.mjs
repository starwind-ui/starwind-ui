import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkStressRun } from "./runtime-performance/stress/evidence.mjs";
import { parseStressArgs } from "./runtime-performance/stress/plan.mjs";

export async function main(argv = process.argv.slice(2), run) {
  const config = parseStressArgs(argv);
  if (config.check) {
    const result = checkStressRun(path.resolve(config.check), {
      workload: config.checkWorkload,
    });
    if (!result.internalValid) throw new Error(result.errors.join("\n"));
    console.log(`Retained stress evidence valid: ${config.check}`);
    return result;
  }
  const execute = run ?? (await import("./runtime-performance/stress/run.mjs")).runStress;
  return execute({ selected: config.selected });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.stack ?? String(error));
    process.exitCode = 1;
  }
}
