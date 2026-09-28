# Unstyled library browser-size comparison

Generated: 2026-09-28T15:25:48.138Z

This report measures JavaScript that a browser downloads. Synthetic component rows bundle each complete public component surface. React, React DOM, and Vue are external in those rows. Gzip and Brotli use the same minified output.

## Small imports for the components your page uses

Starwind UI has the smallest imports in the majority of comparisons.

For a page that uses a few components, start with individual import sizes. This scorecard compares gzip sizes across the component categories measured for both libraries in each pair.

| Comparison                         | Starwind smaller | Median reduction per component |
| ---------------------------------- | ---------------- | ------------------------------ |
| Starwind UI React vs Ark UI React  | **28 of 30**     | **42.7%**                      |
| Starwind UI React vs Base UI React | **27 of 30**     | **41.1%**                      |
| Starwind UI Vue vs Ark UI Vue      | **28 of 30**     | **42.1%**                      |
| Starwind UI Vue vs Reka UI Vue     | **17 of 25**     | **3.1%**                       |

The median includes every shared measured category, including rows where Starwind is larger. The smaller count excludes ties. A page with several components needs a combined measurement to account for shared code.

## React individual components

| Component       | Starwind React 1.2.1 | Ark UI React 5.39.1 | Base UI React 1.8.0 |
| --------------- | -------------------- | ------------------- | ------------------- |
| accordion       | 4.4 KiB / 4.0 KiB    | 11.4 KiB / 10.3 KiB | 9.2 KiB / 8.3 KiB   |
| alert-dialog    | 13.5 KiB / 12.1 KiB  | 19.5 KiB / 17.6 KiB | 23.0 KiB / 20.7 KiB |
| avatar          | 2.6 KiB / 2.4 KiB    | 6.8 KiB / 6.1 KiB   | 4.3 KiB / 3.9 KiB   |
| button          | 1.2 KiB / 1.1 KiB    | N/A                 | 3.2 KiB / 2.9 KiB   |
| carousel        | 9.5 KiB / 8.6 KiB    | 14.4 KiB / 13.0 KiB | N/A                 |
| checkbox        | 6.0 KiB / 5.4 KiB    | 10.4 KiB / 9.4 KiB  | 8.0 KiB / 7.2 KiB   |
| checkbox-group  | 6.8 KiB / 6.1 KiB    | 10.4 KiB / 9.4 KiB  | 4.3 KiB / 3.9 KiB   |
| collapsible     | 4.6 KiB / 4.1 KiB    | 9.0 KiB / 8.1 KiB   | 7.3 KiB / 6.6 KiB   |
| combobox        | 29.0 KiB / 25.9 KiB  | 33.6 KiB / 29.9 KiB | 50.2 KiB / 44.3 KiB |
| context-menu    | 28.0 KiB / 24.7 KiB  | 32.6 KiB / 29.1 KiB | 51.9 KiB / 45.0 KiB |
| dialog          | 11.2 KiB / 10.0 KiB  | 19.5 KiB / 17.6 KiB | 23.1 KiB / 20.8 KiB |
| drawer          | 13.5 KiB / 12.1 KiB  | 29.4 KiB / 26.1 KiB | 37.4 KiB / 33.2 KiB |
| dropzone        | 4.4 KiB / 3.9 KiB    | 13.5 KiB / 12.1 KiB | N/A                 |
| field           | 10.0 KiB / 9.1 KiB   | 4.3 KiB / 3.8 KiB   | 9.4 KiB / 8.5 KiB   |
| input           | 2.6 KiB / 2.4 KiB    | N/A                 | 9.4 KiB / 8.6 KiB   |
| input-otp       | 5.6 KiB / 5.1 KiB    | 10.5 KiB / 9.5 KiB  | 8.6 KiB / 7.8 KiB   |
| menu            | 27.3 KiB / 24.2 KiB  | 32.6 KiB / 29.1 KiB | 51.2 KiB / 44.4 KiB |
| navigation-menu | 23.9 KiB / 21.3 KiB  | 18.2 KiB / 16.4 KiB | 37.7 KiB / 33.3 KiB |
| popover         | 21.0 KiB / 18.9 KiB  | 30.0 KiB / 26.7 KiB | 40.3 KiB / 35.4 KiB |
| preview-card    | 19.2 KiB / 17.3 KiB  | 23.1 KiB / 20.8 KiB | 32.6 KiB / 28.9 KiB |
| progress        | 2.7 KiB / 2.5 KiB    | 7.8 KiB / 7.1 KiB   | 3.3 KiB / 2.9 KiB   |
| radio           | 5.5 KiB / 5.0 KiB    | 10.7 KiB / 9.7 KiB  | 7.6 KiB / 6.9 KiB   |
| radio-group     | 8.6 KiB / 7.7 KiB    | 10.7 KiB / 9.7 KiB  | 7.4 KiB / 6.7 KiB   |
| scroll-area     | 4.6 KiB / 4.1 KiB    | 11.9 KiB / 10.7 KiB | 7.8 KiB / 7.0 KiB   |
| select          | 30.6 KiB / 27.2 KiB  | 32.9 KiB / 29.4 KiB | 43.8 KiB / 38.9 KiB |
| slider          | 7.9 KiB / 7.1 KiB    | 14.3 KiB / 12.9 KiB | 14.1 KiB / 12.7 KiB |
| switch          | 4.8 KiB / 4.3 KiB    | 9.8 KiB / 8.8 KiB   | 6.0 KiB / 5.4 KiB   |
| tabs            | 6.5 KiB / 5.9 KiB    | 12.5 KiB / 11.3 KiB | 13.2 KiB / 12.0 KiB |
| toast           | 5.9 KiB / 5.2 KiB    | 13.7 KiB / 12.4 KiB | 25.9 KiB / 23.3 KiB |
| toggle          | 3.2 KiB / 3.0 KiB    | 5.8 KiB / 5.3 KiB   | 4.8 KiB / 4.3 KiB   |
| toggle-group    | 5.2 KiB / 4.8 KiB    | 8.5 KiB / 7.7 KiB   | 6.0 KiB / 5.4 KiB   |
| tooltip         | 19.8 KiB / 17.9 KiB  | 21.7 KiB / 19.5 KiB | 33.7 KiB / 29.8 KiB |

