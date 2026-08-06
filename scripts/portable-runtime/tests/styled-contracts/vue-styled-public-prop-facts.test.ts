import { describe, expect, it } from "vitest";

import { itemStyledContract } from "../../contracts/styled/components/item.js";
import { videoStyledContract } from "../../contracts/styled/components/video.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

describe("Vue Styled public prop facts", () => {
  it("keeps Item's dynamic tag type in its source-owned Vue prop field", () => {
    const item = itemStyledContract.components.find(({ exportName }) => exportName === "Item");

    expect(item?.props?.fields).toContainEqual({
      frameworks: ["vue"],
      name: "as",
      optional: true,
      type: "string",
    });

    const projectedItem = projectStyledOutputComponentGroup(itemStyledContract).components.find(
      ({ exportName }) => exportName === "Item",
    );
    expect(projectedItem?.props?.fields).toContainEqual({
      name: "as",
      optional: true,
      targetScopes: ["vue"],
      type: "string",
    });
  });

  it("keeps Video's iframe source document type in its source-owned Vue prop field", () => {
    const video = videoStyledContract.components.find(({ exportName }) => exportName === "Video");

    expect(video?.props?.fields).toContainEqual({
      frameworks: ["vue"],
      name: "srcdoc",
      optional: true,
      type: "string",
    });

    const projectedVideo = projectStyledOutputComponentGroup(videoStyledContract).components.find(
      ({ exportName }) => exportName === "Video",
    );
    expect(projectedVideo?.props?.fields).toContainEqual({
      name: "srcdoc",
      optional: true,
      targetScopes: ["vue"],
      type: "string",
    });
  });
});
