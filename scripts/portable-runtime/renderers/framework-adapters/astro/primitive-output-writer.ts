import { writeGeneratedFile } from "../../shared.js";
import {
  type FrameworkAdapterPrimitiveOutputWriterOptions,
  writePrimitiveOutputFiles,
} from "../primitive-output-writer.js";
import { astroFrameworkAdapter } from "./adapter.js";

export type AstroAdapterOutputWriterOptions = FrameworkAdapterPrimitiveOutputWriterOptions & {
  astroHeader: string;
  outputModel: Parameters<typeof writePrimitiveOutputFiles>[0]["outputModel"];
  tsHeader: string;
};

export async function writeAstroAdapterOutput({
  astroHeader,
  componentName,
  ignoreOutputModelFilePaths,
  outputModel,
  outputRoot,
  tsHeader,
}: AstroAdapterOutputWriterOptions): Promise<void> {
  await writePrimitiveOutputFiles({
    adapter: astroFrameworkAdapter,
    componentName,
    extension: "astro",
    ignoreOutputModelFilePaths,
    outputModel,
    outputRoot,
    target: "astro",
    targetDisplayName: "Astro",
    transformPrintedFile: (file) =>
      file.path.endsWith(".astro")
        ? file.contents.replace(/^---\n/, astroHeader)
        : `${tsHeader}${file.contents}`,
    writeFile: writeAstroPrimitiveFile,
  });
}

export async function writeAstroPrimitiveFile(
  dir: string,
  fileName: string,
  contents: string,
): Promise<void> {
  await writeGeneratedFile(dir, fileName, normalizeAstroPrimitiveOutput(fileName, contents));
}

export function normalizeAstroPrimitiveOutput(fileName: string, contents: string): string {
  return applyManagedControllerLifecycle(fileName, applyScopedInit(contents));
}

export function renderAstroControllerLifecycleFile(tsHeader: string): string {
  return `${tsHeader}type AstroController = {
  destroy(): void;
};

type AstroControllerSetup = (event?: Event) => void;

type AstroControllerLifecycle = {
  controllers: WeakMap<HTMLElement, AstroController>;
  destroy?: () => void;
  registered: boolean;
  roots: Set<HTMLElement>;
  setup: AstroControllerSetup;
};

const lifecycles = new Map<string, AstroControllerLifecycle>();

export function registerAstroControllerLifecycle(
  key: string,
  setup: AstroControllerSetup,
  destroy?: () => void,
): void {
  const lifecycle = getLifecycle(key);
  lifecycle.setup = setup;
  lifecycle.destroy = destroy;

  if (!lifecycle.registered) {
    lifecycle.registered = true;
    document.addEventListener("astro:after-swap", () => lifecycle.setup());
    document.addEventListener("starwind:init", (event) => lifecycle.setup(event));
    document.addEventListener("astro:before-swap", () => destroyLifecycle(lifecycle));
  }

  lifecycle.setup();
}

export function trackAstroController<T extends AstroController>(
  key: string,
  root: HTMLElement,
  controller: T,
): T {
  const lifecycle = getLifecycle(key);
  const previous = lifecycle.controllers.get(root);

  if (previous && previous !== controller) {
    previous.destroy();
  }

  lifecycle.controllers.set(root, controller);
  lifecycle.roots.add(root);
  return controller;
}

function getLifecycle(key: string): AstroControllerLifecycle {
  const existing = lifecycles.get(key);
  if (existing) return existing;

  const lifecycle: AstroControllerLifecycle = {
    controllers: new WeakMap(),
    registered: false,
    roots: new Set(),
    setup: () => {},
  };
  lifecycles.set(key, lifecycle);
  return lifecycle;
}

function destroyLifecycle(lifecycle: AstroControllerLifecycle): void {
  if (lifecycle.destroy) {
    lifecycle.destroy();
  }

  lifecycle.roots.forEach((root) => {
    lifecycle.controllers.get(root)?.destroy();
    lifecycle.controllers.delete(root);
  });
  lifecycle.roots.clear();
}
`;
}

function applyManagedControllerLifecycle(fileName: string, contents: string): string {
  if (!contents.includes('document.addEventListener("astro:after-swap"')) return contents;
  if (!contents.includes('document.addEventListener("starwind:init"')) return contents;

  const setupName = contents.match(
    /document\.addEventListener\("astro:after-swap", (setup\w+)\);/,
  )?.[1];
  const factoryName = contents.match(/import \{\s*(create\w+)/)?.[1];
  if (!setupName || !factoryName) return contents;

  const destroyName = contents.match(
    /document\.addEventListener\("astro:before-swap", (destroy\w+)\);/,
  )?.[1];
  const lifecycleKey = fileName.replace(/\.[^.]+$/, "");
  const helperImport = destroyName
    ? '  import { registerAstroControllerLifecycle } from "../internal/controller-lifecycle";'
    : '  import { registerAstroControllerLifecycle, trackAstroController } from "../internal/controller-lifecycle";';

  let next = contents.replace(
    /(<script>\n\s+import \{[^\n]+\} from "@starwind-ui\/runtime\/[^\n]+";)/,
    `$1\n${helperImport}`,
  );

  if (!destroyName) {
    const factoryCall = new RegExp(`\\b${factoryName}\\((\\w+)\\)`, "g");
    next = next.replace(
      factoryCall,
      `trackAstroController("${lifecycleKey}", $1, ${factoryName}($1))`,
    );
  }

  next = next
    .replace(
      new RegExp(`\\n  ${setupName}\\(\\);\\n`),
      `\n  registerAstroControllerLifecycle("${lifecycleKey}", ${setupName}${destroyName ? `, ${destroyName}` : ""});\n`,
    )
    .replace(
      new RegExp(
        `  document\\.addEventListener\\("astro:after-swap", ${setupName}\\);\\n`,
      ),
      "",
    )
    .replace(
      new RegExp(`  document\\.addEventListener\\("starwind:init", ${setupName}\\);\\n`),
      "",
    );

  if (destroyName) {
    next = next.replace(
      new RegExp(
        `  document\\.addEventListener\\("astro:before-swap", ${destroyName}\\);\\n`,
      ),
      "",
    );
  }

  return next;
}

function applyScopedInit(contents: string): string {
  if (!shouldScopeInit(contents)) return contents;
  if (contents.includes("const getInitCandidates =")) return contents;

  const setupMatch = contents.match(/\n  const (setup\w+) = \(\) => \{\n/);
  if (!setupMatch) return contents;

  const setupName = setupMatch[1];
  const scopedSetup = `
  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {
    const initRoot =
      event?.type === "starwind:init" && event instanceof CustomEvent ? event.detail?.root : undefined;
    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)
      ? initRoot
      : document;
    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));

    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {
      candidates.unshift(scopedRoot as HTMLElement);
    }

    return candidates;
  };

  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>
    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;

  const ${setupName} = (event?: Event) => {
`;

  return contents
    .replace(setupMatch[0], scopedSetup)
    .replace(
      /document\s*\.\s*querySelectorAll<HTMLElement>\(([^)]+)\)/g,
      "getInitCandidates(event, $1)",
    );
}

function shouldScopeInit(contents: string): boolean {
  return (
    contents.includes('document.addEventListener("starwind:init"') &&
    contents.includes("querySelectorAll<HTMLElement>")
  );
}
