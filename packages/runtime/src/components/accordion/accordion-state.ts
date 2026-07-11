export type AccordionType = "single" | "multiple";
export type AccordionValue = string | string[] | null;

export type AccordionStateOptions = {
  type: AccordionType;
  collapsible: boolean;
};

export function normalizeAccordionValue(
  type: AccordionType,
  value: AccordionValue | undefined,
): AccordionValue {
  if (type === "multiple") {
    if (Array.isArray(value)) return unique(value);
    if (typeof value === "string") return [value];
    return [];
  }

  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isAccordionItemOpen(value: AccordionValue, itemValue: string): boolean {
  if (Array.isArray(value)) return value.includes(itemValue);
  return value === itemValue;
}

export function openAccordionItem(
  currentValue: AccordionValue,
  itemValue: string,
  options: AccordionStateOptions,
): AccordionValue {
  if (options.type === "multiple") {
    const values = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
    return unique([...values, itemValue]);
  }

  return itemValue;
}

export function closeAccordionItem(
  currentValue: AccordionValue,
  itemValue: string,
  options: AccordionStateOptions,
): AccordionValue {
  if (options.type === "multiple") {
    const values = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
    return values.filter((value) => value !== itemValue);
  }

  if (currentValue !== itemValue) return currentValue;
  return options.collapsible ? null : currentValue;
}

export function toggleAccordionItem(
  currentValue: AccordionValue,
  itemValue: string,
  options: AccordionStateOptions,
): AccordionValue {
  if (isAccordionItemOpen(currentValue, itemValue)) {
    return closeAccordionItem(currentValue, itemValue, options);
  }

  return openAccordionItem(currentValue, itemValue, options);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
