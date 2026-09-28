import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const reactFrameworkOperations: FrameworkOperations = {
  stableValue: (expression) => `React.useRef(${expression}).current`,
  modelAuthority: "parent-prop",
  acceptedCell: (name, type, initial) =>
    `const [renderedState, setRendered${upper(name)}] = React.useState${type ? `<${type}>` : ""}(${initial});`,
  controllerCell: (type, initial) =>
    `const connection = React.useRef<${type}>({ accepted: ${initial}, initialized: false }).current;`,
  readInput: (name) => `inputs.current.${name}`,
  publishModel: () => "",
  renderAccepted: (name, value, inputName = name) =>
    `if (inputs.current.${inputName} === undefined) setRendered${upper(name)}(${value});`,
  proposal: (name, value, details, shape = "value-details") =>
    `inputs.current.${name}?.(${shape === "details" ? details : `${value}, ${details}`});`,
  completion: (name, details) => `inputs.current.${name}?.(${details});`,
  controlled: (name) => `inputs.current.${name} !== undefined`,
  untracked: (body) => body,
  observeModel: (name) => `useIsomorphicLayoutEffect(applyParentCommand, [${name}]);`,
};
