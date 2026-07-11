import type { AdapterBooleanFormControlFacts } from "../types.js";

export function renderVisuallyHiddenStyle(): string {
  return `const visuallyHiddenStyle = {\n  border: 0,\n  clip: "rect(0 0 0 0)",\n  height: "1px",\n  margin: "-1px",\n  overflow: "hidden",\n  position: "absolute",\n  whiteSpace: "nowrap",\n  width: "1px",\n} satisfies React.CSSProperties;`;
}

export function renderReactBooleanMutationSync(
  facts: AdapterBooleanFormControlFacts,
  stateProp: string,
  uncontrolledState: string,
  setUncontrolledState: string,
): string {
  return `    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root || typeof MutationObserver === "undefined") return;\n\n      const syncUncontrolled${facts.state.pascalName} = () => {\n        if (${stateProp}Ref.current !== undefined) return;\n\n        const next${facts.state.pascalName} = root.getAttribute("${facts.attrs.ariaState}") === "true";\n        if (${uncontrolledState}Ref.current !== next${facts.state.pascalName}) {\n          ${setUncontrolledState}(next${facts.state.pascalName});\n        }\n      };\n      const observer = new MutationObserver(syncUncontrolled${facts.state.pascalName});\n      observer.observe(root, { attributes: true, attributeFilter: ["${facts.attrs.ariaState}"] });\n      syncUncontrolled${facts.state.pascalName}();\n\n      return () => {\n        observer.disconnect();\n      };\n    }, []);`;
}

export function renderReactBooleanDisabledSetter(
  facts: AdapterBooleanFormControlFacts,
  disabledValue: string,
): string {
  return `    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      instance.${facts.setters.disabled.method}(${disabledValue});\n    }, [${disabledValue}]);`;
}

export function renderReactBooleanControlledSetters(
  facts: AdapterBooleanFormControlFacts,
  stateProp: string,
  groupState: string,
  disabledValue: string,
  setterOptions: string,
): string {
  return `    useIsomorphicLayoutEffect(() => {\n      if (${stateProp} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${stateProp}) return;\n\n      instance.${facts.setters.state.method}(${stateProp}, ${setterOptions});\n    }, [${stateProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${groupState} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.getter}() === ${groupState}) return;\n\n      instance.${facts.setters.state.method}(${groupState}, ${setterOptions});\n    }, [${groupState}]);\n\n${renderReactBooleanDisabledSetter(facts, disabledValue)}`;
}

export function renderReactBooleanIndeterminateControlledSetters(
  facts: AdapterBooleanFormControlFacts,
  stateProp: string,
  groupState: string,
  indeterminateProp: string,
  disabledValue: string,
  setterOptions: string,
): string {
  const indeterminateSetter = requireSetter(facts.setters.indeterminate, "indeterminate");
  const nextControlledState = `nextControlled${facts.state.pascalName}`;

  return `    useIsomorphicLayoutEffect(() => {\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      const ${nextControlledState} = ${stateProp} ?? ${groupState};\n      if (${nextControlledState} !== undefined && instance.${facts.state.getter}() !== ${nextControlledState}) {\n        instance.${facts.setters.state.method}(${nextControlledState}, ${setterOptions});\n      }\n\n      instance.${indeterminateSetter.method}(${indeterminateProp}, ${formatOptions(indeterminateSetter.options)});\n      setRenderedIndeterminate(${indeterminateProp});\n    }, [${stateProp}, ${groupState}, ${indeterminateProp}]);\n\n${renderReactBooleanDisabledSetter(facts, disabledValue)}`;
}

export function requireGroupFacts(
  facts: AdapterBooleanFormControlFacts,
): NonNullable<AdapterBooleanFormControlFacts["group"]> {
  if (!facts.group) {
    throw new Error("Boolean form-control facts are missing group context.");
  }

  return facts.group;
}

export function assertBooleanFormControlBehavior(
  facts: AdapterBooleanFormControlFacts,
  expected: Partial<AdapterBooleanFormControlFacts["behavior"]>,
): void {
  for (const [key, expectedValue] of Object.entries(expected) as [
    keyof AdapterBooleanFormControlFacts["behavior"],
    AdapterBooleanFormControlFacts["behavior"][keyof AdapterBooleanFormControlFacts["behavior"]],
  ][]) {
    if (facts.behavior[key] !== expectedValue) {
      throw new Error(
        `Boolean form-control facts for ${facts.displayName} have unsupported behavior.${key}: expected ${String(
          expectedValue,
        )}, received ${String(facts.behavior[key])}.`,
      );
    }
  }
}

function requireSetter<T>(setter: T | undefined, label: string): T {
  if (!setter) {
    throw new Error(`Boolean form-control facts are missing ${label} setter.`);
  }

  return setter;
}

function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options || Object.keys(options).length === 0) {
    return "{}";
  }

  const entries = Object.entries(options).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

  return `{ ${entries.join(", ")} }`;
}
