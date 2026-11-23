# Unstyled library browser-size comparison

Generated: 2026-11-21T20:29:25.288Z

This report measures JavaScript that a browser downloads. Synthetic component rows bundle each complete public component surface. React, React DOM, and Vue are external in those rows. Gzip and Brotli use the same minified output.

## Small imports for the components your page uses

Starwind UI has the smallest imports in the majority of comparisons.

For a page that uses a few components, start with individual import sizes. This scorecard compares gzip sizes across the component categories measured for both libraries in each pair.

| Comparison                         | Starwind smaller | Median reduction per component |
| ---------------------------------- | ---------------- | ------------------------------ |
| Starwind UI React vs Ark UI React  | **28 of 30**     | **44.0%**                      |
| Starwind UI React vs Base UI React | **28 of 30**     | **40.6%**                      |
| Starwind UI Vue vs Ark UI Vue      | **28 of 30**     | **44.1%**                      |
| Starwind UI Vue vs Reka UI Vue     | **14 of 25**     | **2.0%**                       |

The median includes every shared measured category, including rows where Starwind is larger. The smaller count excludes ties. A page with several components needs a combined measurement to account for shared code.

## React individual components

| Component       | Starwind React 1.5.0 | Ark UI React 5.40.0 | Base UI React 1.9.0 |
| --------------- | -------------------- | ------------------- | ------------------- |
| accordion       | 4.4 KiB / 4.0 KiB    | 11.6 KiB / 10.5 KiB | 9.7 KiB / 8.8 KiB   |
| alert-dialog    | 14.0 KiB / 12.6 KiB  | 20.8 KiB / 18.7 KiB | 23.7 KiB / 21.3 KiB |
| avatar          | 2.4 KiB / 2.2 KiB    | 7.0 KiB / 6.3 KiB   | 4.4 KiB / 4.0 KiB   |
| button          | 1.1 KiB / 1.0 KiB    | N/A                 | 3.2 KiB / 2.9 KiB   |
| carousel        | 9.8 KiB / 8.9 KiB    | 14.7 KiB / 13.3 KiB | N/A                 |
| checkbox        | 6.0 KiB / 5.4 KiB    | 10.8 KiB / 9.7 KiB  | 8.5 KiB / 7.7 KiB   |
| checkbox-group  | 6.7 KiB / 6.0 KiB    | 10.8 KiB / 9.7 KiB  | 4.3 KiB / 4.0 KiB   |
| collapsible     | 4.6 KiB / 4.2 KiB    | 9.2 KiB / 8.3 KiB   | 7.7 KiB / 7.0 KiB   |
| combobox        | 31.1 KiB / 27.9 KiB  | 35.2 KiB / 31.3 KiB | 52.0 KiB / 45.8 KiB |
| context-menu    | 28.9 KiB / 25.8 KiB  | 34.1 KiB / 30.4 KiB | 62.0 KiB / 54.0 KiB |
| dialog          | 11.7 KiB / 10.6 KiB  | 20.8 KiB / 18.7 KiB | 23.8 KiB / 21.3 KiB |
| drawer          | 13.9 KiB / 12.5 KiB  | 30.8 KiB / 27.3 KiB | 38.4 KiB / 34.1 KiB |
| dropzone        | 4.2 KiB / 3.7 KiB    | 13.9 KiB / 12.5 KiB | N/A                 |
| field           | 8.7 KiB / 7.9 KiB    | 4.4 KiB / 3.9 KiB   | 10.0 KiB / 9.0 KiB  |
| input           | 2.4 KiB / 2.2 KiB    | N/A                 | 9.7 KiB / 8.8 KiB   |
| input-otp       | 5.4 KiB / 4.9 KiB    | 11.0 KiB / 10.0 KiB | 9.6 KiB / 8.7 KiB   |
| menu            | 28.4 KiB / 25.4 KiB  | 34.1 KiB / 30.4 KiB | 61.3 KiB / 53.3 KiB |
| navigation-menu | 24.5 KiB / 22.0 KiB  | 18.9 KiB / 17.0 KiB | 38.7 KiB / 34.2 KiB |
| popover         | 22.0 KiB / 19.8 KiB  | 31.2 KiB / 27.8 KiB | 41.0 KiB / 36.3 KiB |
| preview-card    | 20.3 KiB / 18.3 KiB  | 24.0 KiB / 21.6 KiB | 33.1 KiB / 29.5 KiB |
| progress        | 2.6 KiB / 2.3 KiB    | 8.1 KiB / 7.4 KiB   | 3.5 KiB / 3.1 KiB   |
| radio           | 5.5 KiB / 4.9 KiB    | 11.1 KiB / 10.0 KiB | 8.2 KiB / 7.3 KiB   |
| radio-group     | 8.2 KiB / 7.4 KiB    | 11.1 KiB / 10.0 KiB | 7.5 KiB / 6.7 KiB   |
| scroll-area     | 4.8 KiB / 4.3 KiB    | 12.2 KiB / 11.0 KiB | 8.3 KiB / 7.5 KiB   |
| select          | 31.6 KiB / 28.3 KiB  | 34.0 KiB / 30.3 KiB | 45.4 KiB / 40.2 KiB |
| slider          | 7.7 KiB / 6.9 KiB    | 14.5 KiB / 13.1 KiB | 15.0 KiB / 13.4 KiB |
| switch          | 4.5 KiB / 4.0 KiB    | 10.1 KiB / 9.1 KiB  | 6.4 KiB / 5.7 KiB   |
| tabs            | 6.6 KiB / 6.0 KiB    | 12.8 KiB / 11.5 KiB | 13.6 KiB / 12.4 KiB |
| toast           | 5.4 KiB / 4.8 KiB    | 16.0 KiB / 14.4 KiB | 26.4 KiB / 23.8 KiB |
| toggle          | 3.1 KiB / 2.8 KiB    | 6.0 KiB / 5.5 KiB   | 4.8 KiB / 4.4 KiB   |
| toggle-group    | 5.0 KiB / 4.6 KiB    | 8.8 KiB / 8.0 KiB   | 6.1 KiB / 5.4 KiB   |
| tooltip         | 21.1 KiB / 19.0 KiB  | 22.3 KiB / 20.0 KiB | 33.9 KiB / 30.3 KiB |