## React overlap bundles

In the 28-component combined bundle, Starwind is 18.4% larger than Ark UI React and 0.3% smaller than Base UI React. Shared code is counted once in each bundle.

| Overlap                               | Components | Starwind React 1.2.1  | Ark UI React 5.39.1   | Base UI React 1.8.0   |
| ------------------------------------- | ---------- | --------------------- | --------------------- | --------------------- |
| React three-way category overlap      | 28         | 148.0 KiB / 110.6 KiB | 125.0 KiB / 98.2 KiB  | 148.5 KiB / 122.6 KiB |
| Starwind / Ark React category overlap | 30         | 159.9 KiB / 120.6 KiB | 138.3 KiB / 108.8 KiB | N/A                   |
| Starwind / Base UI category overlap   | 30         | 148.6 KiB / 111.0 KiB | N/A                   | 148.6 KiB / 122.6 KiB |

### React complete package-root diagnostic

This secondary row retains every public root export. It is useful for package-wide trend checks. Normal apps should prefer component subpaths.

| Library        | Complete root gzip / Brotli |
| -------------- | --------------------------- |
| Starwind React | 193.2 KiB / 147.5 KiB       |
| Ark UI React   | 291.3 KiB / 229.4 KiB       |
| Base UI React  | 159.0 KiB / 130.4 KiB       |

## Vue individual components

