import path from "node:path";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { runtimeAdapterContracts } from "../../../contracts/primitive/representatives";
import type {
  PrimitivePartContract,
  PrimitivePropContract,
  RuntimeAdapterContract,
} from "../../../contracts/primitive/types";
import { partParents, skippedParts, togetherRootProps } from "./compositions";
import { emissionExceptions } from "./exceptions";
import {
  EMISSION_TARGETS,
  type EmissionTarget,
  normalizeAttributeValue,
  type ParsedElement,
  type PartFacts,
  parseElements,
  partExists,
  partFile,
  propIsRead,
  type RenderNode,
  readPartFacts,
  renderTree,
  repositoryRoot,
  vueEmitIsPublished,
} from "./render";

type LoadedPart = { contract: PrimitivePartContract; component: unknown; facts: PartFacts };

const usedExceptions = new Set<string>();
let checkedFamilies = 0;

function isExcepted(target: EmissionTarget, family: string, part: string, fact: string): boolean {
  const entry = emissionExceptions.find(
    (candidate) =>
      candidate.targets.includes(target) &&
      candidate.fact.test(fact) &&
      (!candidate.family || candidate.family.test(family)) &&
      (!candidate.part || candidate.part.test(part)),
  );
  if (entry) usedExceptions.add(entry.name);
  return entry !== undefined;
}

/** A value that differs from the prop's default, so that handling it can change the output. */
function probeValue(prop: PrimitivePropContract): unknown {
  const type = prop.type.trim();
  if (type.includes("=>") || /\['get[A-Z]/.test(type)) return () => "probe";
  if (/^number\b/.test(type)) return prop.defaultValue === "7" ? 8 : 7;
  if (type === "boolean") return prop.defaultValue !== "true";
  const literals = [...type.matchAll(/"([^"]+)"/g)].map((match) => match[1]!);
  if (literals.length > 0) {
    return literals.find((literal) => `"${literal}"` !== prop.defaultValue) ?? literals[0];
  }
  if (/Orientation$/.test(type)) return "vertical";
  if (/\[\]$/.test(type) || /^(readonly )?string\[\]/.test(type)) return ["probe"];
  if (/Value$/.test(type) && /slider/i.test(prop.type)) return 7;
  return "probe";
}

function targetPropName(target: EmissionTarget, name: string, facts: PartFacts): string {
  if (target === "vue" && name === "value" && !facts.declared.has("value")) return "modelValue";
  if (target === "vue" && name.startsWith("on") && facts.declared.has(name)) return name;
  return name;
}

function propTargets(contract: RuntimeAdapterContract, prop: PrimitivePropContract): string[] {
  return prop.targets ?? [contract.runtime.rootPart];
}

async function loadParts(
  target: EmissionTarget,
  contract: RuntimeAdapterContract,
): Promise<Map<string, LoadedPart>> {
  const parts = new Map<string, LoadedPart>();
  for (const part of contract.parts) {
    if (skippedParts[contract.component]?.includes(part.name)) continue;
    if (!partExists(target, contract.component, part.name)) continue;
    const file = partFile(target, contract.component, part.name);
    const module = (await import(/* @vite-ignore */ file)) as { default: unknown };
    parts.set(part.name, {
      contract: part,
      component: module.default,
      facts: readPartFacts(target, file, module.default),
    });
  }
  return parts;
}

function requiredProps(
  part: LoadedPart,
  contract: RuntimeAdapterContract,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const prop of contract.props) {
    if (prop.required && propTargets(contract, prop).includes(part.contract.name)) {
      props[prop.name] = probeValue(prop);
    }
  }
  if (part.facts.declared.has("src")) props.src = "probe.png";
  const isGroup = /group$/i.test(part.contract.name);
  if (
    part.contract.name !== contract.runtime.rootPart &&
    !isGroup &&
    part.facts.declared.has("value")
  ) {
    props.value ??= "probe";
  }
  return props;
}

function openProps(contract: RuntimeAdapterContract, partName: string): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  if (partName === contract.runtime.rootPart) {
    for (const model of contract.stateModels ?? []) {
      if (model.name === "open" && model.defaultProp) props[model.defaultProp] = true;
    }
  }
  if (contract.presence?.keepMountedProp) {
    for (const prop of contract.props) {
      if (
        prop.name === contract.presence.keepMountedProp &&
        propTargets(contract, prop).includes(partName)
      ) {
        props[prop.name] = true;
      }
    }
  }
  return props;
}

