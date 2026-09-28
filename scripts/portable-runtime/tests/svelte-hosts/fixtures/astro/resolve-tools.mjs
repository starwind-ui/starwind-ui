import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
const execute = promisify(execFile);
/** Node enables import.meta.resolve's parent URL with this flag. Keep ESM conditions. */
export async function resolveToolEntries(entries) {
  const { stdout } = await execute(
    process.execPath,
    [
      "--experimental-import-meta-resolve",
      "--input-type=module",
      "--eval",
      `const entries = JSON.parse(process.argv[1]);
     process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(entries).map(
       ([name, { specifier, parentURL }]) => [name, import.meta.resolve(specifier, parentURL)]
     ))));`,
      JSON.stringify(entries),
    ],
    { timeout: 5000 },
  );
  const result = {};
  for (const [name, url] of Object.entries(JSON.parse(stdout))) {
    result[name] = await realpath(fileURLToPath(url));
  }
  return result;
}
