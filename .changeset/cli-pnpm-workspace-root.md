---
"starwind": patch
---

Installs now work at the root of a pnpm workspace that has more than one package. Before, each `starwind` command that installs packages, for example `init`, `add`, `update`, `setup` and `primitives add`, failed there with `ERR_PNPM_ADDING_TO_ROOT`. The packages now go into the root `package.json`, and the install command that the CLI prints includes the `-w` flag. Inside a workspace package, the packages still go into that package. npm, Yarn and Bun commands do not change.
