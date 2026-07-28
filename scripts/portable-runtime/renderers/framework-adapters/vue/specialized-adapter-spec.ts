import type { AdapterControlledValuePresenceFacts, AdapterOutputModel } from "../types.js";
import { printVueControlledValuePresenceContext } from "./controlled-value-presence.js";
import { printVueRepeatedDisclosureContext } from "./repeated-disclosure.js";

export function projectVueSpecializedAdapterOutputModel(
  model: AdapterOutputModel,
): AdapterOutputModel {
  const controlledValuePresence = model.files.find(
    (file) =>
      file.kind === "component" && file.component.family?.kind === "controlled-value-presence",
  );
  if (
    controlledValuePresence?.kind === "component" &&
    controlledValuePresence.component.family?.kind === "controlled-value-presence"
  ) {
    const facts: AdapterControlledValuePresenceFacts =
      controlledValuePresence.component.family.facts;
    return {
      files: [
        ...model.files.slice(0, -1),
        {
          body: { code: printVueControlledValuePresenceContext(facts) },
          family: { facts, kind: "controlled-value-presence" },
          imports: [],
          kind: "helper",
          name: facts.context.componentName,
          path: `${facts.exports.namespace.toLowerCase()}/${facts.context.componentName}.ts`,
        },
        ...model.files.slice(-1),
      ],
    };
  }

  const repeatedDisclosure = model.files.find(
    (file) => file.kind === "component" && file.component.family?.kind === "repeated-disclosure",
  );
  if (
    !repeatedDisclosure ||
    repeatedDisclosure.kind !== "component" ||
    repeatedDisclosure.component.family?.kind !== "repeated-disclosure"
  ) {
    return model;
  }
  const facts = repeatedDisclosure.component.family.facts;
  const contextName = `${facts.displayName}ItemContext`;
  return {
    files: [
      ...model.files,
      {
        body: { code: printVueRepeatedDisclosureContext(facts) },
        imports: [],
        kind: "helper",
        name: contextName,
        path: `${facts.exports.namespace.toLowerCase()}/${contextName}.ts`,
      },
    ],
  };
}
