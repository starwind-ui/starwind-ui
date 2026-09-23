<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { getThemeInitScript, initThemeController } from "@starwind-ui/svelte/theme";
  import { ThemeToggle } from "$lib/starwind-runtime/theme-toggle";
  import "../app.css";
  let { children }: { children: Snippet } = $props();
  const themeOptions = {
    storageKey: "colorTheme",
    defaultTheme: "system",
    className: "dark",
  } as const;
  const initialTheme = `<script>${getThemeInitScript(themeOptions)}<\/script>`;
  onMount(() => {
    const controller = initThemeController(document, themeOptions);
    return () => controller.destroy();
  });
</script>

<svelte:head>{@html initialTheme}</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/">Starwind <span>Svelte</span></a>
  <span class="private-label">Public beta</span>
  <nav aria-label="Main"><a href="/review/">Component catalog</a></nav>
  <ThemeToggle ariaLabel="Toggle page theme" size="sm" />
</header>
{@render children()}
