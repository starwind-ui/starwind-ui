import { describe, expect, it } from "vitest";

import { assertEntryProgress } from "./smoke/shared/dialog-entry-animation.mjs";

describe("dialog entry animation smoke assertion", () => {
  it("orders sampled frames by their capture time", () => {
    const result = {
      presentationStates: [
        {
          backdropHidden: false,
          backdropState: "open",
          contentHidden: false,
          contentState: "open",
          rootState: "open",
          triggerExpanded: "true",
          triggerState: "open",
        },
      ],
      releaseTime: 10,
      samples: [
        createSample({
          animationName: "none",
          frameTime: 90,
          opacity: 0,
          sampledAt: 130,
          starting: true,
        }),
        createSample({
          animationName: "enter",
          animationState: "running",
          frameTime: 140,
          opacity: 0.5,
          sampledAt: 145,
          starting: false,
        }),
        createSample({
          animationName: "enter",
          frameTime: 350,
          opacity: 1,
          sampledAt: 355,
          starting: false,
        }),
      ],
      showModalReturnedAt: 120,
    };

    expect(() =>
      assertEntryProgress({
        expectedDuration: 100,
        gesture: "held-release",
        label: "test dialog",
        result,
      }),
    ).not.toThrow();
  });
});

function createSample({
  animationName,
  animationState = "finished",
  frameTime,
  opacity,
  sampledAt,
  starting,
}) {
  const animations =
    animationState === "running" ? [{ currentTime: 25, duration: 200, playState: "running" }] : [];
  const visual = {
    animationName,
    opacity,
    scale: "none",
    starting,
    transform: "none",
    translate: "none",
  };

  return {
    animations,
    backdrop: visual,
    content: visual,
    contentOpen: true,
    contentState: "open",
    now: frameTime,
    sampledAt,
  };
}