## React overlap bundles

In the 28-component combined bundle, Starwind is 6.3% larger than Ark UI React and 17.3% smaller than Base UI React. Shared code is counted once in each bundle.

| Overlap                               | Components | Starwind React 1.5.0  | Ark UI React 5.40.0   | Base UI React 1.9.0   |
| ------------------------------------- | ---------- | --------------------- | --------------------- | --------------------- |
| React three-way category overlap      | 28         | 138.5 KiB / 107.5 KiB | 130.3 KiB / 102.2 KiB | 167.3 KiB / 136.7 KiB |
| Starwind / Ark React category overlap | 30         | 150.2 KiB / 117.2 KiB | 143.9 KiB / 113.1 KiB | N/A                   |
| Starwind / Base UI category overlap   | 30         | 139.0 KiB / 107.9 KiB | N/A                   | 167.5 KiB / 137.0 KiB |

### React complete package-root diagnostic

This secondary row retains every public root export. It is useful for package-wide trend checks. Normal apps should prefer component subpaths.

| Library        | Complete root gzip / Brotli |
| -------------- | --------------------------- |
| Starwind React | 224.6 KiB / 181.1 KiB       |
| Ark UI React   | 298.8 KiB / 235.4 KiB       |
| Base UI React  | 178.8 KiB / 145.2 KiB       |

## Vue individual components

