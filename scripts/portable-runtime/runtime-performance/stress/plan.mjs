export const providers = Object.freeze(["starwind", "base-ui", "ark-ui"]);
export const workloads = Object.freeze([
  { id: "dialog", label: "Dialog", metrics: ["open"] },
  { id: "navigation-menu", label: "Navigation Menu", metrics: ["switch"] },
  { id: "tabs", label: "Tabs", metrics: ["mount", "select-last"] },
  { id: "accordion", label: "Accordion", metrics: ["mount", "expand-last"] },
  { id: "radio-group", label: "Radio Group", metrics: ["mount", "select-last"] },
]);

export function stressPlan({ runId, selected = workloads.map(({ id }) => id) }) {
  const chosen = workloads.filter(({ id }) => selected.includes(id));
  if (
    chosen.length === 0 ||
    chosen.length !== selected.length ||
    new Set(selected).size !== selected.length
  )
    throw new Error("Unknown or duplicate stress workload.");
  const sessions = [];
  for (const { id: workload } of chosen) {
    // Each rotation gives every provider two positions over six passes.
    for (let pass = 0; pass < 6; pass++) {
      for (let position = 0; position < 3; position++) {
        const provider = providers[(position + pass) % 3];
        sessions.push({
          runId,
          sessionId: `${workload}/${provider}/${pass}`,
          workload,
          provider,
          pass,
          passRole: pass === 0 ? "warmup" : "measured",
          excluded: pass === 0,
          position,
          orderIndex: sessions.length,
        });
      }
    }
  }
  return { schemaVersion: 1, runId, selected: chosen.map(({ id }) => id), sessions };
}

export function parseStressArgs(argv) {
  let check = null;
  const selected = [];
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === "--") continue;
    if (token === "--check" && check == null) check = argv[++index];
    else if (token === "--workload") selected.push(argv[++index]);
    else throw new Error(`Unknown or duplicate stress option: ${token}`);
  }
  if (check !== null && (!check || check.startsWith("--") || selected.length > 1))
    throw new Error("--check needs one directory and at most one workload.");
  if (
    selected.some((id) => !workloads.some((workload) => workload.id === id)) ||
    new Set(selected).size !== selected.length
  )
    throw new Error("Unknown or duplicate stress workload.");
  return {
    check,
    checkWorkload: check && selected.length ? selected[0] : null,
    selected: selected.length ? selected : workloads.map(({ id }) => id),
  };
}
