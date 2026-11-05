// The page side of the conformance suite. Each target's fixture reports through these helpers, so
// one scenario can read the same log, cancel flags, and parent controls on all four targets.

export type EventEntry = {
  instance: string;
  event: string;
  value: unknown;
  reason?: string;
  previous?: unknown;
  fields: string[];
};

type ParentControl = { write(value: unknown): void; read(): unknown };

type ConformanceWindow = {
  events: EventEntry[];
  cancel: Record<string, boolean>;
  refuse: Record<string, boolean>;
  parents: Record<string, ParentControl>;
  submits: Record<string, [string, string][]>;
  ready: boolean;
};

/** One composition node that the emission check asks a target to mount in the browser. */
export type EmissionSpec = {
  file: string;
  props: Record<string, unknown>;
  children: EmissionSpec[];
};

declare global {
  interface Window {
    __cf: ConformanceWindow;
    __renderEmission?: (spec: EmissionSpec) => Promise<string>;
    __mountAstroHtml?: (html: string) => Promise<string>;
  }
}

/** Waits for framework effects and Runtime connection to finish. */
export function settleFrames(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
  );
}

function state(): ConformanceWindow {
  window.__cf ??= { events: [], cancel: {}, refuse: {}, parents: {}, submits: {}, ready: false };
  return window.__cf;
}

const PREVIOUS_FIELDS = ["previousValue", "previousOpen", "previousInputValue", "previousChecked"];

/** Records one public change event, then cancels it when the scenario asked for that. */
export function record(instance: string, event: string, value: unknown, details?: unknown): void {
  const cf = state();
  const detail = (details ?? {}) as Record<string, unknown> & { cancel?: () => void };
  const previousField = PREVIOUS_FIELDS.find((field) => field in detail);
  cf.events.push({
    instance,
    event,
    value,
    reason: typeof detail.reason === "string" ? detail.reason : undefined,
    previous: previousField ? detail[previousField] : undefined,
    fields: Object.keys(detail).sort(),
  });
  if (cf.cancel[`${instance}:${event}`]) detail.cancel?.();
}

/** Records a framework model write, such as Vue `update:open`, apart from change events. */
export function recordModel(instance: string, model: string, value: unknown): void {
  state().events.push({ instance, event: `model:${model}`, value, fields: [] });
}

/** True while the scenario asks the parent to refuse the proposed change. */
export function refused(instance: string): boolean {
  return Boolean(state().refuse[instance]);
}

/** Lets a scenario write to, and read from, the state a fixture parent holds. */
export function parent(instance: string, control: ParentControl): void {
  state().parents[instance] = control;
}

/** Astro has no callback props, so its fixtures read the same facts from Runtime DOM events. */
export function listen(
  selector: string,
  instance: string,
  events: Record<string, { event: string; value: string }>,
): void {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Conformance fixture is missing ${selector}.`);
  for (const [domEvent, { event, value }] of Object.entries(events)) {
    element.addEventListener(domEvent, (domEventObject) => {
      const detail = (domEventObject as CustomEvent).detail ?? {};
      record(instance, event, detail[value], detail);
    });
  }
}

/** Marks the page ready after load and after each framework's first effects. */
export function markReady(): void {
  const finish = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        state().ready = true;
      }),
    );
  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish, { once: true });
}

/** Records the entries of each native submit, and stops the navigation. */
export function captureSubmits(): void {
  document.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    state().submits[form.id] = [...new FormData(form).entries()].map(([name, value]) => [
      name,
      String(value),
    ]);
  });
}
