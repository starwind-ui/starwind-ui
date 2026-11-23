export const cases = [
  {
    id: "flex-auto",
    ratio: 16 / 9,
    height: 0,
    width: 0,
    child: "overlay",
    omitWidth: true,
    hostClass: "flex flex-col items-center",
  },
  {
    id: "flex-full",
    ratio: 16 / 9,
    height: 180,
    width: 320,
    child: "overlay",
    omitWidth: true,
    hostClass: "flex flex-col items-center",
    class: "w-full",
  },
  {
    id: "grid-auto",
    ratio: 16 / 9,
    height: 0,
    width: 0,
    child: "overlay",
    omitWidth: true,
    hostClass: "grid justify-items-center",
  },
  {
    id: "grid-full",
    ratio: 16 / 9,
    height: 180,
    width: 320,
    child: "overlay",
    omitWidth: true,
    hostClass: "grid justify-items-center",
    class: "w-full",
  },
  { id: "default", height: 320 },
  { id: "square", ratio: 1, height: 320 },
  { id: "wide", ratio: 16 / 9, height: 180 },
  { id: "portrait", ratio: 3 / 4, height: 320 / (3 / 4) },
  { id: "media", ratio: 16 / 9, height: 180, child: "media" },
  { id: "portrait-media", ratio: 16 / 9, height: 180, child: "portrait-media" },
  { id: "image-root", ratio: 16 / 9, height: 180, as: "img" },
  { id: "link-root", ratio: 16 / 9, height: 180, as: "a", class: "block" },
  { id: "overlay", ratio: 16 / 9, height: 180, child: "overlay" },
  { id: "growth", ratio: 16 / 9, height: 300, child: "tall" },
  { id: "relative-growth", ratio: 16 / 9, height: 300, child: "tall", class: "relative" },
  { id: "clipped-flow", ratio: 16 / 9, height: 180, child: "tall", class: "overflow-hidden" },
  { id: "clipped", ratio: 16 / 9, height: 180, child: "overflow", class: "overflow-hidden" },
  { id: "sized", ratio: 16 / 9, height: 90, style: "height: 90px" },
  { id: "height-only", ratio: 16 / 9, height: 90, width: 160, style: "height: 90px; width: auto" },
  { id: "border", ratio: 16 / 9, height: 180, class: "border-4 p-4" },
  { id: "variable", ratio: 16 / 9, height: 320, style: "--ratio: 1; color: rgb(1, 2, 3)" },
  {
    id: "object-style",
    ratio: 16 / 9,
    height: 320,
    style: "--ratio: 1; color: rgb(1, 2, 3)",
    styleObject: true,
  },
  { id: "inline", ratio: 16 / 9, height: 240, style: "aspect-ratio: 4 / 3; color: rgb(1, 2, 3)" },
  { id: "utility", ratio: 16 / 9, height: 320, class: "aspect-square" },
  { id: "tag", ratio: 16 / 9, height: 180, as: "section" },
];

export function propsFor(entry, target) {
  const style = `${entry.omitWidth ? "" : "width: 320px; "}${entry.style ?? ""}`;
  return {
    id: entry.id,
    ratio: entry.ratio,
    as: entry.as,
    "aria-label": entry.id,
    "data-owner": "caller",
    "data-slot": "forged",
    ...(entry.as === "img"
      ? {
          alt: "Fixture",
          src: "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%274%27 height=%273%27/%3E",
        }
      : {}),
    [target === "react" ? "className" : "class"]: entry.class,
    style:
      target === "react" || (target === "astro" && entry.styleObject)
        ? Object.fromEntries(
            style
              .split(";")
              .filter((v) => v.trim())
              .map((declaration) => {
                const [name, value] = declaration.split(":");
                return [
                  target === "astro" || name.trim().startsWith("--")
                    ? name.trim()
                    : name.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
                  value.trim(),
                ];
              }),
          )
        : style,
  };
}

export function childHtml(child) {
  if (child === "portrait-media")
    return '<img alt="Portrait" class="h-full w-full object-cover" width="900" height="1600" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27900%27 height=%271600%27/%3E">';
  if (child === "media")
    return '<img alt="Fixture" class="h-full w-full object-cover" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%274%27 height=%273%27/%3E">';
  if (child === "overlay") return '<span class="absolute inset-0">Overlay</span>';
  if (child === "tall" || child === "overflow")
    return `<div style="height: 300px;${child === "overflow" ? " position: absolute; top: 0; width: 100%;" : ""}">Content</div>`;
  return "";
}
