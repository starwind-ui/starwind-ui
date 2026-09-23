import type { Target } from "../operations.js";
import { printFormRoot } from "./frame.js";
import { checkboxPlan, switchPlan } from "./plan.js";
export function renderFormRoot(component: "Checkbox" | "Switch", target: Target): string {
  const code = printFormRoot(target, component === "Checkbox" ? checkboxPlan : switchPlan);
  return target === "react" ? code.replace(/^"use client";\n/, "") : code;
}
