import { shared } from "./shared";

export type Direction = "ltr" | "rtl";
export type SpatialAxis = "horizontal" | "vertical";

export type DirectionSubscription = {
  /** Read computed CSS at the point of interaction. This also publishes a changed value. */
  get: () => Direction;
  /** Re-read after a CSS-only change or an explicit geometry refresh. */
  refresh: () => Direction;
  destroy: () => void;
};

/**
 * Apps dispatch this event on a document, or as a bubbling event on an element, after they change
 * `dir`. Runtime then re-reads every direction owner in that document.
 */
export const DIRECTION_CHANGE_EVENT = "starwind:direction-change";

// A projection writes `dir` and returns true when it wrote. Another copy only calls these
// closures. The type stays inline so the build keeps its property names across Runtime copies.
const services = shared<
  WeakMap<
    Document,
    {
      projections: Set<() => boolean>;
      owners: Set<() => unknown>;
      handle: (event: Event) => void;
    }
  >
>("direction-change");

/** The browser resolves inherited and `auto` direction, including CSS overrides. */
export function readDirection(element: Element): Direction {
  const value = element.ownerDocument.defaultView?.getComputedStyle(element).direction;
  return value === "rtl" ? "rtl" : "ltr";
}

/** Convert a physical displacement to a logical displacement along one axis. */
export function spatialDelta(delta: number, direction: Direction, axis: SpatialAxis): number {
  return axis === "horizontal" && direction === "rtl" ? -delta : delta;
}

/** Convert a physical [0, 1] position to its logical position along one axis. */
export function spatialRatio(ratio: number, direction: Direction, axis: SpatialAxis): number {
  return axis === "horizontal" && direction === "rtl" ? 1 - ratio : ratio;
}

/**
 * Run `callback` when the document receives `starwind:direction-change`. Projection callbacks run
 * first and repeat until none writes `dir`. Other callbacks then run once. Returns the cleanup.
 */
export function onDirectionChange(
  document: Document,
  callback: () => unknown,
  projection = false,
): () => void {
  let service = services.get(document);
  if (!service) {
    const created = {
      projections: new Set<() => boolean>(),
      owners: new Set<() => unknown>(),
      handle: () => {
        // Each pass reads computed direction and writes only a changed value, so the bound holds.
        for (let pass = 0; pass <= created.projections.size; pass++) {
          let wrote = false;
          for (const project of [...created.projections]) if (project()) wrote = true;
          if (!wrote) break;
        }
        for (const owner of [...created.owners]) owner();
      },
    };
    service = created;
    services.set(document, service);
    document.addEventListener(DIRECTION_CHANGE_EVENT, service.handle);
  }
  const target = projection ? service.projections : service.owners;
  target.add(callback as () => boolean);
  return () => {
    const current = services.get(document);
    if (!current) return;
    current.projections.delete(callback as () => boolean);
    current.owners.delete(callback);
    if (current.projections.size > 0 || current.owners.size > 0) return;
    document.removeEventListener(DIRECTION_CHANGE_EVENT, current.handle);
    services.delete(document);
  };
}

/**
 * Subscribe to an element's effective direction without changing its authored DOM. Runtime reads
 * direction at `get()`, at `refresh()`, and when the document receives `starwind:direction-change`.
 * A projection subscriber writes `dir` in its listener and runs before other subscribers.
 */
export function subscribeDirection(
  element: Element,
  listener: (direction: Direction) => void,
  options: { projection?: boolean; read?: () => Direction } = {},
): DirectionSubscription {
  const read = options.read ?? (() => readDirection(element));
  let value = read();
  let active = true;
  let document = element.ownerDocument;
  const publish = (): boolean => {
    if (!active) return false;
    // An adopted element moves to its new document at the next read.
    if (element.ownerDocument !== document) {
      release();
      document = element.ownerDocument;
      release = onDirectionChange(document, publish, options.projection);
    }
    const attribute = element.getAttribute("dir");
    const next = read();
    if (next !== value) {
      value = next;
      listener(next);
    }
    return element.getAttribute("dir") !== attribute;
  };
  let release = onDirectionChange(document, publish, options.projection);
  const get = (): Direction => {
    publish();
    return value;
  };
  return {
    get,
    refresh: get,
    destroy: () => {
      if (!active) return;
      active = false;
      release();
    },
  };
}
