import type { ChartOperations } from "../../shared-recipes/chart/recipe.js";
import type { ChartSurfaceFacts } from "../../specialized-adapter-spec/chart-specialized-adapter-spec.js";
import { reactFrameworkOperations as fw } from "./recipe-framework-operations.js";

const upper = (name: string) => `${name[0]!.toUpperCase()}${name.slice(1)}`;
const cell = (name: string, initial: string) =>
  `const [${name}, set${upper(name)}] = React.useState<readonly string[] | undefined>(() => ${initial});`;

/**
 * React syntax for the chart recipe. State holds memory, values with dependencies are memoized,
 * callbacks read props through a ref, and layout effects run before paint.
 */
export function reactChartOperations({ visibility: v }: ChartSurfaceFacts): ChartOperations {
  return {
    fw,
    derive: (name, expression, { deps, type } = {}) =>
      deps
        ? `const ${name} = React.useMemo${type ? `<${type}>` : ""}(() => (${expression}), [${deps.join(", ")}]);`
        : `const ${name} = ${expression};`,
    read: (name) => name,
    prop: (name) => name,
    callback: (params, body, deps = []) =>
      `React.useCallback((${params}) => {\n${body}\n}, [${deps.join(", ")}])`,
    raw: (value) => value,
    snapshot: (value) => value,
    datum: "T",
    model: "visibleProp",
    mode: "latest.current.mode",
    ownership: "const [controlled] = React.useState(() => visibleProp !== undefined);",
    controlled: "controlled",
    acceptedCell: (initial) => cell("accepted", initial),
    accepted: "accepted",
    render: (value) => `setAccepted(${value});`,
    visibleName: "visible",
    memory: cell,
    write: (name, value) => `set${upper(name)}(${value});`,
    observeCommand: (body) => body("visibleProp"),
    proposal: (value, details) => `latest.current.${v.callbackProp}?.(${value}, ${details});`,
    controllerCell: `const controllerRef = React.useRef<ChartController<any, any, any, any> | null>(null);
const latest = React.useRef({ mode, ${v.callbackProp} });
useIsomorphicLayoutEffect(() => {
  latest.current = { mode, ${v.callbackProp} };
});`,
    controller: "controllerRef.current",
    tooltipCell: (entry) =>
      `const [tooltips, setTooltips] = React.useState<readonly ${entry}[]>(EMPTY);`,
    tooltips: "tooltips",
    firstTooltip: "tooltip",
    stateObject: (name, type, fields) =>
      `const ${name} = React.useMemo<${type}>(() => ({\n${fields.map(([key, value]) => (key === value ? key : `${key}: ${value}`)).join(",\n")}\n}), [${fields.map(([, value]) => /^[\w$]+/.exec(value)![0]).join(", ")}]);`,
    setTooltips: (next) => `setTooltips((list) => ${next("list")});`,
    specCell: "const [specParts, setSpecParts] = React.useState<readonly ChartSpecEntry[]>(EMPTY);",
    specParts: "specParts",
    setSpecParts: (next) => `setSpecParts((list) => ${next("list")});`,
    ariaLabel: "ariaLabel",
    seed: "seed",
    settled: "settled",
    listenerDefined: `${v.callbackProp} !== undefined`,
    visibilityNames: `${v.controlledProp}, ${v.defaultProp} and ${v.callbackProp}`,
    guard: (body) => body,
    element: "surfaceRef.current",
    applied: "applied.current",
    content: "content",
    bodyCell: "const [body, setBody] = React.useState<ChartTooltipBody | null>(null);",
    body: "body",
    setBody: (value) => `setBody(${value});`,
    restart: (key) =>
      `useIsomorphicLayoutEffect(() => {\nstart();\nreturn stop;\n// eslint-disable-next-line react-hooks/exhaustive-deps\n}, [${key}]);`,
    observe: "useIsomorphicLayoutEffect(() => sync(read()));",
  };
}
