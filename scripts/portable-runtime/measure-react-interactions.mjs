import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatList, parseArgs } from "./runtime-performance/interactions/command.mjs";

export async function main(argv = process.argv.slice(2), run) {
  const config = parseArgs(argv);
  if (config.mode === "list") {
    console.log(formatList());
    return;
  }
  if (config.mode === "check") {
    const { checkEvidence } = await import("./runtime-performance/interactions/evidence.mjs");
    const result = checkEvidence(config.checkDirectory);
    console.log(
      `Evidence ${result.internalValid ? "valid" : "invalid"}; current source ${result.sourceDrift ? "differs" : "matches"}.`,
    );
    if (!result.internalValid) throw new Error(result.errors.join("\n"));
    return result;
  }
  const execute = run ?? (await import("./runtime-performance/interactions/run.mjs")).runBenchmark;
  return execute(config);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    console.error(error.stack ?? String(error));
    process.exitCode = 1;
  }
}