| Component       | Starwind Vue 0.1.1  | Ark UI Vue 5.39.1   | Reka UI 2.10.4      |
| --------------- | ------------------- | ------------------- | ------------------- |
| accordion       | 4.8 KiB / 4.3 KiB   | 12.4 KiB / 11.2 KiB | 8.3 KiB / 7.4 KiB   |
| alert-dialog    | 13.8 KiB / 12.3 KiB | 20.3 KiB / 18.3 KiB | 12.2 KiB / 10.8 KiB |
| avatar          | 2.8 KiB / 2.5 KiB   | 7.2 KiB / 6.6 KiB   | 2.7 KiB / 2.4 KiB   |
| button          | 1.3 KiB / 1.2 KiB   | N/A                 | N/A                 |
| carousel        | 9.7 KiB / 8.7 KiB   | 15.3 KiB / 13.7 KiB | N/A                 |
| checkbox        | 6.0 KiB / 5.4 KiB   | 11.3 KiB / 10.2 KiB | 9.3 KiB / 8.3 KiB   |
| checkbox-group  | 6.9 KiB / 6.2 KiB   | 11.3 KiB / 10.2 KiB | N/A                 |
| collapsible     | 5.4 KiB / 4.9 KiB   | 9.4 KiB / 8.5 KiB   | 4.9 KiB / 4.4 KiB   |
| combobox        | 28.6 KiB / 25.5 KiB | 34.6 KiB / 30.7 KiB | 41.5 KiB / 36.5 KiB |
| context-menu    | 28.7 KiB / 25.2 KiB | 33.5 KiB / 29.8 KiB | 29.9 KiB / 26.2 KiB |
| dialog          | 11.8 KiB / 10.6 KiB | 20.3 KiB / 18.3 KiB | 11.3 KiB / 10.1 KiB |
| drawer          | 13.7 KiB / 12.3 KiB | 30.2 KiB / 26.8 KiB | N/A                 |
| dropzone        | 4.7 KiB / 4.1 KiB   | 14.6 KiB / 13.0 KiB | N/A                 |
| field           | 10.6 KiB / 9.5 KiB  | 4.8 KiB / 4.3 KiB   | N/A                 |
| input           | 2.6 KiB / 2.4 KiB   | N/A                 | N/A                 |
| input-otp       | 6.0 KiB / 5.4 KiB   | 10.9 KiB / 9.9 KiB  | 5.8 KiB / 5.2 KiB   |
| menu            | 28.6 KiB / 25.3 KiB | 33.5 KiB / 29.8 KiB | 30.5 KiB / 26.8 KiB |
| navigation-menu | 24.9 KiB / 22.1 KiB | 18.8 KiB / 16.9 KiB | 12.8 KiB / 11.5 KiB |
| popover         | 21.6 KiB / 19.4 KiB | 30.9 KiB / 27.5 KiB | 22.3 KiB / 19.8 KiB |
| preview-card    | 19.7 KiB / 17.8 KiB | 23.7 KiB / 21.3 KiB | 19.9 KiB / 17.7 KiB |
| progress        | 3.0 KiB / 2.7 KiB   | 8.3 KiB / 7.6 KiB   | 3.0 KiB / 2.7 KiB   |
| radio           | 5.8 KiB / 5.2 KiB   | 11.5 KiB / 10.3 KiB | 9.7 KiB / 8.7 KiB   |
| radio-group     | 8.6 KiB / 7.8 KiB   | 11.5 KiB / 10.3 KiB | 9.7 KiB / 8.7 KiB   |
| scroll-area     | 5.0 KiB / 4.5 KiB   | 12.3 KiB / 11.0 KiB | 8.7 KiB / 7.6 KiB   |
| select          | 30.5 KiB / 27.1 KiB | 34.0 KiB / 30.2 KiB | 30.6 KiB / 27.1 KiB |
| slider          | 8.2 KiB / 7.4 KiB   | 15.0 KiB / 13.5 KiB | 7.8 KiB / 6.9 KiB   |
| switch          | 5.0 KiB / 4.5 KiB   | 10.4 KiB / 9.4 KiB  | 4.0 KiB / 3.6 KiB   |
| tabs            | 7.0 KiB / 6.3 KiB   | 12.8 KiB / 11.5 KiB | 7.5 KiB / 6.7 KiB   |
| toast           | 6.4 KiB / 5.6 KiB   | 14.4 KiB / 13.0 KiB | 10.4 KiB / 9.3 KiB  |
| toggle          | 3.4 KiB / 3.1 KiB   | 6.2 KiB / 5.7 KiB   | 3.7 KiB / 3.3 KiB   |
| toggle-group    | 5.3 KiB / 4.8 KiB   | 8.8 KiB / 8.0 KiB   | 8.0 KiB / 7.2 KiB   |
| tooltip         | 20.3 KiB / 18.3 KiB | 22.3 KiB / 20.1 KiB | 20.6 KiB / 18.4 KiB |

## Vue overlap bundles

