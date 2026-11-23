import { error } from "@sveltejs/kit";

import { chartGalleryTypes, isChartGalleryType } from "$lib/review/chart/chart-catalog";

// The public repository omits generated SvelteKit types, so this route types its own params.
export const entries = () => chartGalleryTypes.map(({ type }) => ({ type }));

export const load = ({ params }: { params: { type: string } }) => {
  if (!isChartGalleryType(params.type)) error(404, "Unknown chart type");
  return { type: params.type };
};
