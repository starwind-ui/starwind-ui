import { Buffer } from "node:buffer";

import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { compileVueSfc } from "../tsup.config.js";

describe("Vue package compiler foundation", () => {
  it("preserves typed props, defaults, slots, attrs, and exposed element ownership in SSR output", async () => {
    const compiled = compileVueSfc(representativeSfc, "/fixture/RepresentativeControl.vue");
    const component = await importCompiledComponent(compiled);
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            component,
            {
              "aria-label": "Compiled control",
              active: true,
              class: "consumer-class",
              count: 4,
              id: "compiled-control",
              style: { color: "red" },
            },
            {
              default: () => "Consumer label",
              suffix: () => "Suffix slot",
            },
          ),
      }),
    );

    expect(compiled).toContain("__expose({ element })");
    expect(compiled).toContain("ref: element");
    expect(compiled).toContain('_renderSlot(_ctx.$slots, "default"');
    expect(compiled).toContain('_renderSlot(_ctx.$slots, "suffix"');
    expect(html).toContain('id="compiled-control"');
    expect(html).toContain('aria-label="Compiled control"');
    expect(html).toContain('class="consumer-class"');
    expect(html).toContain('style="color:red;"');
    expect(html).toContain('data-count="4"');
    expect(html).toContain('data-active="true"');
    expect(html).toContain("Consumer label");
    expect(html).toContain("Suffix slot");
  });

  it("applies production defaults through the inlined render function", async () => {
    const component = await importCompiledComponent(
      compileVueSfc(representativeSfc, "/fixture/RepresentativeControl.vue"),
    );
    const html = await renderToString(createSSRApp(component));

    expect(html).toContain('data-count="1"');
    expect(html).toContain('data-active="false"');
    expect(html).toContain("Save");
  });
});

async function importCompiledComponent(source: string) {
  const javaScript = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "RepresentativeControl.vue",
  }).outputText;
  const vueUrl = import.meta.resolve("vue");
  const executable = javaScript.replace(/from (["'])vue\1/g, `from ${JSON.stringify(vueUrl)}`);
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`
  );
  return module.default;
}

const representativeSfc = `<script setup lang="ts">
import { ref, useAttrs } from "vue";

interface Props {
  label?: string;
  count?: number;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Save",
  count: 1,
  active: false,
});
const attrs = useAttrs();
const element = ref<HTMLButtonElement>();
defineExpose({ element });
</script>

<template>
  <button ref="element" v-bind="attrs" :data-count="props.count" :data-active="props.active">
    <slot>{{ props.label }}</slot>
    <slot name="suffix" />
  </button>
</template>
`;
