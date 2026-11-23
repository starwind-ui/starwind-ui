import assert from "node:assert/strict";
import { test } from "vitest";
import { resolveFixtureRoutes } from "./fixture-routes.mjs";

const source = {
  id: "base",
  row: "select",
  fixtures: { astro: { source: "<Select/>", exports: ["Select"], assertions: ["identity"] } },
};
const audit = {
  id: "audit",
  row: source.row,
  fixtures: { astro: { ...source.fixtures.astro, buildAs: "base", assertions: ["geometry"] } },
};
test("focused audit and combined inventory compile the same original artifact once", () => {
  for (const selection of [[audit], [source, audit], [audit, source]]) {
    assert.deepEqual(resolveFixtureRoutes([source, audit], selection), [source]);
    assert.deepEqual(audit.fixtures.astro.assertions, ["geometry"]);
  }
});
test("a route cannot change the compiled payload or escape its owner", () => {
  for (const changes of [
    { ssr: true },
    { source: "<span/>" },
    { exports: [] },
    { buildAs: "absent" },
    { buildAs: "audit" },
  ]) {
    const changed = { ...audit, fixtures: { astro: { ...audit.fixtures.astro, ...changes } } };
    assert.throws(() => resolveFixtureRoutes([source, changed], [changed]));
  }
  const foreign = { ...audit, row: "tabs" };
  assert.throws(() => resolveFixtureRoutes([source, foreign], [foreign]), /another row/);
  const wrong = { ...audit, fixtures: { react: audit.fixtures.astro } };
  assert.throws(() => resolveFixtureRoutes([source, wrong], [wrong]), /does not support/);
  const nested = {
    ...audit,
    id: "nested",
    fixtures: { astro: { ...audit.fixtures.astro, buildAs: "audit" } },
  };
  assert.throws(() => resolveFixtureRoutes([source, audit, nested], [nested]), /chains and cycles/);
  assert.throws(() => resolveFixtureRoutes([source, source], []), /Duplicate/);
});
