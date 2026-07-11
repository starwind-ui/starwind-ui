import fs from "node:fs";
import path from "node:path";

import type { LayeredDocsMetadata } from "../types.js";

export const findMissingPublishedPages = (metadata: LayeredDocsMetadata, docsRoot: string) =>
  metadata.styledComponents
    .filter((component) => component.docsPage.status === "published")
    .map((component) => {
      const pagePath = docsComponentPathFromDocsPage(component.docsPage.path);
      return pagePath ? { componentId: component.id, pagePath } : undefined;
    })
    .filter((page): page is { componentId: string; pagePath: string } => page !== undefined)
    .filter(({ pagePath }) => !fs.existsSync(path.join(docsRoot, pagePath)))
    .map(({ componentId, pagePath }) => `${componentId} (${pagePath})`);

const docsComponentPathFromDocsPage = (docsPath: string) => {
  const match = /^\/docs\/components\/([^/]+)\/$/.exec(docsPath);
  if (!match) return undefined;

  return path.join("src", "docs", "data", "docs", "en", "components", `${match[1]}.mdx`);
};
