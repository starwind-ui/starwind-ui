import assert from "node:assert/strict";

// Page artifacts are shared only when all inputs to compilation are identical. Case IDs
// continue to identify independent assertions, screenshots, reports and CI expectations.
export function resolveFixtureRoutes(allCases, selected) {
  const byId = new Map(allCases.map((item) => [item.id, item]));
  assert.equal(byId.size, allCases.length, "Duplicate fixture case ID");
  const pages = new Map();
  for (const item of selected) {
    for (const [target, fixture] of Object.entries(item.fixtures)) {
      const source = fixture.buildAs === undefined ? item : byId.get(fixture.buildAs);
      assert(source, `Unknown source case for ${item.id}/${target}: ${fixture.buildAs}`);
      const original = source.fixtures[target];
      assert(original, `Source case ${source.id} does not support ${target}`);
      if (fixture.buildAs !== undefined) {
        assert(
          !original.buildAs,
          `Fixture route chains and cycles are unsupported: ${item.id}/${target}`,
        );
        assert.equal(source.row, item.row, `Cannot borrow a fixture from another row: ${item.id}`);
        const { assertions: _a, buildAs: _from, ...input } = fixture;
        const { assertions: _b, ...originalInput } = original;
        assert.deepEqual(
          input,
          originalInput,
          `Different build inputs: ${item.id}/${target} -> ${source.id}`,
        );
      }
      let existing = pages.get(source.id);
      if (!existing) {
        existing = { ...source, fixtures: {} };
        pages.set(source.id, existing);
      }
      existing.fixtures[target] = original;
    }
  }
  return [...pages.values()];
}
