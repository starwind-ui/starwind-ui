<p align="center">
  <img alt="Starwind UI" src="https://shieldcn.dev/header/gradient.svg?title=Starwind+UI&amp;mode=dark&amp;theme=blue" />
</p>

<p align="center">
  <a href="https://github.com/starwind-ui/starwind-ui"><img alt="npm + stars" src="https://shieldcn.dev/group/npm/starwind+github/stars/starwind-ui/starwind-ui.svg" /></a>
  <a href="https://www.npmjs.com/package/starwind"><img alt="downloads" src="https://shieldcn.dev/npm/dm/starwind.svg" /></a>
  <a href="https://x.com/boston343builds"><img alt="follow" src="https://shieldcn.dev/x/follow/boston343builds.svg?split=true" /></a>
</p>

**Build beautiful interfaces in the framework you love.**

Starwind UI gives you polished, accessible components for **Astro, React, Vue, Svelte, and plain HTML**.
Get your next project moving with ready-to-use Tailwind CSS designs, then shape them into something
that feels like yours.

The CLI puts component source in your project, so you can change a few styles or build your own
component library. Keyboard navigation and focus management come built in. You get the same familiar
components across frameworks, with code that fits the way you already work.

**[Get started →](https://starwind.dev/docs/getting-started/installation/)** &nbsp;|&nbsp;
**[Find your next component](https://starwind.dev/docs/components/)**

## Add your first component

From your app's folder, run:

```bash
npx starwind@latest init
npx starwind@latest add button
```

The CLI guides you through setup and installs what you need. Open the button's source to make it
fit your design, or run `add` again to browse the rest of the collection.

You'll need Node.js 22.12 or newer.

## Choose your framework

Starwind started with Astro. Today you can bring the same components to your React, Vue, and Svelte
projects too. The CLI detects your framework during setup, or you can choose it yourself:

```bash
npx starwind@latest init --framework astro
npx starwind@latest init --framework react
npx starwind@latest init --framework vue
npx starwind@latest init --framework svelte
```

Vue 3.5 and Svelte 5 support are in public beta. The
[framework guides](https://starwind.dev/docs/getting-started/installation/#choose-your-framework)
walk you through setup for your app.

For plain HTML, use [Starwind Runtime](https://starwind.dev/docs/runtime/) to add the same
interactive behavior to your markup. Install it with `npm install @starwind-ui/runtime` and follow the
guide to connect your HTML.

## Keep building

Add a few more components as your app grows:

```bash
npx starwind@latest add dialog select tabs
```

When an update arrives, preview it before applying it:

```bash
npx starwind@latest update button --diff
npx starwind@latest update button
```

Some fixes update the installed packages and keep your component files as they are. Others replace
component source, so review the diff for any edits you want to keep.

Use `npx starwind@latest` with any of these commands:

| Command                  | What it does                                  |
| ------------------------ | --------------------------------------------- |
| `search button`          | Find components and Pro blocks.               |
| `docs button`            | Open the component docs.                      |
| `update --all --dry-run` | Preview updates for all installed components. |
| `remove button`          | Remove an installed component.                |
| `migrate`                | Upgrade a legacy Starwind project.            |
| `setup`                  | Set up Starwind Pro for Astro, React, or Vue. |

Add `--help` to any command for more options. For control over the unstyled component source, see
[Primitives](https://starwind.dev/docs/primitives/) and the `primitives add`, `primitives update`, and
`primitives list` commands.

## Bring your AI coding tools

Give your coding tools the Starwind docs so they can help you build with the right components:

- [Starwind Skills](https://starwind.dev/docs/getting-started/skills/)
- [MCP server](https://starwind.dev/docs/getting-started/mcp/)
- [llms.txt](https://starwind.dev/llms.txt) and [llms-full.txt](https://starwind.dev/llms-full.txt)

## Contributing

Help improve Starwind with a bug fix or an idea for a component. The
[contributing guide](https://github.com/starwind-ui/starwind-ui/blob/main/CONTRIBUTING.md) explains how
to get involved.

## License

Free and open source under the [MIT license](https://github.com/starwind-ui/starwind-ui/blob/main/LICENSE).
