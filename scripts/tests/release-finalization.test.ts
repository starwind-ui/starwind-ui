import { describe, expect, it } from "vitest";

import {
  assertReleaseIdentityAvailable,
  createGitHubReleaseArgs,
  deriveReleaseIdentity,
  runReleaseFinalization,
  verifyPublishedPackages,
} from "../release-finalization.mjs";
import { VUE_BETA_RELEASE_PLAN } from "../release-packages.mjs";

describe("Vue beta release finalization", () => {
  it.each(["0.1.1", "0.2.0", "1.0.0"])(
    "gives a Vue-only beta %s its own GitHub prerelease identity",
    (version) => {
      expect(
        deriveReleaseIdentity(
          [{ entry: { name: "@starwind-ui/vue", tag: "beta" }, manifest: { version } }],
          "latest",
          "abc123",
        ),
      ).toMatchObject({ prerelease: true, tagName: `vue-v${version}` });
    },
  );

  it("gives a Runtime update its own identity when the CLI is unchanged", () => {
    expect(
      deriveReleaseIdentity(
        [
          {
            entry: { name: "@starwind-ui/runtime", tag: "latest" },
            manifest: { version: "1.2.1" },
          },
        ],
        "latest",
        "abc123",
      ),
    ).toMatchObject({ prerelease: false, tagName: "runtime-v1.2.1" });
  });

  it.each([
    ["@starwind-ui/vue", "0.1.0", "beta", null, "0.1.0", true],
    ["@starwind-ui/vue", "0.1.0", "beta", null, null, true],
    ["@starwind-ui/vue", "0.1.0", "beta", "0.0.8", "0.1.0", false],
    ["@starwind-ui/vue", "0.1.0", "beta", null, "0.2.0", false],
    ["@starwind-ui/vue", "0.1.1", "beta", null, "0.1.1", false],
    ["@starwind-ui/react", "0.1.0", "beta", null, "0.1.0", false],
    ["@starwind-ui/vue", "0.1.0", "next", null, "0.1.0", false],
  ])(
    "checks initial latest exception for %s@%s on %s (%s -> %s)",
    async (name, version, tag, before, after, accepted) => {
      const result = verifyPublishedPackages(
        {
          packages: [{ name, version, tag }],
          preservedDistTags: { [name]: { latest: before } },
        },
        {
          capture: async (_command: string, args: string[]) => ({
            code: 0,
            stderr: "",
            stdout: JSON.stringify(
              args[2] === "version"
                ? version
                : { [tag]: version, ...(after === null ? {} : { latest: after }) },
            ),
          }),
        },
        { attempts: 1 },
      );
      if (accepted) await expect(result).resolves.toBeUndefined();
      else await expect(result).rejects.toThrow(/dist-tag latest changed/);
    },
  );

  it("verifies each package against its own dist-tag", async () => {
    const packageManifests = VUE_BETA_RELEASE_PLAN.map((entry) => ({
      entry,
      manifest: { name: entry.name, version: entry.version },
    }));
    const release = deriveReleaseIdentity(packageManifests, undefined, "abc123");
    expect(release).toMatchObject({
      packages: [
        { name: "@starwind-ui/vue", tag: "beta", version: "0.1.0" },
        { name: "starwind", tag: "latest", version: "3.3.0" },
      ],
      prerelease: false,
      tagName: "v3.3.0",
    });

    const calls: string[] = [];
    await verifyPublishedPackages(release, {
      capture: async (command: string, args: string[]) => {
        calls.push([command, ...args].join(" "));
        const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
        const entry = release.packages.find((candidate) => candidate.name === packageName)!;
        return args[2] === "version"
          ? { code: 0, stderr: "", stdout: JSON.stringify(entry.version) }
          : { code: 0, stderr: "", stdout: JSON.stringify({ [entry.tag]: entry.version }) };
      },
      run: async () => undefined,
    });
    expect(calls).toHaveLength(4);
  });

  it("uses the Vue-beta recovery command when registry propagation is incomplete", async () => {
    const release = {
      finalizeCommand: "pnpm release:vue-beta:finalize",
      packages: [{ name: "@starwind-ui/vue", tag: "beta", version: "0.1.0" }],
    };
    await expect(
      verifyPublishedPackages(
        release,
        {
          capture: async () => ({ code: 1, stderr: "npm error E404", stdout: "" }),
          run: async () => undefined,
        },
        { attempts: 1 },
      ),
    ).rejects.toThrow(/pnpm release:vue-beta:finalize/);
  });

  it("retries until npm exposes a published package and its dist-tag", async () => {
    const release = {
      packages: [{ name: "starwind", tag: "latest", version: "3.3.2" }],
    };
    const waits: number[] = [];
    const retries: string[] = [];
    let tagChecks = 0;

    await verifyPublishedPackages(
      release,
      {
        capture: async (_command: string, args: string[]) => {
          if (args[2] === "version") {
            return { code: 0, stderr: "", stdout: JSON.stringify("3.3.2") };
          }
          tagChecks += 1;
          return {
            code: 0,
            stderr: "",
            stdout: JSON.stringify({ latest: tagChecks === 1 ? "3.3.1" : "3.3.2" }),
          };
        },
      },
      {
        attempts: 2,
        onRetry: (subject: string) => retries.push(subject),
        retryDelayMs: 10_000,
        wait: async (delayMs: number) => waits.push(delayMs),
      },
    );

    expect(tagChecks).toBe(2);
    expect(retries).toEqual(["starwind@3.3.2 dist-tag latest"]);
    expect(waits).toEqual([10_000]);
  });

  it("leaves a recovery path when an old dist-tag does not propagate", async () => {
    const waits: number[] = [];
    let tagChecks = 0;

    await expect(
      verifyPublishedPackages(
        {
          packages: [{ name: "starwind", tag: "latest", version: "3.3.2" }],
        },
        {
          capture: async (_command: string, args: string[]) => {
            if (args[2] === "version") {
              return { code: 0, stderr: "", stdout: JSON.stringify("3.3.2") };
            }
            tagChecks += 1;
            return { code: 0, stderr: "", stdout: JSON.stringify({ latest: "3.3.1" }) };
          },
        },
        {
          attempts: 2,
          onRetry: () => undefined,
          retryDelayMs: 10_000,
          wait: async (delayMs: number) => waits.push(delayMs),
        },
      ),
    ).rejects.toThrow(
      /latest must point to 3\.3\.2, found 3\.3\.1 did not become visible with its expected npm state.*pnpm release:finalize/,
    );

    expect(tagChecks).toBe(2);
    expect(waits).toEqual([10_000]);
  });

  it("fails without retrying on a permanent npm registry error", async () => {
    const waits: number[] = [];
    let checks = 0;

    await expect(
      verifyPublishedPackages(
        {
          packages: [{ name: "starwind", tag: "latest", version: "3.3.2" }],
        },
        {
          capture: async () => {
            checks += 1;
            return { code: 1, stderr: "npm error E401", stdout: "" };
          },
        },
        {
          attempts: 31,
          onRetry: () => undefined,
          wait: async (delayMs: number) => waits.push(delayMs),
        },
      ),
    ).rejects.toThrow(/version could not be verified: npm error E401/);

    expect(checks).toBe(1);
    expect(waits).toEqual([]);
  });

  it("preserves Vue latest while its beta tag propagates", async () => {
    const waits: number[] = [];
    let tagChecks = 0;

    await verifyPublishedPackages(
      {
        packages: [{ name: "@starwind-ui/vue", tag: "beta", version: "0.1.1" }],
        preservedDistTags: { "@starwind-ui/vue": { latest: "0.1.0" } },
      },
      {
        capture: async (_command: string, args: string[]) => {
          if (args[2] === "version") {
            return { code: 0, stderr: "", stdout: JSON.stringify("0.1.1") };
          }
          tagChecks += 1;
          return {
            code: 0,
            stderr: "",
            stdout: JSON.stringify(
              tagChecks === 1 ? { latest: "0.1.0" } : { beta: "0.1.1", latest: "0.1.0" },
            ),
          };
        },
      },
      {
        attempts: 2,
        onRetry: () => undefined,
        retryDelayMs: 10_000,
        wait: async (delayMs: number) => waits.push(delayMs),
      },
    );

    expect(tagChecks).toBe(2);
    expect(waits).toEqual([10_000]);
  });

  it("verifies Vue beta and CLI latest before finalization mutates Git or GitHub", async () => {
    const packageManifests = VUE_BETA_RELEASE_PLAN.map((entry) => ({
      entry,
      manifest: { name: entry.name, version: entry.version },
    }));
    const events: string[] = [];
    await runReleaseFinalization({
      gitStateLoader: async () => ({ head: "abc123" }),
      system: {
        capture: async (command: string, args: string[]) => {
          const invocation = [command, ...args].join(" ");
          events.push(`read ${invocation}`);
          if (command === "npm") {
            const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
            const entry = VUE_BETA_RELEASE_PLAN.find(
              (candidate) => candidate.name === packageName,
            )!;
            return args[2] === "version"
              ? { code: 0, stderr: "", stdout: JSON.stringify(entry.version) }
              : {
                  code: 0,
                  stderr: "",
                  stdout: JSON.stringify({
                    [entry.tag]: entry.version,
                    ...(entry.name === "@starwind-ui/vue" ? { latest: "0.0.8" } : {}),
                  }),
                };
          }
          if (command === "git" && args[0] === "ls-remote") {
            return { code: 0, stderr: "", stdout: "" };
          }
          return { code: 1, stderr: command === "gh" ? "release not found" : "", stdout: "" };
        },
        run: async (command: string, args: string[]) => {
          events.push(`mutate ${[command, ...args].join(" ")}`);
        },
      },
      vueBeta: true,
      vueBetaMetadataLoader: async () => ({ packageManifests }),
      vueLatestBaselineLoader: async () => ({ vueLatest: "0.0.8" }),
    });

    expect(events.slice(0, 4)).toEqual([
      "read npm view @starwind-ui/vue@0.1.0 version --json",
      "read npm view @starwind-ui/vue@0.1.0 dist-tags --json",
      "read npm view starwind@3.3.0 version --json",
      "read npm view starwind@3.3.0 dist-tags --json",
    ]);
    expect(events.findIndex((event) => event.startsWith("mutate "))).toBeGreaterThan(3);
  });

  it("stops standalone beta finalization before mutation when CLI latest is wrong", async () => {
    const packageManifests = VUE_BETA_RELEASE_PLAN.map((entry) => ({
      entry,
      manifest: { name: entry.name, version: entry.version },
    }));
    const mutations: string[] = [];
    await expect(
      runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        registryVerificationOptions: { attempts: 1 },
        system: {
          capture: async (command: string, args: string[]) => {
            if (command !== "npm") throw new Error("Git finalization started before npm passed.");
            const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
            const entry = VUE_BETA_RELEASE_PLAN.find(
              (candidate) => candidate.name === packageName,
            )!;
            if (args[2] === "version") {
              return { code: 0, stderr: "", stdout: JSON.stringify(entry.version) };
            }
            const tagVersion = packageName === "starwind" ? "3.2.0" : entry.version;
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify({
                [entry.tag]: tagVersion,
                ...(entry.name === "@starwind-ui/vue" ? { latest: "0.0.8" } : {}),
              }),
            };
          },
          run: async (command: string, args: string[]) => {
            mutations.push([command, ...args].join(" "));
          },
        },
        vueBeta: true,
        vueBetaMetadataLoader: async () => ({ packageManifests }),
        vueLatestBaselineLoader: async () => ({ vueLatest: "0.0.8" }),
      }),
    ).rejects.toThrow(/starwind dist-tag latest must point to 3\.3\.0/);
    expect(mutations).toEqual([]);
  });

  it("rejects a changed Vue latest even when Vue beta and CLI latest are correct", async () => {
    const packageManifests = VUE_BETA_RELEASE_PLAN.map((entry) => ({
      entry,
      manifest: { name: entry.name, version: entry.version },
    }));
    const mutations: string[] = [];
    await expect(
      runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        registryVerificationOptions: { attempts: 1 },
        system: {
          capture: async (command: string, args: string[]) => {
            if (command !== "npm") throw new Error("Git finalization started before npm passed.");
            const packageName = args[1].slice(0, args[1].lastIndexOf("@"));
            const entry = VUE_BETA_RELEASE_PLAN.find(
              (candidate) => candidate.name === packageName,
            )!;
            if (args[2] === "version") {
              return { code: 0, stderr: "", stdout: JSON.stringify(entry.version) };
            }
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify({
                [entry.tag]: entry.version,
                ...(entry.name === "@starwind-ui/vue" ? { latest: "0.1.0" } : {}),
              }),
            };
          },
          run: async (command: string, args: string[]) => {
            mutations.push([command, ...args].join(" "));
          },
        },
        vueBeta: true,
        vueBetaMetadataLoader: async () => ({ packageManifests }),
        vueLatestBaselineLoader: async () => ({ vueLatest: "0.0.8" }),
      }),
    ).rejects.toThrow(/@starwind-ui\/vue dist-tag latest changed.*expected 0\.0\.8, found 0\.1\.0/);
    expect(mutations).toEqual([]);
  });
});

