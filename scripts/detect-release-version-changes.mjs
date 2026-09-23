import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function hasReleaseVersionChange(before, after) {
  return ["runtime", "astro", "react", "cli", "vue", "svelte"].some((name) => {
    const previous = before[name];
    const current = after[name];
    return current && current.private !== true && current.version !== previous?.version;
  });
}

function readPackages(ref) {
  const names = ["runtime", "astro", "react", "cli", "vue", "svelte"];
  const manifests = new Set(
    execFileSync(
      "git",
      [
        "ls-tree",
        "-r",
        "--name-only",
        ref,
        "--",
        ...names.map((name) => `packages/${name}/package.json`),
      ],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n"),
  );
  return Object.fromEntries(
    names.map((name) => {
      if (!manifests.has(`packages/${name}/package.json`)) return [name, undefined];
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
