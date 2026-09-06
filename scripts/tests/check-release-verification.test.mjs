import { describe, expect, it } from "vitest";

import { checkReusableReleaseVerification } from "../check-release-verification.mjs";

const repository = "starwind-ui/starwind-ui";
const currentSha = "merged-sha";
const candidateSha = "candidate-sha";
const workflow = { id: 42, path: ".github/workflows/verify.yml", state: "active" };

function responses() {
  return new Map([
    [
      `repos/${repository}/commits/${currentSha}/pulls`,
      [
        {
          base: { ref: "main" },
          head: { repo: { full_name: repository }, sha: candidateSha },
          merge_commit_sha: currentSha,
          merged_at: "2026-09-06T18:00:00Z",
        },
      ],
    ],
    [`repos/${repository}/git/commits/${currentSha}`, { tree: { sha: "tree-sha" } }],
    [`repos/${repository}/git/commits/${candidateSha}`, { tree: { sha: "tree-sha" } }],
    [`repos/${repository}/actions/workflows/verify.yml`, workflow],
    [
      `repos/${repository}/actions/workflows/42/runs?event=workflow_dispatch&head_sha=${candidateSha}&status=completed&per_page=100`,
      {
        workflow_runs: [
          {
            actor: { login: "github-actions[bot]" },
            conclusion: "success",
            event: "workflow_dispatch",
            head_sha: candidateSha,
            id: 84,
            path: ".github/workflows/verify.yml@refs/heads/changeset-release/main",
            repository: { full_name: repository },
            status: "completed",
            triggering_actor: { login: "github-actions[bot]" },
            workflow_id: 42,
          },
        ],
      },
    ],
  ]);
}

async function check(entries = responses()) {
  return checkReusableReleaseVerification({
    api: async (endpoint) => {
      if (!entries.has(endpoint)) throw new Error(`Unexpected endpoint: ${endpoint}`);
      return structuredClone(entries.get(endpoint));
    },
    currentSha,
    repository,
  });
}

describe("release verification reuse", () => {
  it("reuses an exact successful candidate run when the full trees match", async () => {
    await expect(check()).resolves.toMatchObject({ candidateSha, reusable: true });
  });

  it("falls back when the merge tree changes", async () => {
    const entries = responses();
    entries.set(`repos/${repository}/git/commits/${currentSha}`, { tree: { sha: "changed-tree" } });
    await expect(check(entries)).resolves.toMatchObject({ reusable: false });
  });

  it.each([
    ["failed", { conclusion: "failure" }],
    ["wrong workflow", { workflow_id: 99 }],
    ["wrong repository", { repository: { full_name: "someone/fork" } }],
    ["wrong commit", { head_sha: "other-sha" }],
    ["manual dispatch", { actor: { login: "maintainer" } }],
  ])("falls back for a %s run", async (_label, change) => {
    const entries = responses();
    const endpoint = `repos/${repository}/actions/workflows/42/runs?event=workflow_dispatch&head_sha=${candidateSha}&status=completed&per_page=100`;
    const value = structuredClone(entries.get(endpoint));
    Object.assign(value.workflow_runs[0], change);
    entries.set(endpoint, value);
    await expect(check(entries)).resolves.toMatchObject({ reusable: false });
  });

  it("falls back for a fork, ambiguous pull request, inactive workflow, or lookup error", async () => {
    const pullsEndpoint = `repos/${repository}/commits/${currentSha}/pulls`;

    const fork = responses();
    fork.get(pullsEndpoint)[0].head.repo.full_name = "someone/fork";
    await expect(check(fork)).resolves.toMatchObject({ reusable: false });

    const ambiguous = responses();
    ambiguous.get(pullsEndpoint).push(structuredClone(ambiguous.get(pullsEndpoint)[0]));
    await expect(check(ambiguous)).resolves.toMatchObject({ reusable: false });

    const inactive = responses();
    inactive.set(`repos/${repository}/actions/workflows/verify.yml`, {
      ...workflow,
      state: "disabled_manually",
    });
    await expect(check(inactive)).resolves.toMatchObject({ reusable: false });

    await expect(
      checkReusableReleaseVerification({
        api: async () => {
          throw new Error("API unavailable");
        },
        currentSha,
        repository,
      }),
    ).resolves.toMatchObject({ reusable: false });
  });
});
