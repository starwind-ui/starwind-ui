export const toTitle = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const toDisplayTitle = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-\s]+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const toPascalCase = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");

export const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();

export const dedupe = <T>(values: readonly (T | undefined)[]): T[] => {
  const seen = new Set<T>();
  const deduped: T[] = [];

  for (const value of values) {
    if (value === undefined || seen.has(value)) {
      continue;
    }

    seen.add(value);
    deduped.push(value);
  }

  return deduped;
};

export const dedupeByName = <T extends { readonly name: string }>(values: readonly T[]): T[] => {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const value of values) {
    if (seen.has(value.name)) {
      continue;
    }

    seen.add(value.name);
    deduped.push(value);
  }

  return deduped;
};

export const formatError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export const formatNaturalList = (values: readonly string[]) => {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
};
