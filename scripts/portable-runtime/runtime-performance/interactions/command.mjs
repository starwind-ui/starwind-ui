import { providers, scenarios } from "./registry.mjs";

export function parseArgs(argv = []) {
  const config = {
    mode: "smoke",
    providers: [...providers],
    scenarios: scenarios.map(({ id }) => id),
    cpu: 1,
    seed: 20260912,
  };
  const modes = new Set();
  const filters = { provider: [], scenario: [] };
  const seen = new Set();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--") continue;
    const modeFlag = arg.split("=")[0];
    if (["--list", "--smoke", "--capture", "--trace"].includes(arg)) {
      if (modes.has(arg)) throw new Error(`Duplicate mode: ${arg}`);
      modes.add(arg);
      config.mode = arg.slice(2);
      continue;
    }
    if (modeFlag === "--check") {
      if (modes.has("--check")) throw new Error("Duplicate mode: --check");
      modes.add("--check");
      config.mode = "check";
      const equal = arg.indexOf("=");
      const value = equal < 0 ? argv[++index] : arg.slice(equal + 1);
      if (!value || value.startsWith("--")) throw new Error("--check requires a run directory.");
      config.checkDirectory = value;
      continue;
    }
    const equal = arg.indexOf("=");
    const flag = equal < 0 ? arg : arg.slice(0, equal);
    if (!["--provider", "--scenario", "--cpu", "--seed"].includes(flag))
      throw new Error(`Unknown option: ${arg}`);
    const value = equal < 0 ? argv[++index] : arg.slice(equal + 1);
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
    const name = flag.slice(2);
    if (name in filters) {
      const allowed = name === "provider" ? providers : scenarios.map(({ id }) => id);
      if (!allowed.includes(value))
        throw new Error(`Unknown ${name}: ${value}. Available: ${allowed.join(", ")}`);
      if (filters[name].includes(value)) throw new Error(`Duplicate ${name}: ${value}`);
      filters[name].push(value);
    } else {
      if (seen.has(name)) throw new Error(`Duplicate ${flag}`);
      if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
        throw new Error(`${flag} requires a safe integer.`);
      config[name] = Number(value);
      seen.add(name);
    }
  }
  if (modes.size > 1) throw new Error("Choose one mode.");
  if (![1, 4].includes(config.cpu)) throw new Error("--cpu must be 1 or 4.");
  if (config.mode === "list" && (filters.provider.length || filters.scenario.length || seen.size))
    throw new Error("--list does not accept run options.");
  if (filters.provider.length) config.providers = filters.provider;
  if (filters.scenario.length) config.scenarios = filters.scenario;
  if (config.mode === "capture" && (filters.provider.length || filters.scenario.length))
    throw new Error("--capture always runs the full provider and scenario matrix.");
  if (config.mode === "check" && (filters.provider.length || filters.scenario.length || seen.size))
    throw new Error("--check accepts only a saved run directory.");
  if (config.mode === "trace") {
    const supported = scenarios
      .filter(({ family }) => family === "menu" || family === "submenu")
      .map(({ id }) => id);
    if (filters.scenario.some((scenario) => !supported.includes(scenario)))
      throw new Error(`Trace supports menu scenarios only: ${supported.join(", ")}`);
    if (!filters.scenario.length) config.scenarios = supported;
  }
  return config;
}

export function formatList() {
  return `Providers: ${providers.join(", ")}\nScenarios: ${scenarios.map(({ id }) => id).join(", ")}\nModes: smoke (default), capture, trace, list, check <run-directory>.\nFilters: --provider <id> --scenario <id> --cpu 1|4 --seed <integer>. Filters apply to smoke and trace only.`;
}
