import type {
  PrimitiveEventContract,
  PrimitivePartContract,
  PrimitivePropContract,
  PrimitiveSetterContract,
  PrimitiveStateModelContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";

export type PrimitivePropSetterContract = Extract<PrimitiveSetterContract, { prop: string }>;
export type PrimitivePropsSetterContract = Extract<
  PrimitiveSetterContract,
  { props: readonly [string, ...string[]] }
>;
export type PrimitiveStateSetterContract = Extract<PrimitiveSetterContract, { stateModel: string }>;

export function getPrimitivePart(
  contract: RuntimeAdapterContract,
  name: string,
): PrimitivePartContract {
  const part = contract.parts.find((entry) => entry.name === name);
  if (!part) {
    throw new Error(`${contract.displayName} runtime adapter contract is missing ${name} part.`);
  }

  return part;
}

export function getInitialAttributeName(
  contract: RuntimeAdapterContract,
  part: PrimitivePartContract,
  name: string,
): string {
  const attribute = part.initialAttributes?.find((entry) => entry.name === name);
  if (!attribute) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} on ${part.name}.`,
    );
  }

  return attribute.name;
}

export function getPartDiscoveryAttribute(
  contract: RuntimeAdapterContract,
  partName: string,
): string {
  return getPrimitivePart(contract, partName).discoveryAttribute;
}

export function getPartAttributeName(
  contract: RuntimeAdapterContract,
  partName: string,
  attributeName: string,
): string {
  const part = getPrimitivePart(contract, partName);
  return getInitialAttributeName(contract, part, attributeName);
}

export function createPrimitiveAttributeMap(
  contract: RuntimeAdapterContract,
  aliases: Record<string, { attribute?: string; part: string }> = {},
): Record<string, string> {
  return {
    ...Object.fromEntries(contract.parts.map((part) => [part.name, part.discoveryAttribute])),
    ...Object.fromEntries(
      Object.entries(aliases).map(([name, target]) => [
        name,
        target.attribute
          ? getPartAttributeName(contract, target.part, target.attribute)
          : getPartDiscoveryAttribute(contract, target.part),
      ]),
    ),
  };
}

export function getPropDefault(contract: RuntimeAdapterContract, name: string): string {
  const prop = contract.props.find((entry) => entry.name === name);
  if (!prop || !prop.defaultValue) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} defaultValue.`,
    );
  }

  return prop.defaultValue;
}

export function getPropType(contract: RuntimeAdapterContract, name: string): string {
  const prop = contract.props.find((entry) => entry.name === name);
  if (!prop) {
    throw new Error(`${contract.displayName} runtime adapter contract is missing ${name} prop.`);
  }

  return prop.type;
}

export function getPropName(contract: RuntimeAdapterContract, name: string): string {
  const prop = contract.props.find((entry) => entry.name === name);
  if (!prop) {
    throw new Error(`${contract.displayName} runtime adapter contract is missing ${name} prop.`);
  }

  return prop.name;
}

export function getPropNameForTarget(contract: RuntimeAdapterContract, target: string): string {
  const prop = contract.props.find((entry) => entry.targets?.includes(target));
  if (!prop) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${target} targeted prop.`,
    );
  }

  return prop.name;
}

export function getPropForTarget(
  contract: RuntimeAdapterContract,
  name: string,
  target: string,
): PrimitivePropContract {
  const prop = contract.props.find(
    (entry) => entry.name === name && entry.targets?.includes(target),
  );
  if (!prop) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} prop for ${target}.`,
    );
  }

  return prop;
}

export function getRuntimeOptionPropName(contract: RuntimeAdapterContract, name: string): string {
  if (!contract.runtime.optionProps?.includes(name)) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} runtime option.`,
    );
  }

  const prop = contract.props.find((entry) => entry.name === name);
  if (!prop) {
    throw new Error(`${contract.displayName} runtime adapter contract is missing ${name} prop.`);
  }

  return prop.name;
}

export function getSetterForProp(
  contract: RuntimeAdapterContract,
  name: string,
): PrimitivePropSetterContract {
  const setter = contract.setters?.find((entry) => entry.prop === name);
  if (!setter) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} prop setter.`,
    );
  }

  return setter as PrimitivePropSetterContract;
}

export function getSetterForState(
  contract: RuntimeAdapterContract,
  name: string,
): PrimitiveStateSetterContract {
  const setter = contract.setters?.find((entry) => entry.stateModel === name);
  if (!setter) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} state setter.`,
    );
  }

  return setter as PrimitiveStateSetterContract;
}

export function getSetterForProps(
  contract: RuntimeAdapterContract,
  props: readonly string[],
): PrimitivePropsSetterContract {
  const requestedProps = new Set(props);
  const setter = contract.setters?.find((entry): entry is PrimitivePropsSetterContract => {
    if (!("props" in entry) || entry.props === undefined) return false;

    const setterProps = new Set(entry.props);
    return (
      setterProps.size === requestedProps.size &&
      entry.props.length === setterProps.size &&
      entry.props.every((prop) => requestedProps.has(prop))
    );
  });
  if (!setter) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${props.join(", ")} props setter.`,
    );
  }

  return setter as PrimitivePropsSetterContract;
}

export function getStateModel(
  contract: RuntimeAdapterContract,
  name: string,
): PrimitiveStateModelContract {
  const model = contract.stateModels?.find((entry) => entry.name === name);
  if (!model) {
    throw new Error(
      `${contract.displayName} runtime adapter contract is missing ${name} state model.`,
    );
  }

  return model;
}

export function getEvent(contract: RuntimeAdapterContract, name: string): PrimitiveEventContract {
  const event = contract.events?.find((entry) => entry.name === name);
  if (!event) {
    throw new Error(`${contract.displayName} runtime adapter contract is missing ${name} event.`);
  }

  return event;
}

export function getRequiredValue(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

export function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options) return "{}";

  const entries = Object.entries(options).map(([key, value]) => {
    if (typeof value === "string") return `${key}: ${JSON.stringify(value)}`;
    return `${key}: ${String(value)}`;
  });

  return `{ ${entries.join(", ")} }`;
}