| Component       | Starwind Vue 0.4.0  | Ark UI Vue 5.40.0   | Reka UI 2.11.0      |
| --------------- | ------------------- | ------------------- | ------------------- |
| accordion       | 4.8 KiB / 4.3 KiB   | 12.7 KiB / 11.4 KiB | 8.3 KiB / 7.4 KiB   |
| alert-dialog    | 14.6 KiB / 13.1 KiB | 21.5 KiB / 19.3 KiB | 12.4 KiB / 11.0 KiB |
| avatar          | 2.6 KiB / 2.4 KiB   | 7.5 KiB / 6.8 KiB   | 2.7 KiB / 2.4 KiB   |
| button          | 1.2 KiB / 1.1 KiB   | N/A                 | N/A                 |
| carousel        | 10.1 KiB / 9.1 KiB  | 15.6 KiB / 14.0 KiB | N/A                 |
| checkbox        | 6.0 KiB / 5.4 KiB   | 11.7 KiB / 10.5 KiB | 10.1 KiB / 9.1 KiB  |
| checkbox-group  | 6.7 KiB / 6.1 KiB   | 11.7 KiB / 10.5 KiB | N/A                 |
| collapsible     | 5.4 KiB / 4.9 KiB   | 9.6 KiB / 8.7 KiB   | 4.9 KiB / 4.4 KiB   |
| combobox        | 30.4 KiB / 27.2 KiB | 36.2 KiB / 32.0 KiB | 44.7 KiB / 39.0 KiB |
| context-menu    | 30.0 KiB / 26.6 KiB | 35.0 KiB / 31.1 KiB | 30.0 KiB / 26.4 KiB |
| dialog          | 12.6 KiB / 11.3 KiB | 21.5 KiB / 19.3 KiB | 11.5 KiB / 10.3 KiB |
| drawer          | 14.5 KiB / 13.1 KiB | 31.6 KiB / 27.9 KiB | N/A                 |
| dropzone        | 4.5 KiB / 4.0 KiB   | 15.0 KiB / 13.3 KiB | N/A                 |
| field           | 9.4 KiB / 8.4 KiB   | 5.0 KiB / 4.4 KiB   | N/A                 |
| input           | 2.4 KiB / 2.2 KiB   | N/A                 | N/A                 |
| input-otp       | 5.8 KiB / 5.2 KiB   | 11.5 KiB / 10.4 KiB | 5.9 KiB / 5.3 KiB   |
| menu            | 30.0 KiB / 26.6 KiB | 35.0 KiB / 31.1 KiB | 30.6 KiB / 26.8 KiB |
| navigation-menu | 25.7 KiB / 23.0 KiB | 19.6 KiB / 17.6 KiB | 13.0 KiB / 11.6 KiB |
| popover         | 22.8 KiB / 20.4 KiB | 32.1 KiB / 28.6 KiB | 22.2 KiB / 19.7 KiB |
| preview-card    | 21.0 KiB / 18.9 KiB | 24.6 KiB / 22.1 KiB | 19.7 KiB / 17.6 KiB |
| progress        | 2.9 KiB / 2.5 KiB   | 8.6 KiB / 7.8 KiB   | 3.0 KiB / 2.7 KiB   |
| radio           | 5.8 KiB / 5.2 KiB   | 11.8 KiB / 10.6 KiB | 9.8 KiB / 8.8 KiB   |
| radio-group     | 8.3 KiB / 7.4 KiB   | 11.8 KiB / 10.6 KiB | 9.8 KiB / 8.8 KiB   |
| scroll-area     | 5.3 KiB / 4.7 KiB   | 12.5 KiB / 11.2 KiB | 8.7 KiB / 7.6 KiB   |
| select          | 31.7 KiB / 28.3 KiB | 35.1 KiB / 31.2 KiB | 31.2 KiB / 27.7 KiB |
| slider          | 8.1 KiB / 7.2 KiB   | 15.3 KiB / 13.7 KiB | 7.8 KiB / 6.9 KiB   |
| switch          | 4.7 KiB / 4.2 KiB   | 10.7 KiB / 9.6 KiB  | 4.0 KiB / 3.6 KiB   |
| tabs            | 7.0 KiB / 6.3 KiB   | 13.1 KiB / 11.8 KiB | 7.9 KiB / 7.1 KiB   |
| toast           | 6.0 KiB / 5.3 KiB   | 16.6 KiB / 15.0 KiB | 23.4 KiB / 20.8 KiB |
| toggle          | 3.2 KiB / 2.9 KiB   | 6.5 KiB / 5.9 KiB   | 3.7 KiB / 3.3 KiB   |
| toggle-group    | 5.1 KiB / 4.6 KiB   | 9.1 KiB / 8.2 KiB   | 8.4 KiB / 7.5 KiB   |
| tooltip         | 21.8 KiB / 19.6 KiB | 22.9 KiB / 20.7 KiB | 20.5 KiB / 18.3 KiB |

