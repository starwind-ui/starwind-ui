import { describe, expect, it } from "vitest";

import {
  addStarwindCssImport,
  addThemeInitToNextLayout,
  addThemeInitToNextPagesDocument,
  addThemeInitToReactRouterRoot,
  addThemeInitToTanStackRoot,
  createNextPagesDocument,
  detectReactProjectPaths,
  getReactPackageRequirements,
  getReactProjectPlan,
  prepareReactComponentFile,
  updateNextPagesComponentStylesheet,
} from "../../src/utils/react-project.js";

describe("React host project planning", () => {
  it("collects React host paths through an injected evidence reader", async () => {
    const existingPaths = await detectReactProjectPaths(async (filePath) =>
      ["vite.config.mjs", "src/main.jsx"].includes(filePath),
    );

    expect(existingPaths).toEqual(new Set(["vite.config.mjs", "src/main.jsx"]));
  });

  it("plans the standard Vite React starter", () => {
    expect(
      getReactProjectPlan(
        { dependencies: { react: "^19.2.0" }, devDependencies: { vite: "^8.2.0" } },
        new Set(["vite.config.ts", "src/main.tsx"]),
      ),
    ).toEqual({
      componentDir: "src/components/starwind",
      cssEntry: "src/main.tsx",
      cssFile: "src/styles/starwind.css",
      kind: "vite",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig: "vite.config.ts",
    });
  });

  it("plans a Next App Router starter with src", () => {
    expect(
      getReactProjectPlan(
        { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
        new Set(["next.config.ts", "src/app/layout.tsx", "src/app/globals.css"]),
      ),
    ).toEqual({
      componentDir: "src/components/starwind",
      cssEntry: "src/app/globals.css",
      cssFile: "src/styles/starwind.css",
      kind: "next-app",
      rootEntry: "src/app/layout.tsx",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
    });
  });

  it("plans a root-directory Next App Router starter without inventing src paths", () => {
    expect(
      getReactProjectPlan(
        { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
        new Set(["next.config.mjs", "app/layout.tsx", "app/globals.css"]),
      ),
    ).toEqual({
      componentDir: "components/starwind",
      cssEntry: "app/globals.css",
      cssFile: "styles/starwind.css",
      kind: "next-app",
      rootEntry: "app/layout.tsx",
      sourceRoot: ".",
      utilsDir: "lib/utils",
    });
  });

  it("plans a root-directory Next Pages Router starter", () => {
    expect(
      getReactProjectPlan(
        { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
        new Set(["next.config.ts", "pages/_app.tsx", "pages/_document.tsx", "styles/globals.css"]),
      ),
    ).toEqual({
      componentDir: "components/starwind",
      cssEntry: "styles/globals.css",
      cssFile: "styles/starwind.css",
      kind: "next-pages",
      rootEntry: "pages/_document.tsx",
      sourceRoot: ".",
      utilsDir: "lib/utils",
    });
  });

  it("plans a src-directory Next Pages Router starter and a document creation target", () => {
    expect(
      getReactProjectPlan(
        { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
        new Set(["next.config.mjs", "src/pages/_app.jsx", "src/styles/globals.css"]),
      ),
    ).toEqual({
      componentDir: "src/components/starwind",
      cssEntry: "src/styles/globals.css",
      cssFile: "src/styles/starwind.css",
      kind: "next-pages",
      rootEntry: "src/pages/_document.jsx",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
    });
  });

  it("plans the current TanStack Start Vite starter before the generic Vite fallback", () => {
    expect(
      getReactProjectPlan(
        {
          dependencies: {
            "@tanstack/react-start": "latest",
            react: "^19.2.0",
          },
          devDependencies: { vite: "^8.0.0" },
        },
        new Set(["vite.config.ts", "src/routes/__root.tsx", "src/styles.css"]),
      ),
    ).toEqual({
      componentDir: "src/components/starwind",
      cssEntry: "src/styles.css",
      cssFile: "src/styles/starwind.css",
      kind: "tanstack-start",
      rootEntry: "src/routes/__root.tsx",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig: "vite.config.ts",
    });
  });

  it("plans the current React Router framework starter before the generic Vite fallback", () => {
    expect(
      getReactProjectPlan(
        {
          dependencies: {
            react: "^19.2.0",
            "react-router": "^7.15.0",
          },
          devDependencies: {
            "@react-router/dev": "^7.15.0",
            vite: "^8.0.0",
          },
        },
        new Set(["react-router.config.ts", "vite.config.ts", "app/root.tsx", "app/app.css"]),
      ),
    ).toEqual({
      componentDir: "app/components/starwind",
      cssEntry: "app/app.css",
      cssFile: "app/styles/starwind.css",
      kind: "react-router",
      rootEntry: "app/root.tsx",
      sourceRoot: "app",
      utilsDir: "app/lib/utils",
      viteConfig: "vite.config.ts",
    });
  });

  it("rejects an incomplete React Router framework project before using the Vite fallback", () => {
    expect(() =>
      getReactProjectPlan(
        {
          dependencies: { react: "^19.2.0", "react-router": "^7.15.0" },
          devDependencies: { vite: "^8.0.0" },
        },
        new Set(["react-router.config.ts", "vite.config.ts", "src/main.tsx"]),
      ),
    ).toThrow(/React Router.*root route.*global stylesheet/i);
  });

  it("rejects an unrecognized React host before initialization mutates it", () => {
    expect(() => getReactProjectPlan({ dependencies: { react: "^19.2.0" } }, new Set())).toThrow(
      /supported React project/i,
    );
  });

  it("connects Starwind CSS to a framework stylesheet without compiling Tailwind twice", () => {
    const source = '@import "tailwindcss";\n\nbody { color: black; }\n';
    const updated = addStarwindCssImport(source, "src/app/globals.css", "src/styles/starwind.css");

    expect(updated).toBe('@import "../styles/starwind.css";\n\nbody { color: black; }\n');
    expect(addStarwindCssImport(updated, "src/app/globals.css", "src/styles/starwind.css")).toBe(
      updated,
    );
  });

  it("keeps existing external imports ahead of the Starwind stylesheet", () => {
    const source = `@import "tailwindcss";

@import url("https://fonts.example.test/family.css");
@plugin "@tailwindcss/typography";
`;

    expect(addStarwindCssImport(source, "src/styles.css", "src/styles/starwind.css"))
      .toBe(`@import url("https://fonts.example.test/family.css");
@import "./styles/starwind.css";
@plugin "@tailwindcss/typography";
`);
  });

  it("adds the prepaint theme helper to a Next App layout idempotently", () => {
    const source = `import type { Metadata } from "next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
    const updated = addThemeInitToNextLayout(source);

    expect(updated).toContain('import { ThemeInitScript } from "@starwind-ui/react/theme";');
    expect(updated).toContain('<html suppressHydrationWarning lang="en">');
    expect(updated).toContain("<head>\n        <ThemeInitScript />\n      </head>");
    expect(addThemeInitToNextLayout(updated)).toBe(updated);
  });

  it("adds the prepaint theme helper to an existing Next Pages document idempotently", () => {
    const source = `import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
`;
    const updated = addThemeInitToNextPagesDocument(source);

    expect(updated).toContain("import { ThemeInitScript } from '@starwind-ui/react/theme';");
    expect(updated).toContain('<Html suppressHydrationWarning lang="en">');
    expect(updated).toContain("<Head>\n        <ThemeInitScript />\n      </Head>");
    expect(addThemeInitToNextPagesDocument(updated)).toBe(updated);
  });

  it("creates a valid Next Pages document when the project uses the default document", () => {
    const document = createNextPagesDocument();

    expect(document).toContain('from "next/document"');
    expect(document).toContain('from "@starwind-ui/react/theme"');
    expect(document).toContain("<Html suppressHydrationWarning>");
    expect(document).toContain("<ThemeInitScript />");
    expect(document).toContain("<Main />");
    expect(document).toContain("<NextScript />");
  });

  it("removes component-local global CSS imports only for Next Pages output", () => {
    const source = `"use client";

import type * as React from "react";
import "./styles.css";
import DialogPrimitive from "@starwind-ui/react/dialog";
`;

    expect(prepareReactComponentFile(source, "next-pages")).toBe(`"use client";

import type * as React from "react";
import DialogPrimitive from "@starwind-ui/react/dialog";
`);
    expect(prepareReactComponentFile(source, "next-app")).toBe(source);
    expect(prepareReactComponentFile(source, "react-router")).toBe(source);
  });

  it("manages Next Pages component style imports after Tailwind imports idempotently", () => {
    const source = `@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/forms";

@custom-variant dark (&:where(.dark, .dark *));
`;
    const updated = updateNextPagesComponentStylesheet(source, "styles/starwind.css", [
      "components/starwind/dialog/styles.css",
      "components/starwind/color-picker/styles.css",
    ]);

    expect(updated).toContain(`@import "tw-animate-css";
/* Starwind Next.js Pages component styles: start */
@import "../components/starwind/color-picker/styles.css";
@import "../components/starwind/dialog/styles.css";
/* Starwind Next.js Pages component styles: end */
@plugin "@tailwindcss/forms";`);
    expect(
      updateNextPagesComponentStylesheet(updated, "styles/starwind.css", [
        "components/starwind/dialog/styles.css",
        "components/starwind/color-picker/styles.css",
      ]),
    ).toBe(updated);
    expect(updateNextPagesComponentStylesheet(updated, "styles/starwind.css", [])).toBe(source);
  });

  it("adds the prepaint theme helper before TanStack HeadContent idempotently", () => {
    const source = `import { HeadContent, Scripts } from '@tanstack/react-router'

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  )
}
`;
    const updated = addThemeInitToTanStackRoot(source);

    expect(updated).toContain("import { ThemeInitScript } from '@starwind-ui/react/theme'");
    expect(updated).toContain("<ThemeInitScript />\n        <HeadContent />");
    expect(updated).toContain('<html suppressHydrationWarning lang="en">');
    expect(addThemeInitToTanStackRoot(updated)).toBe(updated);
  });

  it("adds the prepaint theme helper to a React Router root document idempotently", () => {
    const source = `import { Links, Meta, Outlet, Scripts } from "react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
`;
    const updated = addThemeInitToReactRouterRoot(source);

    expect(updated).toContain('import { ThemeInitScript } from "@starwind-ui/react/theme";');
    expect(updated).toContain('<html suppressHydrationWarning lang="en">');
    expect(updated).toContain("<head>\n        <ThemeInitScript />");
    expect(addThemeInitToReactRouterRoot(updated)).toBe(updated);
  });

  it("keeps an existing TanStack prepaint theme bootstrap as the single owner", () => {
    const source = `const THEME_INIT_SCRIPT = "document.documentElement.classList.add('dark')"

function RootDocument() {
  return <html suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /><HeadContent /></head><body /></html>
}
`;

    expect(addThemeInitToTanStackRoot(source)).toBe(source);
  });

  it("uses the PostCSS Tailwind adapter for Next instead of installing the Vite adapter", () => {
    const base = ["tailwindcss@^4", "@tailwindcss/vite@^4", "tw-animate-css@^1"];

    expect(getReactPackageRequirements(base, "next-app")).toEqual([
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);
    expect(getReactPackageRequirements(base, "next-pages")).toEqual([
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);
    expect(getReactPackageRequirements(base, "vite")).toEqual(base);
    expect(getReactPackageRequirements(base, "tanstack-start")).toEqual(base);
    expect(getReactPackageRequirements(base, "react-router")).toEqual(base);
  });
});
