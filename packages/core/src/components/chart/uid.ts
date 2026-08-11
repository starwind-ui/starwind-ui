// Monotonic id source for per-instance-unique SVG ids such as gradients and clip paths.
// This must live in an imported module: a `let` in .astro frontmatter is emitted
// inside the per-instance render function and resets to 0 every instance.
let counter = 0;

export function nextUid(prefix = "sw"): string {
  return prefix + "-" + counter++;
}