function buildTree(
  contract: RuntimeAdapterContract,
  parts: Map<string, LoadedPart>,
  propsFor: (part: LoadedPart) => Record<string, unknown>,
): RenderNode {
  const nodes = new Map<string, RenderNode>();
  for (const [name, part] of parts) {
    nodes.set(name, { component: part.component, props: propsFor(part), children: [] });
  }
  const rootName = contract.runtime.rootPart;
  const root = nodes.get(rootName);
  if (!root) throw new Error(`${contract.component} has no root part file.`);
  for (const [name, node] of nodes) {
    if (name === rootName) continue;
    const parentName = partParents[contract.component]?.[name] ?? rootName;
    (nodes.get(parentName) ?? root).children.push(node);
  }
  return root;
}

/** `data-close-delay` is the Runtime form of the `closeDelay` prop. */
function attributePropName(attribute: string): string | undefined {
  if (!attribute.startsWith("data-")) return undefined;
  return attribute
    .slice("data-".length)
    .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function attributeIsAcceptedProp(
  contract: RuntimeAdapterContract,
  parts: Map<string, LoadedPart>,
  part: PrimitivePartContract,
  attribute: string,
): boolean {
  const prop = attributePropName(attribute);
  if (!prop) return false;
  const owners = [parts.get(part.name), parts.get(contract.runtime.rootPart)];
  return owners.some((owner) => owner?.facts.declared.has(prop) && propIsRead(owner.facts, prop));
}

type MountSpec = { file: string; props: Record<string, unknown>; children: MountSpec[] };

function toMountSpec(
  target: EmissionTarget,
  node: RenderNode,
  files: Map<unknown, string>,
): MountSpec {
  return {
    file: files.get(node.component)!,
    props: node.props,
    children: node.children.map((child) => toMountSpec(target, child, files)),
  };
}

let browser: Browser;
const mountPages = new Map<EmissionTarget, Promise<Page>>();

function mountPage(target: EmissionTarget): Promise<Page> {
  let page = mountPages.get(target);
  if (!page) {
    page = (async () => {
      const opened = await browser.newPage();
      const base = inject("conformanceBaseUrl");
      await opened.goto(
        target === "astro" ? `${base}/astro/emission/` : `${base}/${target}.html?page=emission`,
      );
      await opened.waitForFunction(() => window.__cf?.ready === true);
      return opened;
    })();
    mountPages.set(target, page);
  }
  return page;
}

function elementsFor(html: string, part: PrimitivePartContract): ParsedElement[] {
  return parseElements(html).filter((element) => element.attributes.has(part.discoveryAttribute));
}

type Gap = string;

async function checkFamily(
  target: EmissionTarget,
  contract: RuntimeAdapterContract,
): Promise<Gap[]> {
  const gaps: Gap[] = [];
  const parts = await loadParts(target, contract);
  const baseProps = (part: LoadedPart) => requiredProps(part, contract);
  const openBaseProps = (part: LoadedPart) => ({
    ...requiredProps(part, contract),
    ...openProps(contract, part.contract.name),
  });
  const render = (propsFor: (part: LoadedPart) => Record<string, unknown>) =>
    renderTree(target, buildTree(contract, parts, propsFor));

  // Some attributes need two props at once, such as `aria-disabled` on a non-native disabled button.
  // Part-level `disabled` and the portal facts live outside `contract.props`.
  const allProbes =
    (mode: "all" | "uncontrolled" | "disabled-parts") =>
    (item: LoadedPart): Record<string, unknown> => {
      const props = openBaseProps(item);
      for (const prop of contract.props) {
        if (prop.kind === "children" || prop.kind === "callback") continue;
        if (prop.unsupportedTargets?.includes(target)) continue;
        if (!propTargets(contract, prop).includes(item.contract.name)) continue;
        if (mode !== "all" && prop.kind === "control") continue;
        if (prop.name === "asChild") continue;
        // A controlled value replaces its default, so a part never receives both.
        if ((contract.stateModels ?? []).some((model) => model.defaultProp === prop.name)) continue;
        props[targetPropName(target, prop.name, item.facts)] = probeValue(prop);
      }
      const isRoot = item.contract.name === contract.runtime.rootPart;
      const printsDisabled = item.contract.initialAttributes?.some(({ name }) =>
        /^(data-|aria-)?disabled$/.test(name),
      );
      if (mode !== "disabled-parts" || !isRoot) {
        if (item.facts.declared.has("disabled") || printsDisabled) props.disabled = true;
        if (item.facts.declared.has("readOnly")) props.readOnly = true;
      }
      if (mode === "disabled-parts" && isRoot) delete props.disabled;
      // A part can restate a root option, such as `closeDelay` on a Preview Card trigger.
      for (const attribute of item.contract.initialAttributes ?? []) {
        const name = attributePropName(attribute.name);
        const isModel = (contract.stateModels ?? []).some(
          (model) => model.defaultProp === name || model.controlledProp === name,
        );
        if (attribute.source === "prop" && name && !isModel && item.facts.declared.has(name)) {
          props[name] ??= "7";
        }
      }
      if (item.contract.name === "portal") props.container = "body";
      return props;
    };
  const closedBase = await render(baseProps);
  const openBase = await render(openBaseProps);
  const renders: string[] = [closedBase, openBase];
  const combined = [
    allProbes("all"),
    allProbes("uncontrolled"),
    allProbes("disabled-parts"),
    ...(togetherRootProps[contract.component] ?? []).map(
      (rootProps) => (item: LoadedPart) => ({
        ...openBaseProps(item),
        ...(item.contract.name === contract.runtime.rootPart ? rootProps : {}),
      }),
    ),
  ];
  for (const propsFor of combined) {
    try {
      renders.push(await render(propsFor));
    } catch {
      // Some families reject the full set together. Each prop still renders alone below.
    }
  }

  // Each prop renders alone over both baselines. Output that changes proves the part handles it.
  for (const prop of contract.props) {
    if (prop.kind === "children") continue;
    if (prop.unsupportedTargets?.includes(target)) continue;
    for (const partName of propTargets(contract, prop)) {
      const part = parts.get(partName);
      if (!part) continue;
      const name = targetPropName(target, prop.name, part.facts);
      if (prop.kind === "callback") {
        const domEvent = contract.events?.find((event) => event.callbackProp === prop.name);
        const handled =
          target === "astro"
            ? domEvent?.domEvent !== undefined
            : (target === "vue" && vueEmitIsPublished(part.facts, name)) ||
              (part.facts.declared.has(name) && propIsRead(part.facts, name));
        if (!handled && !isExcepted(target, contract.component, partName, prop.name)) {
          gaps.push(`${partName}: callback ${prop.name} is not handled`);
        }
        continue;
      }
      // asChild with no child throws on some targets, so reading the prop is the proof. The browser
      // suite plays asChild with real children.
      if (prop.name === "asChild") {
        if (
          !(part.facts.declared.has(name) && propIsRead(part.facts, name)) &&
          !isExcepted(target, contract.component, partName, prop.name)
        ) {
          gaps.push(`${partName}: prop asChild is not handled`);
        }
        continue;
      }
      const probe = probeValue(prop);
      const withProbe =
        (base: (part: LoadedPart) => Record<string, unknown>) => (item: LoadedPart) => ({
          ...base(item),
          ...(item === part ? { [name]: probe } : {}),
        });
      let changed = false;
      for (const [base, baseline] of [
        [baseProps, closedBase],
        [openBaseProps, openBase],
      ] as const) {
        try {
          const output = await render(withProbe(base));
          renders.push(output);
          // An undeclared prop that falls through to the element is a leak, not handling. A plain
          // native name such as `form` can be real pass-through, unless it is a state model prop.
          const leaked =
            !part.facts.declared.has(name) &&
            (/[A-Z]/.test(name) || prop.kind === "control") &&
            parseElements(output).some((element) => element.attributes.has(name.toLowerCase()));
          if (output !== baseline && !leaked) changed = true;
        } catch {
          // A probe that throws still proves the part read it.
          changed = true;
        }
      }
      const declaredAndRead = part.facts.declared.has(name) && propIsRead(part.facts, name);
      if (
        !changed &&
        !declaredAndRead &&
        !isExcepted(target, contract.component, partName, prop.name)
      ) {
        gaps.push(`${partName}: prop ${prop.name} changes no output and is never read`);
      }
    }
  }

  // State attributes need the prop values that switch them on, so every render above counts.
  const missing = () =>
    contract.parts.flatMap((part) => {
      const seen = renders.flatMap((html) => elementsFor(html, part));
      return (part.initialAttributes ?? []).flatMap((attribute) => {
        if (attribute.source === "runtime") return [];
        const name = attribute.name === "className" ? "class" : attribute.name.toLowerCase();
        const present = seen.filter((element) => element.attributes.has(name));
        if (present.length === 0) {
          // Adapters pass this fact to the Runtime as a prop, so accepting and reading it is enough.
          if (
            target !== "astro" &&
            attributeIsAcceptedProp(contract, parts, part, attribute.name)
          ) {
            return [];
          }
          return [{ part, attribute, problem: `${attribute.source} attribute is never rendered` }];
        }
        const wanted = attribute.value;
        if (
          attribute.source === "constant" &&
          wanted !== undefined &&
          name !== "class" &&
          !name.startsWith("data-sw-") &&
          !present.some(
            (element) =>
              normalizeAttributeValue(element.attributes.get(name) ?? "") ===
              normalizeAttributeValue(wanted),
          )
        ) {
          return [{ part, attribute, problem: `is never "${wanted}"` }];
        }
        return [];
      });
    });

  // The Runtime writes many facts at mount, on all targets. A fact missing from server output is
  // therefore checked again once mounted.
  if (missing().length > 0) {
    const files = new Map(
      [...parts].map(([name, part]) => [
        part.component,
        path.relative(
          path.join(repositoryRoot, "packages", target, "src"),
          partFile(target, contract.component, name),
        ),
      ]),
    );
    const mounted = async (propsFor: (part: LoadedPart) => Record<string, unknown>) => {
      const page = await mountPage(target);
      try {
        const tree = buildTree(contract, parts, propsFor);
        if (target === "astro") {
          const html = await renderTree(target, tree);
          renders.push(await page.evaluate((item) => window.__mountAstroHtml!(item), html));
        } else {
          const spec = toMountSpec(target, tree, files);
          renders.push(await page.evaluate((item) => window.__renderEmission!(item), spec));
        }
      } catch {
        // A probe that throws in the browser adds no output.
      }
    };
    await mounted(baseProps);
    await mounted(openBaseProps);
    for (const propsFor of combined) await mounted(propsFor);
    for (const prop of contract.props) {
      if (missing().length === 0) break;
      if (prop.kind === "children" || prop.kind === "callback") continue;
      for (const partName of propTargets(contract, prop)) {
        const part = parts.get(partName);
        if (!part) continue;
        const name = targetPropName(target, prop.name, part.facts);
        const probe = probeValue(prop);
        for (const base of [baseProps, openBaseProps]) {
          await mounted((item) => ({ ...base(item), ...(item === part ? { [name]: probe } : {}) }));
        }
      }
    }
  }

  for (const { part, attribute, problem } of missing()) {
    if (!isExcepted(target, contract.component, part.name, attribute.name)) {
      gaps.push(`${part.name}: ${attribute.name} ${problem}`);
    }
  }
  return gaps;
}

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

describe("contract emission", () => {
  it("covers all 36 Primitive families", () => {
    expect(runtimeAdapterContracts).toHaveLength(36);
  });

  for (const target of EMISSION_TARGETS) {
    describe(target, () => {
      for (const contract of runtimeAdapterContracts as readonly RuntimeAdapterContract[]) {
        it(contract.component, async () => {
          const gaps = await checkFamily(target, contract);
          checkedFamilies += 1;
          if (gaps.length > 0) {
            throw new Error(`Contract facts not handled:\n${gaps.join("\n")}`);
          }
        });
      }
    });
  }

  afterAll(() => {
    // A filtered or failed run sees only some families, so only a full pass can judge this.
    if (checkedFamilies !== EMISSION_TARGETS.length * runtimeAdapterContracts.length) return;
    const unused = emissionExceptions
      .map((entry) => entry.name)
      .filter((name) => !usedExceptions.has(name));
    if (unused.length > 0) throw new Error(`Unused emission exceptions: ${unused.join(", ")}`);
  });
});