In the 25-component combined bundle, Starwind is 18.5% larger than Ark UI Vue and 45.1% larger than Reka UI. Shared code is counted once in each bundle.

| Overlap                             | Components | Starwind Vue 0.1.1    | Ark UI Vue 5.39.1     | Reka UI 2.10.4       |
| ----------------------------------- | ---------- | --------------------- | --------------------- | -------------------- |
| Vue three-way category overlap      | 25         | 147.2 KiB / 105.2 KiB | 124.2 KiB / 94.9 KiB  | 101.5 KiB / 81.6 KiB |
| Starwind / Ark Vue category overlap | 30         | 172.1 KiB / 126.2 KiB | 154.4 KiB / 118.0 KiB | N/A                  |
| Starwind / Reka UI category overlap | 25         | 147.2 KiB / 105.2 KiB | N/A                   | 101.5 KiB / 81.6 KiB |

### Vue complete package-root diagnostic

This secondary row retains every public root export. It is useful for package-wide trend checks. Normal apps should prefer component subpaths.

| Library      | Complete root gzip / Brotli |
| ------------ | --------------------------- |
| Starwind Vue | 206.9 KiB / 154.2 KiB       |
| Ark UI Vue   | 317.7 KiB / 246.0 KiB       |
| Reka UI      | 206.7 KiB / 156.9 KiB       |

## Astro versus React site delivery

For the Starwind Select site, Astro sends 24.1 KiB gzip initially. React sends 88.9 KiB because the visitor also receives React and React DOM.

Total initial JS is the visitor-facing number for the controlled entry. The added column isolates the component cost above each framework's empty shell.

| Scenario              | Starwind target | Total initial gzip / Brotli | Component-added JS gzip / Brotli |
| --------------------- | --------------- | --------------------------- | -------------------------------- |
| Empty                 | Astro           | 0.0 KiB / 0.0 KiB           | 0.0 KiB / 0.0 KiB                |
| Empty                 | React           | 58.8 KiB / 50.6 KiB         | 0.0 KiB / 0.0 KiB                |
| Select                | Astro           | 24.1 KiB / 21.7 KiB         | 24.1 KiB / 21.7 KiB              |
| Select                | React           | 88.9 KiB / 77.2 KiB         | 30.0 KiB / 26.6 KiB              |
| Form                  | Astro           | 40.3 KiB / 33.8 KiB         | 40.3 KiB / 33.8 KiB              |
| Form                  | React           | 111.4 KiB / 94.2 KiB        | 52.6 KiB / 43.6 KiB              |
| Overlays              | Astro           | 33.5 KiB / 28.3 KiB         | 33.5 KiB / 28.3 KiB              |
| Overlays              | React           | 100.9 KiB / 85.5 KiB        | 42.1 KiB / 34.8 KiB              |
| Full Category Overlap | Astro           | 106.0 KiB / 81.2 KiB        | 106.0 KiB / 81.2 KiB             |
| Full Category Overlap | React           | 207.1 KiB / 160.9 KiB       | 148.3 KiB / 110.2 KiB            |

## Method

- Individual rows retain the complete component subpath surface through namespace imports. Reka UI uses all named exports with the component prefix because it publishes one package root.
- Overlap rows import all matched component surfaces into one bundle. Shared code is counted once.
- Synthetic bundles are minified with esbuild. Gzip uses level 9. Brotli uses quality 11.
- Competitor values come from versioned snapshots. Normal Starwind refreshes do not install or bundle competitors.
- Site totals come from controlled browser entries. The Astro entry imports the named Runtime controllers that rendered Astro roots require. Astro component source runs at build time and adds no framework adapter to the browser. The React entry renders named Primitive parts and includes React plus React DOM.
- Site values exclude CSS, application code, images, and network headers. Component-added values subtract the same framework's empty entry.

## Refresh commands

```bash
# Normal offline refresh: rebuild Starwind, measure site entries, and rewrite this report.
pnpm runtime:size:product

# Occasional comparator refresh after a material release.
pnpm runtime:size:comparators:refresh --ark-react
pnpm runtime:size:comparators:refresh --base-react
pnpm runtime:size:comparators:refresh --ark-vue
pnpm runtime:size:comparators:refresh --reka-vue
```
