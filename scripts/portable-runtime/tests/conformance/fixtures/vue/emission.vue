<script setup lang="ts">
import { type Component, createApp, h, type VNode } from "vue";
import { type EmissionSpec, settleFrames } from "../shared/harness";

const modules = import.meta.glob<{ default: Component }>(
  "../../../../../../packages/vue/src/*/*.vue",
);

type Loaded = { component: Component; props: Record<string, unknown>; children: Loaded[] };

async function load(spec: EmissionSpec): Promise<Loaded> {
  const importer = modules[`../../../../../../packages/vue/src/${spec.file}`];
  if (!importer) throw new Error(`Missing part ${spec.file}`);
  const { default: component } = await importer();
  return { component, props: spec.props, children: await Promise.all(spec.children.map(load)) };
}

function toNode(node: Loaded): VNode {
  return h(
    node.component,
    node.props,
    node.children.length > 0 ? { default: () => node.children.map(toNode) } : undefined,
  );
}

window.__renderEmission = async (spec) => {
  const host = document.createElement("div");
  document.body.append(host);
  const loaded = await load(spec);
  let failure: unknown;
  const app = createApp({ render: () => toNode(loaded) });
  app.config.errorHandler = (error) => {
    failure = error;
  };
  app.mount(host);
  await settleFrames();
  const html = host.innerHTML + document.body.innerHTML;
  app.unmount();
  host.remove();
  if (failure) throw failure;
  return html;
};
</script>

<template>
  <main />
</template>
