#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const packRoot = path.resolve(process.argv[2] ?? "C:/tmp/starwind-beta-packs");
const port = Number(process.argv[3] ?? 4874);

const packageSpecs = [
  ["@starwind-ui/runtime", "packages/runtime"],
  ["@starwind-ui/astro", "packages/astro"],
  ["@starwind-ui/react", "packages/react"],
];

const packages = new Map();
for (const [name, directory] of packageSpecs) {
  const manifest = JSON.parse(await readFile(path.join(repoRoot, directory, "package.json"), "utf8"));
  const tarballName = `${name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`;
  const tarballPath = path.join(packRoot, tarballName);
  const tarball = await readFile(tarballPath);
  const runtimeVersion = JSON.parse(
    await readFile(path.join(repoRoot, "packages/runtime/package.json"), "utf8"),
  ).version;
  const packedManifest = {
    ...manifest,
    dependencies: manifest.dependencies
      ? Object.fromEntries(
          Object.entries(manifest.dependencies).map(([dependency, version]) => [
            dependency,
            version === "workspace:*" ? runtimeVersion : version,
          ]),
        )
      : undefined,
    dist: {
      integrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}`,
      shasum: createHash("sha1").update(tarball).digest("hex"),
      tarball: `http://127.0.0.1:${port}/tarballs/${tarballName}`,
    },
  };
  packages.set(name, { manifest: packedManifest, tarballName, tarballPath });
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname;

  if (pathname.startsWith("/tarballs/")) {
    const tarballName = path.basename(pathname);
    const entry = [...packages.values()].find((candidate) => candidate.tarballName === tarballName);
    if (!entry) return sendJson(response, 404, { error: "Not found" });

    response.writeHead(200, {
      "content-length": (await stat(entry.tarballPath)).size,
      "content-type": "application/octet-stream",
    });
    createReadStream(entry.tarballPath).pipe(response);
    return;
  }

  const packageName = decodeURIComponent(pathname.slice(1)).replace("%2f", "/");
  const entry = packages.get(packageName);
  if (!entry) return sendJson(response, 404, { error: "Not found" });

  sendJson(response, 200, {
    name: packageName,
    "dist-tags": { beta: entry.manifest.version, latest: entry.manifest.version },
    versions: { [entry.manifest.version]: entry.manifest },
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local Starwind beta registry listening at http://127.0.0.1:${port}`);
});

function sendJson(response, status, value) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}