describe("routine release finalization", () => {
  const packageManifests = [
    {
      entry: { name: "@starwind-ui/vue", tag: "beta" },
      manifest: { version: "0.1.1" },
    },
    { entry: { name: "starwind", tag: "latest" }, manifest: { version: "3.3.1" } },
  ];
  const plan = {
    packages: [{ name: "@starwind-ui/vue", version: "0.1.1", tag: "beta" }],
    vueLatest: "0.1.0",
  };

  it.each(["0.1.0", "0.1.1"])(
    "finalizes the saved Vue-only plan with latest at %s",
    async (latest) => {
      const mutations: string[] = [];
      const registryReads: string[] = [];
      const result = runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        metadataLoader: async () => ({ packageManifests, tag: "latest" }),
        publicationPlanLoader: async () => plan,
        registryVerificationOptions: { attempts: 1 },
        system: {
          capture: async (command: string, args: string[]) => {
            if (command === "npm") {
              registryReads.push(args[1]);
              return {
                code: 0,
                stderr: "",
                stdout: JSON.stringify(args[2] === "version" ? "0.1.1" : { beta: "0.1.1", latest }),
              };
            }
            if (command === "git" && args[0] === "ls-remote") {
              return { code: 0, stderr: "", stdout: "" };
            }
            return { code: 1, stderr: "release not found", stdout: "" };
          },
          run: async (command: string, args: string[]) => {
            mutations.push([command, ...args].join(" "));
          },
        },
      });
      if (latest === "0.1.0") {
        const release = await result;
        expect(release).toMatchObject({ tagName: "vue-v0.1.1", prerelease: true });
        expect(mutations).toContain(`gh ${createGitHubReleaseArgs(release).join(" ")}`);
        expect(mutations.at(-1)).toContain("--prerelease --latest=false");
      } else {
        await expect(result).rejects.toThrow(/dist-tag latest changed/);
        expect(mutations).toEqual([]);
      }
      expect(registryReads).toEqual(["@starwind-ui/vue@0.1.1", "@starwind-ui/vue@0.1.1"]);
    },
  );

  it("uses the CLI identity for a mixed routine Vue and CLI plan", async () => {
    const registryReads: string[] = [];
    const mutations: string[] = [];
    const release = await runReleaseFinalization({
      gitStateLoader: async () => ({ head: "abc123" }),
      metadataLoader: async () => ({ packageManifests, tag: "latest" }),
      publicationPlanLoader: async () => ({
        packages: [
          { name: "@starwind-ui/vue", tag: "beta", version: "0.1.1" },
          { name: "starwind", tag: "latest", version: "3.3.1" },
        ],
        vueLatest: "0.1.0",
      }),
      registryVerificationOptions: { attempts: 1 },
      system: {
        capture: async (command: string, args: string[]) => {
          if (command === "npm") {
            registryReads.push(args[1]);
            const isVue = args[1].startsWith("@starwind-ui/vue@");
            const version = isVue ? "0.1.1" : "3.3.1";
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify(
                args[2] === "version"
                  ? version
                  : isVue
                    ? { beta: version, latest: "0.1.0" }
                    : { latest: version },
              ),
            };
          }
          if (command === "git" && args[0] === "ls-remote") {
            return { code: 0, stderr: "", stdout: "" };
          }
          return { code: 1, stderr: "release not found", stdout: "" };
        },
        run: async (command: string, args: string[]) => {
          mutations.push([command, ...args].join(" "));
        },
      },
    });

    expect(release).toMatchObject({
      packages: [
        { name: "@starwind-ui/vue", tag: "beta", version: "0.1.1" },
        { name: "starwind", tag: "latest", version: "3.3.1" },
      ],
      prerelease: false,
      preservedDistTags: { "@starwind-ui/vue": { latest: "0.1.0" } },
      tagName: "v3.3.1",
    });
    expect(registryReads).toEqual([
      "@starwind-ui/vue@0.1.1",
      "@starwind-ui/vue@0.1.1",
      "starwind@3.3.1",
      "starwind@3.3.1",
    ]);
    expect(mutations.at(-1)).toContain("gh release create v3.3.1");
    expect(mutations.at(-1)).toContain("--latest");
  });

  it("uses the Runtime identity for a mixed routine Runtime and Vue plan", async () => {
    const runtimeAndVueManifests = [
      {
        entry: { name: "@starwind-ui/runtime", tag: "latest" },
        manifest: { version: "1.2.1" },
      },
      packageManifests[0],
    ];
    const registryReads: string[] = [];
    const release = await runReleaseFinalization({
      gitStateLoader: async () => ({ head: "abc123" }),
      metadataLoader: async () => ({ packageManifests: runtimeAndVueManifests, tag: "latest" }),
      publicationPlanLoader: async () => ({
        packages: [
          { name: "@starwind-ui/runtime", tag: "latest", version: "1.2.1" },
          { name: "@starwind-ui/vue", tag: "beta", version: "0.1.1" },
        ],
        vueLatest: "0.1.0",
      }),
      registryVerificationOptions: { attempts: 1 },
      system: {
        capture: async (command: string, args: string[]) => {
          if (command === "npm") {
            registryReads.push(args[1]);
            const isVue = args[1].startsWith("@starwind-ui/vue@");
            const version = isVue ? "0.1.1" : "1.2.1";
            return {
              code: 0,
              stderr: "",
              stdout: JSON.stringify(
                args[2] === "version"
                  ? version
                  : isVue
                    ? { beta: version, latest: "0.1.0" }
                    : { latest: version },
              ),
            };
          }
          if (command === "git" && args[0] === "ls-remote") {
            return { code: 0, stderr: "", stdout: "" };
          }
          return { code: 1, stderr: "release not found", stdout: "" };
        },
        run: async () => undefined,
      },
    });

    expect(release).toMatchObject({
      packages: [
        { name: "@starwind-ui/runtime", tag: "latest", version: "1.2.1" },
        { name: "@starwind-ui/vue", tag: "beta", version: "0.1.1" },
      ],
      prerelease: false,
      preservedDistTags: { "@starwind-ui/vue": { latest: "0.1.0" } },
      tagName: "runtime-v1.2.1",
    });
    expect(registryReads).toEqual([
      "@starwind-ui/runtime@1.2.1",
      "@starwind-ui/runtime@1.2.1",
      "@starwind-ui/vue@0.1.1",
      "@starwind-ui/vue@0.1.1",
    ]);
  });

  it("leaves Git and GitHub untouched for an empty saved publication plan", async () => {
    const unexpected = async () => {
      throw new Error("An empty plan must perform no external commands.");
    };
    await expect(
      runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        metadataLoader: async () => ({ packageManifests, tag: "latest" }),
        publicationPlanLoader: async () => ({ ...plan, packages: [] }),
        system: { capture: unexpected, run: unexpected },
      }),
    ).resolves.toBeUndefined();
  });

  it("requires the original publication plan before querying or changing external state", async () => {
    const unexpected = async () => {
      throw new Error("Finalization started without its saved plan.");
    };
    await expect(
      runReleaseFinalization({
        gitStateLoader: async () => ({ head: "abc123" }),
        metadataLoader: async () => ({ packageManifests, tag: "latest" }),
        publicationPlanLoader: async () => {
          throw new Error("Publication plan is missing.");
        },
        system: { capture: unexpected, run: unexpected },
      }),
    ).rejects.toThrow("Publication plan is missing.");
  });

  it("rejects an existing release tag on a different commit during read-only preflight", async () => {
    const release = deriveReleaseIdentity(packageManifests.slice(0, 1), "latest", "abc123");
    await expect(
      assertReleaseIdentityAvailable(release, {
        capture: async (command: string, args: string[]) => {
          if (command === "git") {
            return { code: 0, stderr: "", stdout: args[0] === "rev-parse" ? "other-sha" : "" };
          }
          return { code: 1, stderr: "release not found", stdout: "" };
        },
        run: async () => {
          throw new Error("Preflight must not mutate state.");
        },
      }),
    ).rejects.toThrow(/points to other-sha, expected abc123/);
  });
});
