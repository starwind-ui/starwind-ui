import { describe, expect, it } from "vitest";

import {
  attachFormValueRevision,
  getFormValueRevision,
} from "../../src/internal/form-value-revision";

describe("form value revisions", () => {
  it("reuses an originating event revision across derived notifications", () => {
    const nativeEvent = new Event("input");
    const valueChangeDetails = {};
    const groupDetails = {};

    const revision = attachFormValueRevision(valueChangeDetails, nativeEvent);
    attachFormValueRevision(groupDetails, valueChangeDetails);

    expect(getFormValueRevision(nativeEvent)).toBe(revision);
    expect(getFormValueRevision(valueChangeDetails)).toBe(revision);
    expect(getFormValueRevision(groupDetails)).toBe(revision);
  });

  it("creates a fresh revision for every uncorrelated proposal", () => {
    const firstDetails = {};
    const secondDetails = {};

    const firstRevision = attachFormValueRevision(firstDetails);
    const secondRevision = attachFormValueRevision(secondDetails);

    expect(firstRevision).not.toBe(secondRevision);
  });

  it("reads revision identity through a custom notification detail", () => {
    const details = {};
    const revision = attachFormValueRevision(details);
    const notification = new CustomEvent("starwind:value-change", { detail: details });

    expect(getFormValueRevision(notification)).toBe(revision);
  });
});
