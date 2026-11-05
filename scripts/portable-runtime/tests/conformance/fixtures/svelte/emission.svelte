<script module lang="ts">
  import { type Component, mount, unmount } from "svelte";
  import { type EmissionSpec, settleFrames } from "../shared/harness";
  import EmissionNode from "./parts/EmissionNode.svelte";

  const modules = import.meta.glob<{ default: Component }>(
    "../../../../../../packages/svelte/src/*/*.svelte",
  );

  type Loaded = { component: Component; props: Record<string, unknown>; children: Loaded[] };

  async function load(spec: EmissionSpec): Promise<Loaded> {
    const importer = modules[`../../../../../../packages/svelte/src/${spec.file}`];
    if (!importer) throw new Error(`Missing part ${spec.file}`);
    const { default: component } = await importer();
    return { component, props: spec.props, children: await Promise.all(spec.children.map(load)) };
  }

  window.__renderEmission = async (spec) => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = mount(EmissionNode, { target: host, props: { node: await load(spec) } });
    await settleFrames();
    const html = host.innerHTML + document.body.innerHTML;
    await unmount(app);
    host.remove();
    return html;
  };
</script>

<main></main>
