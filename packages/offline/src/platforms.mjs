/** Platforms that get an offline platform package with native archives. */
export const SUPPORTED_PLATFORMS = Object.freeze([
  Object.freeze({ key: "darwin-arm64", os: "darwin", cpu: "arm64" }),
  Object.freeze({ key: "darwin-x64", os: "darwin", cpu: "x64" }),
  Object.freeze({ key: "linux-x64-gnu", os: "linux", cpu: "x64", libc: "glibc" }),
  Object.freeze({ key: "linux-arm64-gnu", os: "linux", cpu: "arm64", libc: "glibc" }),
  Object.freeze({ key: "linux-x64-musl", os: "linux", cpu: "x64", libc: "musl" }),
  Object.freeze({ key: "linux-arm64-musl", os: "linux", cpu: "arm64", libc: "musl" }),
  Object.freeze({ key: "win32-x64", os: "win32", cpu: "x64" }),
  Object.freeze({ key: "win32-arm64", os: "win32", cpu: "arm64" }),
]);

export function platformPackageName(platformKey) {
  return `@starwind-ui/offline-${platformKey}`;
}

function asList(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** npm semantics: `!name` excludes a value, and a list of plain names allows only those values. */
function allows(list, value) {
  const entries = asList(list).filter((entry) => typeof entry === "string" && entry.length > 0);
  if (entries.length === 0) return true;
  if (entries.includes(`!${value}`)) return false;
  const positives = entries.filter((entry) => !entry.startsWith("!"));
  return positives.length === 0 || positives.includes(value);
}

/** True when the manifest limits the package to some operating systems, CPUs, or libc builds. */
export function isNativeManifest(manifest) {
  return [manifest.os, manifest.cpu, manifest.libc].some((value) => asList(value).length > 0);
}

/** True when npm would install this manifest on the platform. libc applies only on Linux. */
export function manifestMatchesPlatform(manifest, platform) {
  if (!allows(manifest.os, platform.os) || !allows(manifest.cpu, platform.cpu)) return false;
  if (platform.os !== "linux") return true;
  return allows(manifest.libc, platform.libc);
}

/** Returns the supported platform keys whose platform package must carry this native manifest. */
export function platformsForManifest(manifest, platforms = SUPPORTED_PLATFORMS) {
  return platforms
    .filter((platform) => manifestMatchesPlatform(manifest, platform))
    .map(({ key }) => key);
}

/** Returns the supported platform for this Node.js process, or undefined. */
export function currentPlatform(
  nodePlatform = process.platform,
  arch = process.arch,
  glibc = Boolean(process.report?.getReport?.()?.header?.glibcVersionRuntime),
) {
  const libc = nodePlatform === "linux" ? (glibc ? "glibc" : "musl") : undefined;
  return SUPPORTED_PLATFORMS.find(
    (platform) =>
      platform.os === nodePlatform &&
      platform.cpu === arch &&
      (platform.libc ?? undefined) === libc,
  );
}
