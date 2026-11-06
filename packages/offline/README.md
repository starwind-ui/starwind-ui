# Offline kit builder

This private workspace package builds the generated `@starwind-ui/offline` kit packages. It is
not published.

- `pnpm --dir packages/offline build:kit --platforms current` builds a kit from npm into
  `node_modules/.cache/starwind-offline/kit`.
- `pnpm --dir packages/offline acceptance` installs a test kit and runs the CLI offline in real
  projects.

The routine release publishes the kit. `pnpm publish:release:dry-run` builds the kit with the
`starwind` CLI of the release and checks it with `npm publish --dry-run`. `pnpm publish:release`
publishes the kit after the routine packages. The kit reads its package list from the packed
`starwind` archive, so a CLI code change reaches the kit at the next kit release.

`src/kit-channel.mjs` sets the kit version and npm tag. During the beta, the kit has its own
version, `0.1.0`, on the `beta` tag, and the release skips the kit when npm already has that
version. Set a new beta version there to publish a newer beta kit. After the beta, the kit
publishes at the `starwind` version with the `starwind` tag.
