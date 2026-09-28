import { reactSidebarProjection } from "../../../framework-adapters/react/sidebar-recipe.js";
import { svelteSidebarProjection } from "../../../framework-adapters/svelte/sidebar-recipe.js";
import { vueSidebarProjection } from "../../../framework-adapters/vue/sidebar-recipe.js";
import { operations, type Target } from "../operations.js";
import {
  type SidebarFacts,
  type SidebarRecipe,
  sidebarProviderOptions,
  sidebarRecipe,
} from "./recipe.js";
import type { SidebarProjection } from "./types.js";

const projections: Record<Target, SidebarProjection> = {
  react: reactSidebarProjection,
  vue: vueSidebarProjection,
  svelte: svelteSidebarProjection,
};
const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export function renderSidebarProvider(
  target: Target,
  f: SidebarFacts,
  plan: SidebarRecipe = sidebarRecipe,
): string {
  const fw = operations[target],
    p = projections[target],
    models = plan.models;
  const seed = (name: string) => `seed${upper(name)}`;
  const initial = models
    .map(
      (name) =>
        `const ${seed(name)}=${p.initial(p.read(plan.defaults[name]))};\nconst initial${upper(name)}=${p.initial(`${p.read(name)} ?? ${seed(name)}`)};`,
    )
    .join("\n");
  const cells = [
    ...models.map((name) => p.state(name, `initial${upper(name)}`)),
    p.state(plan.media.context, String(plan.media.fallback)),
  ].join("\n");
  const readback = models
    .map(
      (name) =>
        `connection.accepted.${name}=owned.${f.state[name].getter}();\n${p.writeState(name, `connection.accepted.${name}`)}`,
    )
    .join("\n");
  const publishBinding = models
    .map((name) => fw.publishModel(name, `connection.accepted.${name}`))
    .join("\n");
  const notify = (name: (typeof models)[number]) => {
    const steps = {
      "read-context": "readContext(owned);",
      "publish-notified-model": fw.publishModel(name, `detail.${f.events[name].valueProperty}`),
    };
    const body = `if(connection.instance!==owned)return;\n${plan.notify.map((step) => steps[step]).join("\n")}`;
    return fw.untracked(plan.publication === "microtask" ? `queueMicrotask(()=>{${body}});` : body);
  };
  const connectSteps = {
    "retire-previous": "disconnectRuntime();",
    "create-runtime-seed": `const owned=${f.runtime.factory}(root,{
${models.map((name) => `${plan.defaults[name]}:${seed(name)},\n...(${fw.controlled(name)}?{${name}:${fw.readInput(name)}}:{}),`).join("\n")}
${plan.constructorInputs.map((name) => `${name}:${fw.readInput(name)},`).join("\n")}
${models.map((name) => `${f.events[name].callbackProp}:(next,detail)=>{${fw.untracked(fw.proposal(f.events[name].callbackProp, "next", "detail"))}},`).join("\n")}
});connection.instance=owned;`,
    "subscribe-notifications": `connection.unsubscribe=[${models.map((name) => `owned.subscribe('${f.events[name].name}',detail=>{${notify(name)}})`).join(",")}];`,
    "restore-defined-or-retained": models
      .map(
        (name) =>
          `{const supplied=${fw.readInput(name)};${name === plan.persistence.model ? `const reload=connection.initialized&&${fw.readInput(plan.persistence.enabledInput)}&&!(${fw.controlled(name)})${fw.modelAuthority === "runtime-binding" ? `&&supplied===connection.accepted.${name}` : ""};` : ""}const next=${name === plan.persistence.model ? "reload?undefined:" : ""}supplied ?? (connection.initialized?connection.accepted.${name}:undefined);if(next!==undefined&&owned.${f.state[name].getter}()!==next)owned.${f.state[name].setter}(next,{emit:false});}`,
      )
      .join("\n"),
    "read-context": "readContext(owned);connection.initialized=true;",
    "publish-runtime-binding":
      fw.modelAuthority === "runtime-binding" ? fw.untracked(publishBinding) : "",
  };
  const cleanupSteps = {
    "retain-readback": models
      .map((name) => `connection.accepted.${name}=owned.${f.state[name].getter}();`)
      .join("\n"),
    unsubscribe: "connection.unsubscribe?.forEach(stop=>stop());connection.unsubscribe=undefined;",
    "clear-owner": "connection.instance=undefined;",
    destroy: "owned.destroy();",
  };
  const lifecycle = `function readContext(owned:ReturnType<typeof ${f.runtime.factory}>):void{${readback}}
function connectRuntime(root:HTMLDivElement):void{${plan.connect.map((step) => connectSteps[step]).join("\n")}}
function applyParentCommand():void{const owned=connection.instance;if(!owned)return;${models.map((name) => `{const next=${fw.readInput(name)};if(next!==undefined&&owned.${f.state[name].getter}()!==next)owned.${f.state[name].setter}(next,{emit:false});}`).join("\n")}readContext(owned);${fw.modelAuthority === "runtime-binding" ? fw.untracked(publishBinding) : ""}}
function disconnectRuntime():void{const owned=connection.instance;if(!owned)return;${plan.cleanup.map((step) => cleanupSteps[step]).join("\n")}}
${fw.modelAuthority === "runtime-binding" ? `function acceptMobile(next:boolean):void{const owned=connection.instance;if(!owned)return;owned.${f.state[plan.sheet.bindingModel].setter}(next,{emit:false});readContext(owned);${fw.untracked(publishBinding)}}` : ""}`;
  const media = `function connectMedia(query:string):()=>void{const media=typeof window.matchMedia==='function'?window.matchMedia(query):undefined;
const sync=()=>{${p.writeState(plan.media.context, `media?.matches ?? ${plan.media.fallback}`)}};sync();
if(media?.addEventListener)media.addEventListener('change',sync);else media?.addListener(sync);
return()=>{if(media?.removeEventListener)media.removeEventListener('change',sync);else media?.removeListener(sync);};}`;
  const open = p.readState("open"),
    mobile = p.readState("mobileOpen"),
    isMobile = p.readState("isMobile");
  const context = {
    open,
    mobileOpen: mobile,
    state: `${open}?'expanded' as const:'collapsed' as const`,
    expanded: `${isMobile}?${mobile}:${open}`,
    isMobile,
  };
  const attrs: Record<string, string> = {
    [f.attrs.provider]: `''`,
    "data-sw-part": `'provider'`,
    [f.attrs.defaultOpen]: `seedOpen?'true':undefined`,
    [f.attrs.defaultMobileOpen]: `seedMobileOpen?'true':undefined`,
    [f.attrs.providerState]: context.state,
    [f.attrs.mobileOpen]: `String(${mobile})`,
  };
  for (const name of plan.constructorInputs)
    attrs[f.attrs[name]] =
      name === "persistOpen"
        ? `${p.read(name)}?'true':undefined`
        : name === "persistenceStorage"
          ? `typeof ${p.read(name)}==='string'?${p.read(name)}:${p.read(name)}===false?'false':undefined`
          : p.read(name);
  const props = [
    ...models.flatMap((name) => [
      f.props[name],
      f.props[plan.defaults[name] as keyof typeof f.props],
    ]),
    ...plan.constructorInputs.map((name) => ({
      ...f.props[name],
      defaultValue: sidebarProviderOptions[name].adapterDefault
        ? f.props[name].defaultValue
        : undefined,
    })),
  ];
  return p
    .print({
      facts: f,
      plan,
      props,
      fields: props.map((prop) => `${prop.name}?:${prop.type};`).join("\n"),
      callbacks: models
        .map(
          (name) =>
            `${f.events[name].callbackProp}?:(next:boolean,detail:${f.events[name].detailsType})=>void;`,
        )
        .join("\n"),
      initial,
      cells,
      controller: fw.controllerCell(
        `{instance?:ReturnType<typeof ${f.runtime.factory}>;accepted:{open:boolean;mobileOpen:boolean};initialized:boolean;unsubscribe?:(()=>void)[]}`,
        `{open:initialOpen,mobileOpen:initialMobileOpen}`,
      ),
      lifecycle,
      media,
      context,
      attributes: Object.entries(attrs)
        .map(([name, value]) => p.attribute(name, value))
        .join("\n"),
    })
    .replace(/^[\t ]+$/gm, "");
}
