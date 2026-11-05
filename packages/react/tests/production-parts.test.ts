import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  applyPassivePartFactory,
  BEHAVIORAL_DISPLAY_NAMES,
  guardDisplayNames,
  toProductionPart,
} from "../build/production-parts";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");
const sourceFiles = readdirSync(sourceRoot, { recursive: true, encoding: "utf8" })
  .filter((file) => /\.tsx?$/.test(file))
  .map((file) => ({ file, source: readFileSync(path.join(sourceRoot, file), "utf8") }));

const passiveSource = `"use client";

import * as React from "react";

export type TitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  function Title(props, forwardedRef) {
    return <h2 data-sw-title aria-hidden="true" ref={forwardedRef} {...props} />;
  },
);

Title.displayName = "Dialog.Title";

export default Title;
`;

describe("production Primitive parts", () => {
  it("guards a display name and leaves the statement unchanged inside the guard", () => {
    expect(guardDisplayNames('Title.displayName = "Dialog.Title";')).toBe(
      'if (process.env.NODE_ENV !== "production") Title.displayName = "Dialog.Title";',
    );
  });

  it("keeps each display name that a component reads for behavior", () => {
    const comparedNames = new Set(
      sourceFiles.flatMap(({ source }) =>
        [...source.matchAll(/displayName === "([^"]+\.[^"]+)"/g)].map((match) => match[1]),
      ),
    );

    expect([...comparedNames].sort()).toEqual([...BEHAVIORAL_DISPLAY_NAMES].sort());
    for (const name of BEHAVIORAL_DISPLAY_NAMES) {
      const statement = `Part.displayName = "${name}";`;
      expect(guardDisplayNames(statement)).toBe(statement);
    }
  });

  it("keeps the client directive first and the attribute order in a factory call", () => {
    const output = toProductionPart(passiveSource, "/factory.tsx");

    expect(output.startsWith('"use client";')).toBe(true);
    expect(output).toContain(
      'const Title = /* @__PURE__ */ createPassivePart("h2", { "data-sw-title": true, "aria-hidden": "true" });',
    );
    expect(output).not.toContain("forwardRef");
  });

  it.each([
    ["a component tag", "<Slot data-sw-title ref={forwardedRef} {...props} />"],
    ["props before the ref", "<h2 data-sw-title {...props} ref={forwardedRef} />"],
    ["attributes after props", "<h2 ref={forwardedRef} {...props} data-sw-title />"],
    ["an expression attribute", "<h2 data-sw-title={state} ref={forwardedRef} {...props} />"],
  ])("leaves a part with %s as written", (_name, element) => {
    const source = passiveSource.replace(/<h2[^\n]*\/>/, element);

    expect(applyPassivePartFactory(source, "/factory.tsx")).toBe(source);
  });

  it("recognizes the passive parts in generated source", () => {
    const converted = sourceFiles.filter(
      ({ source }) => applyPassivePartFactory(source, "/factory.tsx") !== source,
    );

    expect(converted.length).toBeGreaterThanOrEqual(60);
    for (const { source } of converted) {
      expect(source).not.toMatch(/asChild|useRef|useEffect|useState|useContext/);
    }
  });
});
