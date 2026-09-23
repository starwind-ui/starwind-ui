import assert from "node:assert/strict";
import path from "node:path";

/** A duplicate name would silently replace a required consumer in a spread merge. */
export function combineNegativeFixtures(
  ...groups: Readonly<Record<string, string>>[]
): Record<string, string> {
  const fixtures: Record<string, string> = {};
  for (const group of groups)
    for (const [name, source] of Object.entries(group)) {
      assert.ok(!(name in fixtures), `Duplicate negative fixture: ${name}`);
      fixtures[name] = source;
    }
  return fixtures;
}

/** Match every rejection to its owned file and fail on infrastructure or unrelated diagnostics. */
export function verifyNamedRejections(
  result: { code: number; output: string },
  root: string,
  fixtures: Readonly<Record<string, { diagnostic: RegExp }>>,
): string[] {
  assert.equal(result.code, 1, result.output);
  const diagnostics = result.output
    .split("\n")
    .filter((line) => /^\d+ \{/.test(line))
    .map(
      (line) =>
        JSON.parse(line.slice(line.indexOf("{"))) as {
          filename: string;
          type: string;
          message: string;
        },
    );
  const expected = new Map(
    Object.entries(fixtures).map(([name, fixture]) => [path.resolve(root, name), fixture]),
  );
  const rejected = new Set<string>();
  for (const entry of diagnostics) {
    const file = path.resolve(root, entry.filename);
    const fixture = expected.get(file);
    assert.ok(fixture && entry.type === "ERROR", `Unrelated diagnostic: ${JSON.stringify(entry)}`);
    assert.doesNotMatch(
      entry.message,
      /Cannot find module|Cannot find name|Could not find a declaration|Failed to load|Unexpected token|Cannot use namespace/,
      `Invalid fixture infrastructure: ${JSON.stringify(entry)}`,
    );
    assert.match(
      entry.message,
      fixture.diagnostic,
      `Unexpected rejection: ${JSON.stringify(entry)}`,
    );
    rejected.add(file);
  }
  assert.deepEqual([...rejected].sort(), [...expected.keys()].sort(), "Missing expected rejection");
  return Object.keys(fixtures).sort();
}

/** Current invalid Styled APIs reject at assignability, property or binding boundaries. */
export const STYLED_REJECTION =
  /not assignable|does not exist|Object literal may only specify|Cannot bind|Cannot use|not a valid binding|only be used with|Expected \d+ arguments|not callable|must be|can only|is missing/;
