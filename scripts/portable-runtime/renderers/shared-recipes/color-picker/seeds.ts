import type { AdapterColorPickerFacts } from "../../primitive-output-model/color-picker.js";

type SeedStorage =
  | { authority: "parent-prop"; seed: string }
  | { authority: "runtime-binding"; defaultValue: string; format: string };

/** Keep constructor ownership separate from the binding's retained reset defaults. */
export function colorPickerSeeds(
  facts: AdapterColorPickerFacts,
  input: (name: "value" | "defaultValue" | "format" | "alpha" | "allowEmpty") => string,
  storage: SeedStorage,
) {
  const value = input("value"),
    format = input("format"),
    fallback = input("defaultValue");
  const binding = storage.authority === "runtime-binding";
  const field = (name: string, expression: string) =>
    name === expression ? name : `${name}: ${expression}`;
  const object = (fields: string[]) => `{ ${fields.join(", ")} }`;
  return {
    defaultValue: binding
      ? `${fallback} !== undefined ? ${fallback} : ${value} !== undefined ? ${value} : ${facts.props.defaultValue.defaultValue}`
      : fallback,
    format: binding ? `${format} ?? ${facts.props.format.defaultValue}` : format,
    constructor: object([
      `...(${value} !== undefined ? { ${field("value", value)} } : {})`,
      field("defaultValue", binding ? storage.defaultValue : fallback),
      field("format", format),
    ]),
    projection: object([
      ...(binding
        ? [
            field("value", `${value} !== undefined ? ${value} : ${storage.defaultValue}`),
            field("format", storage.format),
          ]
        : [`...${storage.seed}`]),
      field("alpha", input("alpha")),
      field("allowEmpty", input("allowEmpty")),
    ]),
  };
}
