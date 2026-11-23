import type { DirectionCase } from "../inventory.js";

export const cases: DirectionCase[] = [
  {
    id: "harness-smoke",
    row: "harness-smoke",
    acceptance: ["SPEC-AC-14"],
    fixtures: {
      astro: {
        source: `---
import { Button } from "@direction/styled-astro/button";
import "@direction/sheet";
---
<html><head><title>Direction smoke Astro</title></head><body>
  <Button data-direction-button>Activate Astro</Button><output data-direction-result>Idle</output>
  <script>document.querySelector("[data-direction-button]")?.addEventListener("click", () => { document.querySelector("[data-direction-result]").textContent = "Activated Astro"; });</script>
</body></html>`,
        exports: [],
        assertions: ["button-visible", "click-result", "compiled-style"],
      },
      react: {
        source: `import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@direction/styled-react/button";
import "@direction/sheet";
function App() { const [active, setActive] = useState(false); return <><Button data-direction-button onClick={() => setActive(true)}>Activate React</Button><output data-direction-result>{active ? "Activated React" : "Idle"}</output></>; }
createRoot(document.getElementById("app")!).render(<App />);`,
        exports: [],
        assertions: ["button-visible", "click-result", "compiled-style"],
      },
      vue: {
        source: `<script setup lang="ts">import { ref } from "vue";
import { Button } from "@direction/styled-vue/button";
import "@direction/sheet";
const active = ref(false);</script>
<template><Button data-direction-button @click="active = true">Activate Vue</Button><output data-direction-result>{{ active ? "Activated Vue" : "Idle" }}</output></template>`,
        exports: [],
        assertions: ["button-visible", "click-result", "compiled-style"],
      },
      svelte: {
        source: `<script lang="ts">import { Button } from "@direction/styled-svelte/button";
import "@direction/sheet";
let active = $state(false);</script>
<Button data-direction-button onclick={() => active = true}>Activate Svelte</Button><output data-direction-result>{active ? "Activated Svelte" : "Idle"}</output>`,
        exports: [],
        assertions: ["button-visible", "click-result", "compiled-style"],
      },
    },
  },
];
