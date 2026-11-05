import { type ComponentType, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { type EmissionSpec, settleFrames } from "../shared/harness";

const modules = import.meta.glob<{ default: ComponentType }>(
  "../../../../../../packages/react/src/*/*.tsx",
);

function load(spec: EmissionSpec): Promise<ReactNode> {
  return (async () => {
    const importer = modules[`../../../../../../packages/react/src/${spec.file}`];
    if (!importer) throw new Error(`Missing part ${spec.file}`);
    const { default: component } = await importer();
    const children = await Promise.all(spec.children.map(load));
    return createElement(component, spec.props, ...children);
  })();
}

window.__renderEmission = async (spec) => {
  const host = document.createElement("div");
  document.body.append(host);
  let failure: unknown;
  const root = createRoot(host, {
    onUncaughtError: (error) => {
      failure = error;
    },
  });
  root.render(await load(spec));
  await settleFrames();
  const html = host.innerHTML + document.body.innerHTML;
  root.unmount();
  host.remove();
  if (failure) throw failure;
  return html;
};

export default function Emission() {
  return null;
}
