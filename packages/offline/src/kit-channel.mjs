// Release channel of the offline kit.
import semver from "semver";

/**
 * During the beta, the kit has its own version and publishes on the `beta` tag. A new beta kit
 * needs a new version here, because the release skips a kit version that npm already has. To
 * leave the beta, set this to undefined: the kit then publishes at the `starwind` version with the
 * `starwind` tag. Also update the version sentence in `kit-readme.md` and the docs.
 */
export const KIT_BETA = Object.freeze({ version: "0.1.0", tag: "beta" });

/** npm dist-tag for a kit that follows the starwind version. A prerelease must not move `latest`. */
export function releaseTag(version) {
  const prerelease = semver.prerelease(version);
  if (!prerelease) return "latest";
  return typeof prerelease[0] === "string" ? prerelease[0] : "next";
}

/** The kit version and npm tag for a release of a starwind version. */
export function resolveKitRelease(cliVersion, beta = KIT_BETA) {
  if (beta) return { kitVersion: beta.version, tag: beta.tag };
  return { kitVersion: cliVersion, tag: releaseTag(cliVersion) };
}
