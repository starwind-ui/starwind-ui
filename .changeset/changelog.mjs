function formatSummary(summary) {
  const [firstLine, ...remainingLines] = summary
    .split("\n")
    .map((line) => line.trimEnd());

  const continuation = remainingLines.map((line) => `  ${line}`).join("\n");
  return continuation ? `- ${firstLine}\n${continuation}` : `- ${firstLine}`;
}

export async function getReleaseLine(changeset) {
  return formatSummary(changeset.summary);
}

export async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return "";

  return [
    "- Updated dependencies",
    ...dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
    ),
  ].join("\n");
}

export default { getDependencyReleaseLine, getReleaseLine };
