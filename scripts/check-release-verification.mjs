import { execFile } from "node:child_process";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const VERIFY_WORKFLOW_FILE = "verify.yml";
const VERIFY_WORKFLOW_PATH = ".github/workflows/verify.yml";

async function ghApi(endpoint) {
  const { stdout } = await execFileAsync("gh", ["api", "--method", "GET", endpoint], {
    encoding: "utf8",
    env: process.env,
  });
  return JSON.parse(stdout);
}

export async function checkReusableReleaseVerification({
  api = ghApi,
  baseRef = "main",
  currentSha,
  repository,
}) {
  try {
    if (!repository || !currentSha) {
      return { reason: "repository and current commit are required", reusable: false };
    }

    const pullRequests = await api(`repos/${repository}/commits/${currentSha}/pulls`);
    const candidates = pullRequests.filter(
      (pullRequest) =>
        pullRequest.merged_at &&
        pullRequest.merge_commit_sha === currentSha &&
        pullRequest.base?.ref === baseRef &&
        pullRequest.head?.repo?.full_name === repository &&
        typeof pullRequest.head?.sha === "string",
    );
    if (candidates.length !== 1) {
      return {
        reason: "the merged commit does not identify one same-repository pull request",
        reusable: false,
      };
    }

    const candidateSha = candidates[0].head.sha;
    const [currentCommit, candidateCommit, workflow] = await Promise.all([
      api(`repos/${repository}/git/commits/${currentSha}`),
      api(`repos/${repository}/git/commits/${candidateSha}`),
      api(`repos/${repository}/actions/workflows/${VERIFY_WORKFLOW_FILE}`),
    ]);
    if (!currentCommit.tree?.sha || currentCommit.tree.sha !== candidateCommit.tree?.sha) {
      return { reason: "the merged and verified candidate trees differ", reusable: false };
    }
    if (workflow.path !== VERIFY_WORKFLOW_PATH || workflow.state !== "active") {
      return { reason: "the verification workflow identity is unavailable", reusable: false };
    }

    const runs = await api(
      `repos/${repository}/actions/workflows/${workflow.id}/runs?event=workflow_dispatch&head_sha=${candidateSha}&status=completed&per_page=100`,
    );
    const successfulRun = runs.workflow_runs?.find(
      (run) =>
        run.workflow_id === workflow.id &&
        run.repository?.full_name === repository &&
        run.actor?.login === "github-actions[bot]" &&
        run.triggering_actor?.login === "github-actions[bot]" &&
        run.head_sha === candidateSha &&
        run.event === "workflow_dispatch" &&
        run.status === "completed" &&
        run.conclusion === "success" &&
        run.path?.split("@")[0] === VERIFY_WORKFLOW_PATH,
    );
    if (!successfulRun) {
      return {
        reason: "the exact candidate has no successful dispatched verification",
        reusable: false,
      };
    }

    return { candidateSha, reason: `reusing verification run ${successfulRun.id}`, reusable: true };
  } catch (error) {
    return {
      reason: `verification lookup failed: ${error instanceof Error ? error.message : String(error)}`,
      reusable: false,
    };
  }
}

async function main() {
  const result = await checkReusableReleaseVerification({
    baseRef: process.env.GITHUB_REF_NAME ?? "main",
    currentSha: process.env.GITHUB_SHA,
    repository: process.env.GITHUB_REPOSITORY,
  });
  console.error(`[release-verification] ${result.reason}`);
  console.log(`reusable=${result.reusable}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
