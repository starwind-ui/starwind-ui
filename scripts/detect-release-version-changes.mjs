import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function hasReleaseVersionChange(before, after) {
  return ["runtime", "astro", "react", "cli", "vue"].some((name) => {
    const previous = before[name];
    const current = after[name];
    return current && current.private !== true && current.version !== previous?.version;
  });
}

function readPackages(ref) {
  return Object.fromEntries(
    ["runtime", "astro", "react", "cli", "vue"].map((name) => {
      const content = execFileSync("git", ["show", `${ref}:packages/${name}/package.json`], {
        encoding: "utf8",
      });
      return [name, JSON.parse(content)];
    }),
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [before, after] = process.argv.slice(2);
  if (!before || !after) throw new Error("Expected base and head commit refs.");
  console.log(`versioned=${hasReleaseVersionChange(readPackages(before), readPackages(after))}`);
}
