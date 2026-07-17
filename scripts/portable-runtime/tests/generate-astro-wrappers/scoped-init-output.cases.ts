import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { GetTempRoot } from "./shared.js";
import { expect, generateAstroPrimitiveWrappers, it, path, readGeneratedTree } from "./shared.js";

export function defineAstroScopedInitOutputTests(getTempRoot: GetTempRoot): void {
  it("scopes primitive initialization to starwind:init event detail roots", async () => {
    const tempRoot = getTempRoot();

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const tree = await readGeneratedTree(outputRoot);
    const initScripts = Object.entries(tree).filter(
      ([relativePath, source]) =>
        relativePath.endsWith(".astro") &&
        source.includes("registerAstroControllerLifecycle(") &&
        source.includes("querySelectorAll<HTMLElement>"),
    );

    expect(initScripts.length).toBeGreaterThan(0);

    for (const [relativePath, source] of initScripts) {
      expect(source, relativePath).toContain("const getInitCandidates = (");
      expect(source, relativePath).toContain('event?.type === "starwind:init"');
      expect(source, relativePath).toContain("const initRoot =");
      expect(source, relativePath).toContain("isQueryableRoot(initRoot)");
      expect(source, relativePath).toContain("scopedRoot.querySelectorAll<HTMLElement>(selector)");
      expect(source, relativePath).toContain("candidates.unshift(scopedRoot as HTMLElement)");
      expect(source, relativePath).toContain("value instanceof Document");
      expect(source, relativePath).toContain("value instanceof DocumentFragment");
      expect(source, relativePath).toContain("value instanceof Element");
      expect(source, relativePath).toMatch(/const setup\w+ = \(event\?: Event\) => \{/);
      expect(source, relativePath).toMatch(/getInitCandidates\(event,\s*"\[[^"]+\]"\)/);
      expect(source, relativePath).not.toMatch(/document\s*\.\s*querySelectorAll<HTMLElement>/);
    }
  });

  it("executes generated scoped initialization for containers and root elements", async () => {
    const tempRoot = getTempRoot();

    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated/primitives/astro");
    const tree = await readGeneratedTree(outputRoot);
    const buttonRoot = tree["button/ButtonRoot.astro"];
    const optedButtonSelector = '[data-sw-button][data-focusable-when-disabled="true"]';
    const ordinaryButton = new FakeElement("[data-sw-button]");
    const outsideButton = new FakeElement(optedButtonSelector);
    const scopedButton = new FakeElement(optedButtonSelector);
    const scopedContainer = new FakeElement(undefined, [scopedButton]);
    const documentRoot = new FakeDocument([ordinaryButton, outsideButton, scopedContainer]);
    const initialized: FakeElement[] = [];

    executeGeneratedScript(buttonRoot, {
      createButton: (root) => {
        initialized.push(root);
        return { setDisabled: () => {} };
      },
      document: documentRoot,
    });

    expect(initialized).toEqual([outsideButton, scopedButton]);

    initialized.length = 0;
    documentRoot.dispatch("starwind:init", new FakeCustomEvent("starwind:init", scopedContainer));
    expect(initialized).toEqual([scopedButton]);

    initialized.length = 0;
    documentRoot.dispatch("starwind:init", new FakeCustomEvent("starwind:init", scopedButton));
    expect(initialized).toEqual([scopedButton]);

    initialized.length = 0;
    documentRoot.dispatch(
      "astro:after-swap",
      new FakeCustomEvent("astro:after-swap", scopedContainer),
    );
    expect(initialized).toEqual([outsideButton, scopedButton]);

    initialized.length = 0;
    documentRoot.dispatch("starwind:init", new FakeCustomEvent("starwind:init", new FakeNode()));
    expect(initialized).toEqual([outsideButton, scopedButton]);
  });
}

type ExecuteGeneratedScriptOptions = {
  createButton: (root: FakeElement) => { setDisabled(disabled: boolean): void };
  document: FakeDocument;
};

function executeGeneratedScript(
  source: string,
  { createButton, document }: ExecuteGeneratedScriptOptions,
): void {
  const script = source.match(/<script>\n([\s\S]*?)<\/script>/)?.[1];
  if (!script) {
    throw new Error("Expected generated ButtonRoot.astro to include a script block.");
  }

  const executableScript = script
    .replace(
      /^\s*import\s+\{\s*createButton\s*\}\s+from\s+"@starwind-ui\/runtime\/button";\s*$/m,
      "",
    )
    .replace(/^\s*import\s+\{[\s\S]*?\}\s+from\s+"\.\.\/internal\/controller-lifecycle";\s*$/m, "");
  const { outputText } = transpileModule(executableScript, {
    compilerOptions: {
      module: ModuleKind.None,
      target: ScriptTarget.ES2022,
    },
  });

  new Function(
    "createButton",
    "document",
    "Event",
    "CustomEvent",
    "Node",
    "Element",
    "Document",
    "DocumentFragment",
    "HTMLButtonElement",
    "registerAstroControllerLifecycle",
    "trackAstroController",
    outputText,
  )(
    createButton,
    document,
    FakeEvent,
    FakeCustomEvent,
    FakeNode,
    FakeElement,
    FakeDocument,
    FakeDocumentFragment,
    FakeElement,
    (_key: string, setup: (event?: FakeEvent) => void, destroy?: () => void) => {
      setup();
      document.addEventListener("astro:after-swap", () => setup());
      document.addEventListener("starwind:init", (event) => setup(event));
      if (destroy) {
        document.addEventListener("astro:before-swap", destroy);
      }
    },
    (_key: string, _root: FakeElement, controller: unknown) => controller,
  );
}

class FakeNode {}

class FakeElement extends FakeNode {
  readonly children: FakeElement[];
  readonly selector: string | undefined;

  hasAttribute(attribute: string): boolean {
    return attribute === "data-disabled" && this.selector?.includes("data-disabled") === true;
  }

  constructor(selector?: string, children: FakeElement[] = []) {
    super();
    this.children = children;
    this.selector = selector;
  }

  matches(selector: string): boolean {
    return this.selector === selector;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const matches: FakeElement[] = [];

    const visit = (node: FakeElement) => {
      if (node.matches(selector)) {
        matches.push(node);
      }

      node.children.forEach(visit);
    };

    this.children.forEach(visit);

    return matches;
  }
}

class FakeDocument extends FakeElement {
  readonly listeners = new Map<string, (event: FakeEvent) => void>();

  constructor(children: FakeElement[] = []) {
    super(undefined, children);
  }

  addEventListener(type: string, listener: (event: FakeEvent) => void): void {
    this.listeners.set(type, listener);
  }

  dispatch(type: string, event: FakeEvent): void {
    this.listeners.get(type)?.(event);
  }
}

class FakeDocumentFragment extends FakeElement {
  constructor(children: FakeElement[] = []) {
    super(undefined, children);
  }
}

class FakeEvent {
  readonly type: string;

  constructor(type: string) {
    this.type = type;
  }
}

class FakeCustomEvent extends FakeEvent {
  readonly detail: { root: unknown };

  constructor(type: string, root: unknown) {
    super(type);
    this.detail = { root };
  }
}
