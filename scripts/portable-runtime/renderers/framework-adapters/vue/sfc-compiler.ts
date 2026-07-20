import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";

export function assertVueSfcCompiles(source: string, filename: string): void {
  const parsed = parse(source, { filename });
  if (parsed.errors.length > 0) {
    throw new Error(formatVueCompilerErrors(filename, "parse", parsed.errors));
  }

  const { descriptor } = parsed;
  const script = descriptor.scriptSetup
    ? compileScript(descriptor, { id: createVueScopeId(filename) })
    : undefined;
  if (!descriptor.template) return;

  const compiled = compileTemplate({
    compilerOptions: { bindingMetadata: script?.bindings },
    filename,
    id: createVueScopeId(filename),
    source: descriptor.template.content,
  });
  if (compiled.errors.length > 0) {
    throw new Error(formatVueCompilerErrors(filename, "template", compiled.errors));
  }
}

export function createVueScopeId(filename: string): string {
  let hash = 2166136261;
  for (const character of filename) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `starwind-${(hash >>> 0).toString(16)}`;
}

function formatVueCompilerErrors(
  filename: string,
  phase: "parse" | "template",
  errors: readonly (Error | string)[],
): string {
  return `${filename} failed Vue SFC ${phase} compilation: ${errors
    .map((error) => (typeof error === "string" ? error : error.message))
    .join("; ")}`;
}
