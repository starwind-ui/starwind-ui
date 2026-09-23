import type {
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";
import { svelteNativeSetup } from "./native.js";
import { supportsSvelteScope } from "./scope.js";
import type { SvelteStyledComponentProjection } from "./types.js";

/** The contract classifies sources. Svelte supplies names and branch-owned element wiring. */
export function specializeSvelteStyledVideo(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
): Pick<
  SvelteStyledComponentProjection,
  "imports" | "publicTypes" | "destructure" | "rest" | "setup"
> {
  const fail = (detail: string): never => {
    throw new TypeError(
      `Svelte Styled ${group.component}/${component.exportName}.svelte: ${detail}.`,
    );
  };
  const root = component.render[0];
  if (
    component.exportName !== "Video" ||
    component.render.length !== 1 ||
    root?.type !== "condition" ||
    root.then.length !== 1 ||
    root.else.length !== 1
  )
    return fail("requires the native video and iframe branch pair");
  const native = root.then[0],
    iframe = root.else[0];
  if (
    native?.type !== "element" ||
    native.tag !== "video" ||
    native.tagBinding ||
    iframe?.type !== "element" ||
    iframe.tag !== "iframe" ||
    iframe.tagBinding ||
    iframe.children.length
  )
    return fail("requires video and iframe semantic owners");
  const track = native.children[0];
  if (
    native.children.length !== 1 ||
    track?.type !== "element" ||
    track.tag !== "track" ||
    track.tagBinding ||
    track.children.length ||
    track.attrs.length !== 1 ||
    track.attrs[0]?.name !== "kind" ||
    track.attrs[0].value?.type !== "literal" ||
    track.attrs[0].value.value !== "captions"
  )
    return fail("requires the contract captions track");
  if (!component.destructure?.rest) return fail("requires native rest props");
  const rest = component.destructure.rest;
  const scopedNames = new Set(["autoplay", "srcdoc", "referrerpolicy", "allowfullscreen"]);
  const adaptOwner = (
    node: Extract<StyledOutputRenderNode, { type: "element" }>,
    required: string[],
  ) => {
    const attrs = node.attrs.filter(
      (attr) => supportsSvelteScope(attr.targetScopes) || scopedNames.has(attr.name),
    );
    for (const name of required)
      if (attrs.filter((attr) => attr.name === name).length !== 1)
        fail(`requires one ${node.tag} ${name} attribute`);
    const spread = attrs.find((attr) => attr.name === "spread");
    if (spread?.value?.type !== "variable" || spread.value.name !== rest)
      fail(`requires the ${node.tag} native spread`);
    const slot = attrs.find((attr) => attr.name === "data-slot");
    if (slot?.value?.type !== "literal" || slot.value.value !== "video")
      fail(`requires the ${node.tag} video slot`);
    for (const attr of attrs) if (scopedNames.has(attr.name)) delete attr.targetScopes;
    node.attrs = attrs;
    node.selfClosing = false;
  };
  adaptOwner(native, [
    "src",
    "autoplay",
    "muted",
    "loop",
    "controls",
    "poster",
    "spread",
    "data-slot",
    "data-sw-video",
    "class",
  ]);
  adaptOwner(iframe, [
    "src",
    "srcdoc",
    "title",
    "allow",
    "referrerpolicy",
    "allowfullscreen",
    "data-video-type",
    "spread",
    "data-slot",
    "data-sw-video",
    "class",
  ]);
  const bases = (component.props?.extends ?? []).filter((entry) =>
    supportsSvelteScope(entry.targetScopes),
  );
  if (
    bases.length !== 2 ||
    bases[0]?.kind !== "element-attributes" ||
    bases[0].element !== "video" ||
    bases[1]?.kind !== "element-attributes" ||
    bases[1].element !== "iframe"
  )
    return fail("requires video and iframe native attributes");
  const nativeNames = new Set(["autoplay", "srcdoc"]);
  const fields = (component.props?.fields ?? []).filter(
    (field) => supportsSvelteScope(field.targetScopes) || nativeNames.has(field.name),
  );
  const types: Record<string, string> = {
    src: "string",
    title: "string",
    autoplay: "boolean",
    muted: "boolean",
    loop: "boolean",
    controls: "boolean",
    poster: "string",
    srcdoc: "string",
  };
  if (
    fields.length !== Object.keys(types).length ||
    new Set(fields.map((field) => field.name)).size !== fields.length ||
    fields.some(
      (field) => field.type !== types[field.name] || field.optional !== (field.name !== "src"),
    )
  )
    return fail("requires the contract media props");
  const destructure = component.destructure.props.filter(
    (prop) => supportsSvelteScope(prop.targetScopes) || nativeNames.has(prop.name),
  );
  for (const name of Object.keys(types))
    if (destructure.filter((prop) => prop.name === name).length !== 1)
      return fail(`requires the ${name} media prop`);
  const variables = component.variables.filter((entry) => supportsSvelteScope(entry.targetScopes));
  if (
    variables.map((entry) => entry.name).join(",") !==
      "videoType,youtubeId,isShort,embedUrl,iframeSrc" ||
    variables.some((entry) => entry.value.type !== "raw")
  )
    return fail("requires the contract source expressions");
  const element = "HTMLVideoElement | HTMLIFrameElement";
  return {
    imports: [
      { source: "svelte/elements", names: ["SvelteHTMLElements"], typeOnly: true },
      { source: "tailwind-variants", names: ["cx"] },
      { source: "./variants.js", names: ["video"] },
    ],
    publicTypes: `export type VideoProps = SvelteHTMLElements["video"] & SvelteHTMLElements["iframe"] & { ${fields.map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`).join(" ")} ref?: ${element}; };`,
    destructure: [
      ...destructure,
      { name: "ref", defaultValue: "$bindable()" },
      { name: "children" },
    ],
    rest,
    setup: svelteNativeSetup(rest, element),
  };
}
