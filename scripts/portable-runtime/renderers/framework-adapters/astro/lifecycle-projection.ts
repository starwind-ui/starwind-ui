type AstroRestPropsBindingArgs = {
  defaultElement: string;
  setupStatements?: string[];
  trailingBlankLine?: boolean;
};

type AstroRuntimeSetupArgs = {
  elementName: string;
  factory: string;
  importSource: string;
  selectorAttribute: string;
  setupFunction: string;
};

type AstroRuntimeSetupWithCleanupArgs = AstroRuntimeSetupArgs & {
  destroyFunction: string;
  instancesName: string;
  rootsName: string;
};

type AstroLifecycleProjection = {
  printFileEnvelope(contents: string): string;
  printRestPropsBinding(args: AstroRestPropsBindingArgs): string;
  printRuntimeSetup(args: AstroRuntimeSetupArgs): string;
  printRuntimeSetupWithCleanup(args: AstroRuntimeSetupWithCleanupArgs): string;
};

function printFileEnvelope(contents: string): string {
  return `---\n${contents}\n---`;
}

function printRestPropsBinding({
  defaultElement,
  setupStatements = [],
  trailingBlankLine = false,
}: AstroRestPropsBindingArgs): string {
  return `import type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${defaultElement}">;\n\n${[
    "const { ...rest } = Astro.props;",
    ...setupStatements,
  ].join("\n")}${trailingBlankLine ? "\n" : ""}`;
}

function printRuntimeSetup({
  elementName,
  factory,
  importSource,
  selectorAttribute,
  setupFunction,
}: AstroRuntimeSetupArgs): string {
  return `\n<script>\n  import { ${factory} } from "${importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${selectorAttribute}]").forEach((${elementName}) => ${factory}(${elementName}));\n  };\n\n  ${setupFunction}();\n  document.addEventListener("astro:after-swap", ${setupFunction});\n  document.addEventListener("starwind:init", ${setupFunction});\n</script>\n`;
}

function printRuntimeSetupWithCleanup({
  destroyFunction,
  factory,
  importSource,
  instancesName,
  rootsName,
  selectorAttribute,
  setupFunction,
}: AstroRuntimeSetupWithCleanupArgs): string {
  return `\n<script>\n  import { ${factory} } from "${importSource}";\n\n  const ${instancesName} = new WeakMap<HTMLElement, ReturnType<typeof ${factory}>>();\n  const ${rootsName} = new Set<HTMLElement>();\n\n  const ${setupFunction} = () => {\n    document.querySelectorAll<HTMLElement>("[${selectorAttribute}]").forEach((root) => {\n      if (${instancesName}.has(root)) return;\n\n      ${instancesName}.set(root, ${factory}(root));\n      ${rootsName}.add(root);\n    });\n  };\n\n  const ${destroyFunction} = () => {\n    ${rootsName}.forEach((root) => {\n      ${instancesName}.get(root)?.destroy();\n      ${instancesName}.delete(root);\n      ${rootsName}.delete(root);\n    });\n  };\n\n  ${setupFunction}();\n  document.addEventListener("astro:after-swap", ${setupFunction});\n  document.addEventListener("starwind:init", ${setupFunction});\n  document.addEventListener("astro:before-swap", ${destroyFunction});\n</script>\n`;
}

export const astroLifecycleProjection = {
  printFileEnvelope,
  printRestPropsBinding,
  printRuntimeSetup,
  printRuntimeSetupWithCleanup,
} satisfies AstroLifecycleProjection;
