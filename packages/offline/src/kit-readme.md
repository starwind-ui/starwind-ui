# @starwind-ui/offline

Run the [Starwind UI](https://starwind.dev) CLI without a network connection.

This package contains the `starwind` CLI and every npm package that the CLI installs, such as the
Starwind adapter packages, Tailwind CSS, and the icon packages. A platform package with the native
binaries for your machine installs with it.

## Install

Install the kit once, while you are online:

```bash
npm install --global @starwind-ui/offline@beta
```

The kit is in beta. Its version, such as 0.1.0, is separate from the `starwind` CLI version that it
contains. Run `npm ls --global starwind` to see that CLI version.

## Use

Run `starwind-offline` in place of `starwind`. It takes the same commands and options:

```bash
starwind-offline init
starwind-offline add button dialog
```

The kit installs packages through your project's package manager: npm, pnpm, or Yarn 2 or later.
Your lockfile records the public npm registry, so a later online install works as usual.

## Limits

- Install your project's own dependencies first. The kit does not contain Astro, Next.js, Nuxt,
  SvelteKit, or the rest of your project's toolchain.
- Your package manager must already be on your machine. Corepack cannot download one offline.
- Yarn 1 and Bun are not supported. Yarn 1 downloads native packages for every platform on each
  install, and Bun downloads installed packages again from the kit registry.
- A registry that your config sets for one scope still applies: `@starwind-ui:registry` in
  `.npmrc`, or `npmScopes` in `.yarnrc.yml`. Remove that setting while you work offline.
- Starwind Pro and remote registries need a network connection.
- After an offline install, your lockfile points to `https://registry.npmjs.org/`. If your
  project uses a private registry mirror, run an online install to update the lockfile.
- Supported platforms: macOS (arm64, x64), Linux with glibc or musl (x64, arm64), and Windows
  (x64, arm64).

Read the [CLI guide](https://starwind.dev/docs/getting-started/cli/#offline-use) for more details.
