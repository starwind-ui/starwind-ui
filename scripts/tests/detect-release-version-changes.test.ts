import { describe, expect, it } from "vitest";
import { hasReleaseVersionChange } from "../detect-release-version-changes.mjs";

describe("release version detection", () => {
  it("detects Vue-only beta versioning without a deleted Changeset", () => {
    expect(
      hasReleaseVersionChange({ vue: { version: "0.1.0" } }, { vue: { version: "0.1.1" } }),
    ).toBe(true);
  });
  it("detects the initial private-to-public Vue beta", () => {
    expect(
      hasReleaseVersionChange(
        { vue: { version: "0.0.0", private: true } },
        { vue: { version: "0.1.0" } },
      ),
    ).toBe(true);
  });
  it.each(["runtime", "astro", "react", "cli"])("detects %s version changes", (name) => {
    expect(
      hasReleaseVersionChange({ [name]: { version: "1.0.0" } }, { [name]: { version: "1.0.1" } }),
    ).toBe(true);
  });
  it("ignores dependency-only changes and private packages", () => {
    expect(
      hasReleaseVersionChange(
        { vue: { version: "0.1.0" } },
        { vue: { version: "0.1.0", dependencies: { vue: "3.5.0" } } },
      ),
    ).toBe(false);
    expect(
      hasReleaseVersionChange(
        {},
        { vue: { version: "0.0.1", private: true }, svelte: { version: "1.0.0" } },
      ),
    ).toBe(false);
  });
});
