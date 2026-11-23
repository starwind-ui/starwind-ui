import path from "node:path";

export const PACKAGE_DOCS_DIRECTORY = "docs";
export const PACKAGE_DOCS_ENTRY_FILES = ["docs/README.md", "docs/llms.txt"];

const MARKDOWN_LINK_PATTERN = /\[[^\]\n]*\]\(([^)\s]+)\)/g;
const VERSION_LINE_PATTERN = /^(?:- )?Version: (\S+)[ \t]*$/m;

export const STARWIND_SITE_ORIGIN = "https://starwind.dev";

function isRelativeLink(target) {
  return !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith("#") && !target.startsWith("/");
}

/** Splits Markdown into prose and code, so link rules skip fenced and inline code. */
function splitProseAndCode(contents) {
  return contents.split(/(^```[\s\S]*?^```$|`[^`\n]*`)/m).map((part, index) => ({
    code: index % 2 === 1,
    text: part,
  }));
}

function prose(contents) {
  return splitProseAndCode(contents)
    .filter((part) => !part.code)
    .map((part) => part.text)
    .join("");
}

/**
 * Rewrites site-relative Markdown links, such as `/docs/components/tabs/`, to absolute Starwind
 * website links. Installed docs have no site root, so a relative site path cannot resolve there.
 */
export function absolutizeSiteLinks(contents) {
  return splitProseAndCode(contents)
    .map((part) =>
      part.code
        ? part.text
        : // Match on `](/` alone, because link text can hold inline code in its own segment.
          part.text.replace(/\]\(\/(?!\/)/g, `](${STARWIND_SITE_ORIGIN}/`),
    )
    .join("");
}

/** Lists Markdown links that start with `/`, which resolve against no site in installed docs. */
export function findSiteRelativePackageDocsLinks(files) {
  const found = [];
  for (const [file, contents] of [...files].sort(([left], [right]) =>
    compareCodeUnits(left, right),
  )) {
    if (!file.endsWith(".md") && !file.endsWith(".txt")) continue;
    for (const match of prose(contents).matchAll(MARKDOWN_LINK_PATTERN)) {
      if (match[1].startsWith("/")) found.push(`${file} -> ${match[1]}`);
    }
  }
  return found;
}

/** Compares strings by UTF-16 code units, so the order is the same on every machine. */
export function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Lists relative Markdown links that do not resolve to another file in the same package.
 * `files` maps package-relative paths, such as `docs/README.md`, to their text.
 */
export function findBrokenPackageDocsLinks(files) {
  const broken = [];
  for (const [file, contents] of [...files].sort(([left], [right]) => left.localeCompare(right))) {
    if (!file.endsWith(".md") && !file.endsWith(".txt")) continue;
    for (const match of prose(contents).matchAll(MARKDOWN_LINK_PATTERN)) {
      const target = match[1];
      if (!isRelativeLink(target)) continue;
      const withoutFragment = target.split("#")[0];
      if (!withoutFragment) continue;
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), withoutFragment),
      );
      if (resolved.startsWith("../") || !files.has(resolved)) {
        broken.push(`${file} -> ${target}`);
      }
    }
  }
  return broken;
}

/**
 * Checks that installed package docs exist, carry the package version, and link only to files
 * inside the same package or to absolute URLs.
 */
export function validatePackageDocs({ files, name, version }) {
  const errors = [];
  for (const entry of PACKAGE_DOCS_ENTRY_FILES) {
    if (!files.has(entry)) errors.push(`${name}: missing ${entry}`);
  }
  const docs = [...files.keys()]
    .filter((file) => file.startsWith(`${PACKAGE_DOCS_DIRECTORY}/`))
    .sort((left, right) => left.localeCompare(right));
  for (const file of docs) {
    const contents = files.get(file);
    if (!contents.includes(name)) errors.push(`${name}: ${file} does not name the package`);
    const found = VERSION_LINE_PATTERN.exec(contents)?.[1];
    if (found === undefined) errors.push(`${name}: ${file} has no version line`);
    else if (found !== version) {
      errors.push(`${name}: ${file} documents version ${found}, expected ${version}`);
    }
  }
  for (const link of findBrokenPackageDocsLinks(files)) {
    errors.push(`${name}: broken relative link ${link}`);
  }
  for (const link of findSiteRelativePackageDocsLinks(files)) {
    errors.push(
      `${name}: site-relative link ${link}; use ${STARWIND_SITE_ORIGIN}${link.split(" -> ")[1]}`,
    );
  }
  return errors;
}
