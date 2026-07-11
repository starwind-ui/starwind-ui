let generatedId = 0;

export function assertHTMLElement(value: unknown, name: string): asserts value is HTMLElement {
  if (!(value instanceof HTMLElement)) {
    throw new TypeError(`${name} must be an HTMLElement.`);
  }
}

export function ensureId(element: HTMLElement, prefix: string): string {
  if (element.id) return element.id;

  generatedId += 1;
  element.id = `${prefix}-${generatedId}`;
  return element.id;
}

export function readBooleanAttribute(
  element: HTMLElement,
  name: string,
  fallback = false,
): boolean {
  if (!element.hasAttribute(name)) return fallback;

  const value = element.getAttribute(name);
  if (value === null || value === "") return true;

  if (value.toLowerCase() === "false") return false;
  if (value.toLowerCase() === "true") return true;

  return true;
}

export function readNumberAttribute(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(element.getAttribute(name) ?? "");
  return Number.isFinite(value) ? value : fallback;
}

export function readStringOrStringArrayAttribute(
  element: HTMLElement,
  name: string,
): string | string[] | undefined {
  const value = element.getAttribute(name);
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return value;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    return value;
  }

  return value;
}

export function setBooleanAttribute(element: HTMLElement, name: string, value: boolean): void {
  if (value) {
    if (element.getAttribute(name) !== "") {
      element.setAttribute(name, "");
    }
  } else if (element.hasAttribute(name)) {
    element.removeAttribute(name);
  }
}

const AS_CHILD_ATTRIBUTE = "data-as-child";
const AS_CHILD_IGNORED_TAG_NAMES = new Set(["SCRIPT", "STYLE", "TEMPLATE"]);

export function resolveAsChildControl(element: HTMLElement): HTMLElement {
  if (!element.hasAttribute(AS_CHILD_ATTRIBUTE)) return element;
  const child = getAsChildControlElement(element);
  if (!child) return element;

  transferAsChildAttributes(element, child);
  return child;
}

export function getAsChildControlElement(element: HTMLElement): HTMLElement | null {
  return (
    Array.from(element.children).find(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && !AS_CHILD_IGNORED_TAG_NAMES.has(child.tagName),
    ) ?? null
  );
}

export function uniqueElements<T extends Element>(elements: T[]): T[] {
  return Array.from(new Set(elements));
}

function transferAsChildAttributes(wrapper: HTMLElement, child: HTMLElement): void {
  transferClassAttribute(wrapper, child);
  transferStyleAttribute(wrapper, child);

  Array.from(wrapper.attributes).forEach((attribute) => {
    if (
      attribute.name === AS_CHILD_ATTRIBUTE ||
      attribute.name === "class" ||
      attribute.name === "style"
    ) {
      return;
    }

    if (!child.hasAttribute(attribute.name)) {
      child.setAttribute(attribute.name, attribute.value);
    }

    wrapper.removeAttribute(attribute.name);
  });

  wrapper.removeAttribute(AS_CHILD_ATTRIBUTE);
  wrapper.style.display = "contents";
}

function transferClassAttribute(wrapper: HTMLElement, child: HTMLElement): void {
  wrapper.classList.forEach((className) => {
    child.classList.add(className);
  });
  wrapper.removeAttribute("class");
}

function transferStyleAttribute(wrapper: HTMLElement, child: HTMLElement): void {
  Array.from(wrapper.style).forEach((property) => {
    if (child.style.getPropertyValue(property)) return;

    child.style.setProperty(
      property,
      wrapper.style.getPropertyValue(property),
      wrapper.style.getPropertyPriority(property),
    );
  });
  wrapper.removeAttribute("style");
}
