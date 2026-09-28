import type { PrimitiveRefreshContract } from "../../../contracts/primitive/types.js";
import { requireRefreshConnection } from "../../primitive-output-model/refresh-connection.js";

export function printAstroRefreshSetup(args: {
  factory: string;
  importSource: string;
  selectorAttribute: string;
  setupFunction: string;
  refresh: PrimitiveRefreshContract;
  parts: PrimitiveRefreshContract["parts"];
}): string {
  const refresh = requireRefreshConnection(args.refresh, args.parts);
  return `
<script>
  import { ${args.factory} } from "${args.importSource}";

  let knownRoots = new WeakSet<HTMLElement>();
  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {
    const initRoot = event?.type === "starwind:init" && event instanceof CustomEvent
      ? event.detail?.root : undefined;
    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)
      ? initRoot : document;
    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));
    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {
      candidates.unshift(scopedRoot as HTMLElement);
    }
    if (scopedRoot instanceof Element) {
      const owner = scopedRoot.parentElement?.closest<HTMLElement>(selector);
      if (owner && knownRoots.has(owner) && !candidates.includes(owner)) candidates.push(owner);
    }
    return candidates;
  };
  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>
    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;
  const ${args.setupFunction} = (event?: Event) => {
    getInitCandidates(event, "[${args.selectorAttribute}]").forEach((root) => {
      const instance = ${args.factory}(root);
      instance.${refresh.method}();
      knownRoots.add(root);
    });
  };
  document.addEventListener("astro:before-swap", () => { knownRoots = new WeakSet(); });
  ${args.setupFunction}();
  document.addEventListener("astro:after-swap", ${args.setupFunction});
  document.addEventListener("starwind:init", ${args.setupFunction});
</script>
`;
}
