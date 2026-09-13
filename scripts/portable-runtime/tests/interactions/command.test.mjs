import { describe, expect, it, vi } from "vitest";
import { main } from "../../measure-react-interactions.mjs";
import { parseArgs } from "../../runtime-performance/interactions/command.mjs";

describe("interaction command", () => {
  it("defaults to every implemented three-provider smoke scenario", () => {
    expect(parseArgs()).toMatchObject({
      mode: "smoke",
      providers: ["starwind", "base-ui", "ark-ui"],
      scenarios: [
        "menu-20",
        "select-100",
        "combobox-500",
        "submenu-8x8",
        "select-page-1",
        "select-page-20",
      ],
      cpu: 1,
    });
  });
  it("accepts separate trace runs and exact filters", () => {
    expect(
      parseArgs([
        "--",
        "--trace",
        "--scenario=menu-20",
        "--provider",
        "ark-ui",
        "--cpu",
        "4",
        "--seed=-9",
      ]),
    ).toMatchObject({ mode: "trace", providers: ["ark-ui"], cpu: 4, seed: -9 });
  });
  it.each([
    ["--smoke", "--trace"],
    ["--provider", "zag"],
    ["--scenario", "menu-1000"],
    ["--cpu", "6"],
    ["--seed", "1.5"],
    ["--provider"],
    ["--list", "--cpu", "1"],
    ["--wat"],
    ["--seed=9007199254740992"],
    ["--trace", "--trace"],
    ["--trace", "--scenario", "select-100"],
    ["--capture", "--provider", "starwind"],
    ["--capture", "--scenario", "menu-20"],
    ["--check"],
    ["--check", "saved", "--cpu", "1"],
    ["--check=saved", "--seed", "1"],
  ])("rejects %j before execution", async (...args) => {
    const execute = vi.fn();
    await expect(main(args, execute)).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
  it("accepts full capture and a saved-evidence check", () => {
    expect(parseArgs(["--capture", "--cpu=4", "--seed", "12"])).toMatchObject({
      mode: "capture",
      cpu: 4,
      seed: 12,
    });
    expect(parseArgs(["--check", "/saved/run"])).toMatchObject({
      mode: "check",
      checkDirectory: "/saved/run",
    });
  });
  it("lists without loading a build or starting execution", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const execute = vi.fn();
    await main(["--list"], execute);
    expect(execute).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("ark-ui"));
    log.mockRestore();
  });
});