## Vue overlap bundles

In the 25-component combined bundle, Starwind is 9.2% larger than Ark UI Vue and 30.4% larger than Reka UI. Shared code is counted once in each bundle.

| Overlap                             | Components | Starwind Vue 0.4.0    | Ark UI Vue 5.40.0     | Reka UI 2.11.0       |
| ----------------------------------- | ---------- | --------------------- | --------------------- | -------------------- |
| Vue three-way category overlap      | 25         | 141.1 KiB / 105.2 KiB | 129.3 KiB / 98.9 KiB  | 108.2 KiB / 87.0 KiB |
| Starwind / Ark Vue category overlap | 30         | 164.6 KiB / 125.0 KiB | 160.0 KiB / 122.2 KiB | N/A                  |
| Starwind / Reka UI category overlap | 25         | 141.1 KiB / 105.2 KiB | N/A                   | 108.2 KiB / 87.0 KiB |

### Vue complete package-root diagnostic

This secondary row retains every public root export. It is useful for package-wide trend checks. Normal apps should prefer component subpaths.

| Library      | Complete root gzip / Brotli |
| ------------ | --------------------------- |
| Starwind Vue | 241.4 KiB / 191.2 KiB       |
| Ark UI Vue   | 325.8 KiB / 252.0 KiB       |
| Reka UI      | 225.0 KiB / 171.8 KiB       |

## Astro versus React site delivery

For the Starwind Select site, Astro sends 25.0 KiB gzip initially. React sends 98.4 KiB because the visitor also receives React and React DOM.

Total initial JS is the visitor-facing number for the controlled entry. The added column isolates the component cost above each framework's empty shell.

| Scenario              | Starwind target | Total initial gzip / Brotli | Component-added JS gzip / Brotli |
| --------------------- | --------------- | --------------------------- | -------------------------------- |
| Empty                 | Astro           | 0.0 KiB / 0.0 KiB           | 0.0 KiB / 0.0 KiB                |
| Empty                 | React           | 67.3 KiB / 58.0 KiB         | 0.0 KiB / 0.0 KiB                |
| Select                | Astro           | 25.0 KiB / 22.7 KiB         | 25.0 KiB / 22.7 KiB              |
| Select                | React           | 98.4 KiB / 85.5 KiB         | 31.1 KiB / 27.5 KiB              |
| Form                  | Astro           | 37.8 KiB / 33.5 KiB         | 37.8 KiB / 33.5 KiB              |
| Form                  | React           | 116.8 KiB / 100.9 KiB       | 49.5 KiB / 42.9 KiB              |
| Overlays              | Astro           | 34.1 KiB / 29.5 KiB         | 34.1 KiB / 29.5 KiB              |
| Overlays              | React           | 107.8 KiB / 92.5 KiB        | 40.4 KiB / 34.4 KiB              |
| Full Category Overlap | Astro           | 98.8 KiB / 78.6 KiB         | 98.8 KiB / 78.6 KiB              |
| Full Category Overlap | React           | 206.0 KiB / 165.1 KiB       | 138.7 KiB / 107.1 KiB            |

## Starwind chunks

A size row compresses the initial chunks as one file. The per-chunk sum compresses each chunk alone. A gap between the two columns means the bundle splits into many chunks that gzip cannot share across. A row with lazy chunks fetches them only when a page reaches that code.

