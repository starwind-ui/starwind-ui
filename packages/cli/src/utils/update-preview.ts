import { highlighter } from "./highlighter.js";
import type { RuntimeUpdatePlan, RuntimeUpdatePlanFile } from "./runtime-component.js";

export type UpdatePreviewOptions = {
  diff?: true | string;
  dryRun?: boolean;
  view?: true | string;
};

export type UpdatePreviewMode = {
  enabled: boolean;
  diffPath?: string;
  mode: "summary" | "diff" | "view";
  viewPath?: string;
};

export function getPreviewMode(options?: UpdatePreviewOptions): UpdatePreviewMode {
  if (options?.diff) {
    return {
      enabled: true,
      mode: "diff",
      diffPath: typeof options.diff === "string" ? options.diff : undefined,
    };
  }

  if (options?.view) {
    return {
      enabled: true,
      mode: "view",
      viewPath: typeof options.view === "string" ? options.view : undefined,
    };
  }

  return {
    enabled: options?.dryRun === true,
    mode: "summary",
  };
}

export function formatUpdatePreview(plan: RuntimeUpdatePlan, mode: UpdatePreviewMode): string {
  const lines = [highlighter.underline("Update Preview")];

  lines.push("");
  lines.push("Package requirements:");
  lines.push(
    ...formatList(
      plan.packageRequirements.map((requirement) =>
        requirement.range === "*" ? requirement.name : `${requirement.name}@${requirement.range}`,
      ),
    ),
  );

  lines.push("");
  lines.push("Packages to install:");
  lines.push(...formatList(plan.packagesToInstall));

  if (plan.failed.length > 0) {
    lines.push("");
    lines.push("Failed:");
    lines.push(...plan.failed.map((item) => `  - ${item.name}: ${item.error ?? "Unknown error"}`));
  }

  if (plan.skipped.length > 0) {
    lines.push("");
    lines.push("Skipped:");
    lines.push(
      ...plan.skipped.map((item) => `  - ${item.name}: ${item.oldVersion} -> ${item.newVersion}`),
    );
  }

  const files = filterPreviewFiles(
    plan.updates.flatMap((item) => item.files).filter((file) => file.changed),
    mode.mode === "diff" ? mode.diffPath : mode.viewPath,
  );

  lines.push("");
  lines.push("File changes:");

  if (files.length === 0) {
    lines.push("  - none");
  } else if (mode.mode === "diff") {
    lines.push(...files.map(formatFileDiff));
  } else if (mode.mode === "view") {
    lines.push(...files.map(formatFileView));
  } else {
    lines.push(...files.map((file) => `  - ${file.path}`));
  }

  return lines.join("\n");
}

function filterPreviewFiles(files: RuntimeUpdatePlanFile[], pathFilter?: string) {
  if (!pathFilter) return files;

  const normalizedFilter = normalizePreviewPath(pathFilter);
  return files.filter((file) => {
    const normalizedPath = normalizePreviewPath(file.path);
    const normalizedDestination = normalizePreviewPath(file.destination);

    return normalizedPath === normalizedFilter || normalizedDestination.endsWith(normalizedFilter);
  });
}

function formatFileDiff(file: RuntimeUpdatePlanFile): string {
  const oldLines = splitLines(file.currentContent);
  const newLines = splitLines(file.content);

  return [
    `diff -- ${file.path}`,
    `--- ${file.exists ? file.path : "/dev/null"}`,
    `+++ ${file.path}`,
    "@@",
    ...oldLines.map((line) => `-${line}`),
    ...newLines.map((line) => `+${line}`),
  ].join("\n");
}

function formatFileView(file: RuntimeUpdatePlanFile): string {
  return [`### ${file.path}`, file.content].join("\n");
}

function formatList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `  - ${item}`) : ["  - none"];
}

function splitLines(content: string): string[] {
  if (content.length === 0) return [];
  return content.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
}

function normalizePreviewPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}
