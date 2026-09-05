import { access, readFile } from "node:fs/promises";

import { format } from "prettier";
import { describe, expect, it } from "vitest";

import {
  assertVueBetaReadinessCoverage,
  createVueBetaReadinessSources,
  renderVueBetaReadinessAudit,
  validateVueBetaReadiness,
  vueBetaEvidenceCategories,
  type VueBetaReadinessSources,
} from "../../renderers/framework-adapters/vue/beta-readiness-audit.js";

const reportPath = "docs/portable-runtime/diagnostics/vue-beta-readiness-audit.md";

describe("Vue beta readiness audit", () => {
  it("closes the exact Primitive, Theme, portable Styled, and Image inventory", () => {
    const audit = assertVueBetaReadinessCoverage();

    expect(audit.coverageResult).toBe("complete");
    expect(audit.blockers).toEqual([]);
    expect(audit.entries.filter(({ kind }) => kind === "runtime-primitive")).toHaveLength(36);
    expect(
      audit.entries.filter(({ kind }) => kind === "theme-facade").map(({ name }) => name),
    ).toEqual(["theme"]);
    expect(audit.entries.filter(({ kind }) => kind === "portable-styled")).toHaveLength(54);
    expect(
      audit.entries.filter(({ kind }) => kind === "astro-only-styled").map(({ name }) => name),
    ).toEqual(["image"]);
  });

  it("assigns every required evidence category to every public-beta entry", async () => {
    const audit = assertVueBetaReadinessCoverage();
    const paths = new Set<string>();

    for (const entry of audit.entries.filter(({ kind }) => kind !== "astro-only-styled")) {
      expect(Object.keys(entry.evidence).sort()).toEqual([...vueBetaEvidenceCategories].sort());
      for (const category of vueBetaEvidenceCategories) {
        const assignment = entry.evidence[category];
        expect(assignment.applicability, `${entry.kind} ${entry.name}: ${category}`).toBe(
          "required",
        );
        if (assignment.applicability === "required") {
          expect(assignment.sources, `${entry.kind} ${entry.name}: ${category}`).not.toEqual([]);
          assignment.sources.forEach((source) => paths.add(source));
        }
      }
    }

    await expect(Promise.all([...paths].map((source) => access(source)))).resolves.toHaveLength(
      paths.size,
    );
  });

  it("models Image as an explicit exclusion with non-applicable Vue evidence", () => {
    const image = assertVueBetaReadinessCoverage().entries.find(
      ({ kind }) => kind === "astro-only-styled",
    )!;

    expect(image.name).toBe("image");
    expect(image.evidence.inventory.applicability).toBe("excluded");
    expect(image.evidence.generation.applicability).toBe("excluded");
    for (const category of vueBetaEvidenceCategories.filter(
      (category) => category !== "inventory" && category !== "generation",
    )) {
      expect(image.evidence[category].applicability, category).toBe("not-applicable");
    }
  });

  it("blocks structural coverage when Theme CLI or clean-consumer evidence is missing", () => {
    const sources = createVueBetaReadinessSources();
    const theme = sources.matrixEntries.find(({ kind }) => kind === "theme-facade")!;
    const audit = validateVueBetaReadiness({
      ...sources,
      matrixEntries: sources.matrixEntries.map((entry) =>
        entry === theme
          ? {
              ...theme,
              evidence: {
                ...theme.evidence,
                cli: { applicability: "required", sources: [] },
                "clean-consumer": { applicability: "required", sources: [] },
              },
            }
          : entry,
      ),
    });

    expect(audit.coverageResult).toBe("blocking-failure");
    expect(audit.blockers).toContain("theme-facade theme missing evidence: cli, clean-consumer");
  });

  it("blocks structural coverage when durable offline evidence is invalid", () => {
    const sources = createVueBetaReadinessSources();
    const audit = validateVueBetaReadiness({
      ...sources,
      offlineValidation: {
        performance: { diagnostic: "performance fixture drift", result: "invalid" },
        size: { diagnostic: "size fixture drift", result: "invalid" },
      },
    });

    expect(audit.coverageResult).toBe("blocking-failure");
    expect(audit.blockers).toContain(
      "offline performance evidence invalid: performance fixture drift",
    );
    expect(audit.blockers).toContain("offline size evidence invalid: size fixture drift");
  });

  it("reports duplicate, missing, unowned, implicit, and evidence blockers by name", () => {
    const sources = createVueBetaReadinessSources();
    const firstPrimitive = sources.matrixEntries.find(({ kind }) => kind === "runtime-primitive")!;
    const firstStyled = sources.matrixEntries.find(({ kind }) => kind === "portable-styled")!;
    const evidenceGap = {
      ...firstPrimitive,
      evidence: {
        ...firstPrimitive.evidence,
        browser: { applicability: "required" as const, sources: [] },
      },
    };
    const drifted: VueBetaReadinessSources = {
      ...sources,
      explicitStyledExclusions: [],
      matrixEntries: [
        ...sources.matrixEntries.filter(
          (entry) => entry !== firstPrimitive && entry !== firstStyled,
        ),
        evidenceGap,
        evidenceGap,
        { ...firstStyled, name: "unowned-styled" },
      ],
      vueRuntimePrimitives: sources.vueRuntimePrimitives.slice(1),
      vueStyledRoots: [...sources.vueStyledRoots, "unowned-styled"],
    };

    const audit = validateVueBetaReadiness(drifted);
    const message = audit.blockers.join("\n");

    expect(audit.coverageResult).toBe("blocking-failure");
    expect(message).toContain(
      `Vue Runtime Primitive ownership missing: ${sources.vueRuntimePrimitives[0]}`,
    );
    expect(message).toContain(
      `runtime-primitive matrix ownership duplicate: ${firstPrimitive.name}`,
    );
    expect(message).toContain(`portable-styled matrix ownership missing: ${firstStyled.name}`);
    expect(message).toContain("Vue portable Styled ownership unowned: unowned-styled");
    expect(message).toContain("Astro-only Styled exclusions: expected 1; received 0");
    expect(message).toContain(
      `${firstPrimitive.kind} ${firstPrimitive.name} missing evidence: browser`,
    );
  });

  it("keeps the checked-in diagnostic byte-equal to the generated audit", async () => {
    await expect(readFile(reportPath, "utf8")).resolves.toBe(
      await format(renderVueBetaReadinessAudit(), { parser: "markdown" }),
    );
  });
});
