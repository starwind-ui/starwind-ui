import type { FrameworkTarget } from '../../../../contracts/styled/types.js';
import { ASTRO_INDENT } from './constants.js';

export function renderNamedImport(names: string[], source: string): string {
  const inlineImport = `import { ${names.join(", ")} } from ${JSON.stringify(source)};`;
  if (inlineImport.length <= 100) return inlineImport;

  return `import {
${names.map((name) => `  ${name},`).join("\n")}
} from ${JSON.stringify(source)};`;
}

export function renderNamedExport(names: string[]): string {
  const sortedNames = [...names].sort((left, right) => left.localeCompare(right));
  const inlineExport = `export { ${sortedNames.join(", ")} };`;
  if (inlineExport.length <= 100) return inlineExport;

  return `export {
${sortedNames.map((name) => `  ${name},`).join("\n")}
};`;
}

export function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join("");
}

export function formatObjectKey(key: string): string {
  return isIdentifier(key) ? key : JSON.stringify(key);
}

export function escapeTemplateText(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("`", "\\`").replaceAll("${", "\\${");
}

export function indent(level: number): string {
  return ASTRO_INDENT.repeat(level);
}

export function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][\w$]*$/.test(value);
}

export function isForFramework(
  contract: { frameworks?: readonly FrameworkTarget[]; targetScopes?: readonly string[] },
  framework: FrameworkTarget,
): boolean {
  const scopes = contract.targetScopes ?? contract.frameworks;

  return !scopes || scopes.includes(framework);
}
