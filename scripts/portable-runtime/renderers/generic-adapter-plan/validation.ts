import type {
  GenericAdapterPlan,
  GenericAdapterPlanFile,
  GenericAdapterPlanIssue,
  GenericAdapterPlanPart,
} from "./types.js";

export function validateGenericAdapterPlan(plan: GenericAdapterPlan): GenericAdapterPlanIssue[] {
  const issues: GenericAdapterPlanIssue[] = [];
  const component = plan.component || "(unknown)";

  if (!plan.component) {
    issues.push(issue(component, "component", "Missing component id."));
  }
  if (!plan.displayName) {
    issues.push(issue(component, "displayName", "Missing display name."));
  }
  if (!plan.outputDirectory) {
    issues.push(issue(component, "outputDirectory", "Missing output directory."));
  }

  const parts = collectParts(plan, issues);
  const files = collectFiles(plan, issues);

  requirePart(component, parts, plan.runtime.rootPart, "runtime.rootPart", issues);

  for (const file of plan.files) {
    if (file.kind === "part") {
      requirePart(component, parts, file.part, `files.${file.path}.part`, issues);
    }
  }

  for (const attribute of plan.staticAttributes) {
    requirePart(
      component,
      parts,
      attribute.part,
      `staticAttributes.${attribute.name}.part`,
      issues,
    );
    if (!attribute.name) {
      issues.push(issue(component, "staticAttributes.name", "Static attribute is missing a name."));
    }
  }

  for (const ref of plan.refs) {
    requirePart(component, parts, ref.part, `refs.${ref.part}.part`, issues);
  }

  if (!plan.exports.namespace) {
    issues.push(issue(component, "exports.namespace", "Missing export namespace."));
  }

  const exportMembers = new Set<string>();
  for (const member of plan.exports.members) {
    if (exportMembers.has(member.name)) {
      issues.push(
        issue(
          component,
          `exports.members.${member.name}`,
          `Duplicate export member "${member.name}".`,
        ),
      );
    }
    exportMembers.add(member.name);

    if (!parts.has(member.part)) {
      issues.push(
        issue(
          component,
          `exports.members.${member.name}.part`,
          `Export member "${member.name}" references missing part "${member.part}".`,
        ),
      );
    }
    if (!files.has(member.file)) {
      issues.push(
        issue(
          component,
          `exports.members.${member.name}.file`,
          `Export member "${member.name}" references missing file "${member.file}".`,
        ),
      );
    }
  }

  plan.escapeDeclarations.forEach((escapeDeclaration, index) => {
    if (!escapeDeclaration.boundary) {
      issues.push(
        issue(
          component,
          `escapeDeclarations.${index}.boundary`,
          "Escape declaration is missing a boundary.",
        ),
      );
    }
    if (!escapeDeclaration.reason) {
      issues.push(
        issue(
          component,
          `escapeDeclarations.${index}.reason`,
          "Escape declaration is missing a reason.",
        ),
      );
    }
    if (escapeDeclaration.tests.length === 0) {
      issues.push(
        issue(
          component,
          `escapeDeclarations.${index}.tests`,
          "Escape declaration must list at least one test.",
        ),
      );
    }
  });

  return issues;
}

function collectParts(
  plan: GenericAdapterPlan,
  issues: GenericAdapterPlanIssue[],
): Map<string, GenericAdapterPlanPart> {
  const parts = new Map<string, GenericAdapterPlanPart>();
  for (const part of plan.parts) {
    if (parts.has(part.name)) {
      issues.push(issue(plan.component, `parts.${part.name}`, `Duplicate part "${part.name}".`));
    }
    parts.set(part.name, part);
  }

  return parts;
}

function collectFiles(
  plan: GenericAdapterPlan,
  issues: GenericAdapterPlanIssue[],
): Map<string, GenericAdapterPlanFile> {
  const files = new Map<string, GenericAdapterPlanFile>();
  for (const file of plan.files) {
    if (files.has(file.path)) {
      issues.push(
        issue(plan.component, `files.${file.path}`, `Duplicate file path "${file.path}".`),
      );
    }
    files.set(file.path, file);
  }

  return files;
}

function requirePart(
  component: string,
  parts: ReadonlyMap<string, GenericAdapterPlanPart>,
  name: string,
  path: string,
  issues: GenericAdapterPlanIssue[],
): void {
  if (!parts.has(name)) {
    issues.push(issue(component, path, `Missing part "${name}".`));
  }
}

function issue(component: string, path: string, message: string): GenericAdapterPlanIssue {
  return { component: component || "(unknown)", path, message };
}
