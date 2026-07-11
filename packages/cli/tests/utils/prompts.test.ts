import * as clackPrompts from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { selectComponents } from "../../src/utils/prompts.js";
import * as registry from "../../src/utils/registry.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/registry.js");

const mockMultiselect = vi.mocked(clackPrompts.multiselect);
const mockGetAllComponents = vi.mocked(registry.getAllComponents);

describe("prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("selectComponents", () => {
    it("returns selected components from the default Runtime registry", async () => {
      const mockComponents = [
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
        { name: "input", version: "1.0.0", dependencies: [], type: "component" as const },
      ];

      mockGetAllComponents.mockResolvedValue(mockComponents);
      mockMultiselect.mockResolvedValue(["button", "input"]);

      const result = await selectComponents();

      expect(result).toEqual(["button", "input"]);
      expect(mockMultiselect).toHaveBeenCalledWith({
        message: "Select components to add ('a' for all, space to select, enter to confirm)",
        options: [
          { label: "button", value: "button" },
          { label: "input", value: "input" },
        ],
        required: false,
      });
    });

    it("uses provided Runtime registry components when supplied", async () => {
      mockMultiselect.mockResolvedValue(["card"]);

      const result = await selectComponents([
        { name: "card", version: "2.0.0", dependencies: [], type: "component" },
      ]);

      expect(result).toEqual(["card"]);
      expect(mockGetAllComponents).not.toHaveBeenCalled();
      expect(mockMultiselect).toHaveBeenCalledWith(
        expect.objectContaining({
          options: [{ label: "card", value: "card" }],
        }),
      );
    });

    it("returns an empty array if user cancels", async () => {
      mockGetAllComponents.mockResolvedValue([
        { name: "button", version: "2.1.0", dependencies: [], type: "component" as const },
      ]);
      mockMultiselect.mockResolvedValue(Symbol("cancel"));

      const result = await selectComponents();

      expect(result).toEqual([]);
    });
  });
});
