/**
 * Returns the WeakMap for `key` that every Runtime copy on the page shares. The first call creates
 * it. Use it for per-element controller registries and other per-document state.
 *
 * A bundler can load two copies of the Runtime on one page. For example, `astro dev` serves adapter
 * scripts from `node_modules` and serves project imports from the Vite dependency cache. State that
 * must be unique per document lives on `globalThis` under a `Symbol.for` key, so each copy finds the
 * same object.
 *
 * The number in the key is the shared-state protocol. Copies with the same number share state.
 * Increase it when the shape of a shared value changes, or when a controller method that another
 * component calls changes. Copies with different numbers then keep separate state.
 */
/* @__NO_SIDE_EFFECTS__ */
export function shared<T extends WeakMap<object, unknown>>(key: string): T {
  // biome-ignore lint/suspicious/noAssignInExpressions: the expression form is the smallest output in every entry.
  return ((globalThis as unknown as Record<symbol, T>)[Symbol.for("starwind/1/" + key)] ??=
    new WeakMap() as T);
}
