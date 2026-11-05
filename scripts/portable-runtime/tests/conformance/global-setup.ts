import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
};

function serve(outDir: string): Promise<Server> {
  const server = createServer((request, response) => {
    const { pathname } = new URL(request.url ?? "/", "http://localhost");
    let file = pathname.startsWith("/astro/")
      ? path.join(outDir, "astro", pathname.slice("/astro/".length))
      : path.join(outDir, "app", pathname);
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!file.startsWith(outDir) || !existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentTypes[path.extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

export default async function setup(project: TestProject) {
  const workspaceId = createHash("sha256").update(root).digest("hex").slice(0, 12);
  const outDir = path.join(tmpdir(), "starwind-conformance", workspaceId);
  execFileSync(
    path.join(root, "node_modules/.bin/tsx"),
    [
      "--tsconfig",
      path.join(root, "packages/cli/tsconfig.json"),
      path.join(here, "build-fixtures.mjs"),
      outDir,
    ],
    { cwd: root, stdio: "inherit" },
  );
  const server = await serve(outDir);
  const { port } = server.address() as AddressInfo;
  project.provide("conformanceBaseUrl", `http://127.0.0.1:${port}`);
  return () => new Promise<void>((resolve) => server.close(() => resolve()));
}

declare module "vitest" {
  export interface ProvidedContext {
    conformanceBaseUrl: string;
  }
}