| Bundle                                | Initial chunks | Joined gzip | Per-chunk gzip sum | Largest chunk | Lazy chunks |
| ------------------------------------- | -------------- | ----------- | ------------------ | ------------- | ----------- |
| React three-way category overlap      | 4              | 138.5 KiB   | 139.8 KiB          | 88.6 KiB      | 2           |
| Starwind / Ark React category overlap | 4              | 150.2 KiB   | 151.7 KiB          | 98.4 KiB      | 2           |
| Starwind / Base UI category overlap   | 4              | 139.0 KiB   | 140.4 KiB          | 89.1 KiB      | 2           |
| React complete package root           | 10             | 224.6 KiB   | 227.5 KiB          | 160.6 KiB     | 4           |
| React field                           | 3              | 8.7 KiB     | 9.3 KiB            | 6.6 KiB       | 3           |
| Vue three-way category overlap        | 1              | 141.1 KiB   | 141.1 KiB          | 141.1 KiB     | 0           |
| Starwind / Ark Vue category overlap   | 4              | 164.6 KiB   | 165.8 KiB          | 112.6 KiB     | 2           |
| Starwind / Reka UI category overlap   | 1              | 141.1 KiB   | 141.1 KiB          | 141.1 KiB     | 0           |
| Vue complete package root             | 10             | 241.4 KiB   | 244.2 KiB          | 177.4 KiB     | 4           |
| Vue field                             | 3              | 9.4 KiB     | 10.0 KiB           | 7.2 KiB       | 3           |
| Astro site Select                     | 1              | 25.0 KiB    | 25.0 KiB           | 25.0 KiB      | 0           |
| Astro site Form                       | 4              | 37.8 KiB    | 38.8 KiB           | 30.5 KiB      | 2           |
| Astro site Overlays                   | 1              | 34.1 KiB    | 34.1 KiB           | 34.1 KiB      | 0           |
| Astro site Full Category Overlap      | 4              | 98.8 KiB    | 100.4 KiB          | 49.6 KiB      | 2           |
| React site Empty                      | 1              | 67.3 KiB    | 67.3 KiB           | 67.3 KiB      | 0           |
| React site Select                     | 1              | 98.4 KiB    | 98.4 KiB           | 98.4 KiB      | 0           |
| React site Form                       | 4              | 116.8 KiB   | 117.7 KiB          | 83.4 KiB      | 2           |
| React site Overlays                   | 1              | 107.8 KiB   | 107.8 KiB          | 107.8 KiB     | 0           |
| React site Full Category Overlap      | 4              | 206.0 KiB   | 207.3 KiB          | 155.9 KiB     | 2           |

### React three-way overlap chunks

| Chunk                                                   | Load    | Gzip     |
| ------------------------------------------------------- | ------- | -------- |
| `entry.js`                                              | Initial | 88.6 KiB |
| `chunks/chunk-6S3CT2PB.js`                              | Initial | 47.7 KiB |
| `chunks/chunk-QUPDSNY2.js`                              | Initial | 1.9 KiB  |
| `chunks/chunk-WHZXTPWP.js`                              | Initial | 1.6 KiB  |
| `chunks/field-color-picker-bridge-QZE6DYM4-GNWOQ4EV.js` | Lazy    | 13.0 KiB |
| `chunks/field-sibling-controls-VYYIM6TC-NVURMSVV.js`    | Lazy    | 2.9 KiB  |

### Vue three-way overlap chunks

| Chunk      | Load    | Gzip      |
| ---------- | ------- | --------- |
| `entry.js` | Initial | 141.1 KiB |

## Method

- Individual rows retain the complete component subpath surface through namespace imports. Reka UI uses all named exports with the component prefix because it publishes one package root.
- Overlap rows import all matched component surfaces into one bundle. Shared code is counted once.
- Synthetic bundles are minified with esbuild. Gzip uses level 9. Brotli uses quality 11.
- Size rows compress the initial chunks of a bundle as one file. The chunk tables compress each chunk alone, because a browser fetches each chunk as its own response. Lazy chunks are outside the size rows.
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
