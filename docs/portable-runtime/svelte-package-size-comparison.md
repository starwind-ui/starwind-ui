# Svelte Primitive browser-module sizes

Captured: 2026-09-15T13:10:16.852Z

Starwind is a Svelte development build. Comparators: Ark UI 5.24.2 and Bits UI 2.19.2.

## Quick comparison

**The shared 25-family bundle:** Starwind is 47.5% larger than Ark UI and 61.5% larger than Bits UI in eager gzip bytes. This bundle imports the same category list from each provider and counts shared code once.

Lower is smaller. Values below use **gzip KiB** (1 KiB = 1,024 bytes) for JavaScript reachable through initial imports.

| Import scope                    | Starwind | Ark UI | Bits UI |
| ------------------------------- | -------: | -----: | ------: |
| Dialog alone                    |     11.5 |   20.4 |    15.3 |
| Select alone                    |     32.2 |   33.9 |    33.7 |
| Combobox alone                  |     31.4 |   34.4 |    33.0 |
| Navigation Menu alone           |     25.6 |   18.8 |    17.0 |
| All 25 shared families together |    158.9 |  107.8 |    98.4 |

Across individual imports, Starwind has a smaller eager gzip result in 29 of 32 comparable rows against Ark UI and 16 of 26 comparable rows against Bits UI. Some rows map to the same underlying component. Component APIs and included features differ, so this count describes the measured imports.

**Read the deferred bytes too.** The shared bundle emits additional JavaScript outside these eager totals:

| Additional deferred JavaScript       | Starwind | Ark UI | Bits UI |
| ------------------------------------ | -------: | -----: | ------: |
| Raw minified KiB, before compression |     60.3 |    0.0 |     0.0 |

Deferred files load when their dynamic imports execute. The deferred row uses raw minified bytes before compression; compare it separately from the eager gzip totals. The full tables show which individual imports emit deferred files.

The individual and shared results answer different questions: the cost of one component, and the cost after several components share dependencies. Together, these tables expose the effect of combining component imports. Svelte itself is excluded uniformly; required behavior code is included.

## Builds and comparison coverage

94 rows measure individual imports: 36 Starwind, 32 Ark UI and 26 Bits UI. Another 7 measure combined imports: two for each pairwise category overlap and three for the common overlap. These are small synthetic bundles; the count describes import coverage.

Individual builds expose expensive dependencies in a single import. Combined builds measure dependency sharing, which cannot be recovered by adding individual sizes. This saved capture compiled all 101 rows, including 6 identical alias entries. The current runner reuses those alias outputs and needs 95 distinct builds for the same coverage. The saved measurements remain unchanged.

<details>
<summary>Full component tables, mappings and measurement method</summary>

## Individual component detail

Each cell gives raw minified / gzip / Brotli JavaScript bytes. Svelte and its subpaths are external for every provider. Required behavior dependencies, including Starwind Runtime, are bundled.

| Family          | Starwind               | Ark UI                 | Bits UI                |
| --------------- | ---------------------- | ---------------------- | ---------------------- |
| accordion       | 17478 / 5930 / 5370    | 36358 / 12216 / 11037  | 27039 / 8664 / 7747    |
| alert-dialog    | 48598 / 13722 / 12140  | 63699 / 20847 / 18516  | 53457 / 15814 / 14072  |
| avatar          | 7517 / 2618 / 2331     | 20001 / 7435 / 6730    | 15621 / 5557 / 4981    |
| button          | 5029 / 2019 / 1799     | N/A                    | 882 / 534 / 453        |
| carousel        | 25998 / 9731 / 8805    | 46721 / 15287 / 13808  | N/A                    |
| checkbox        | 30350 / 9528 / 8532    | 31988 / 11203 / 10095  | 20344 / 7004 / 6220    |
| checkbox-group  | 34723 / 10214 / 9199   | 31988 / 11203 / 10095  | 20344 / 7004 / 6220    |
| collapsible     | 16123 / 5536 / 5005    | 26703 / 9549 / 8650    | 19994 / 6848 / 6120    |
| color-picker    | 81070 / 18340 / 16187  | 124178 / 37854 / 33641 | N/A                    |
| combobox        | 117708 / 32187 / 28255 | 111490 / 35177 / 31031 | 121743 / 33753 / 29605 |
| context-menu    | 104499 / 29677 / 25956 | 106638 / 34361 / 30221 | 140583 / 38475 / 33294 |
| dialog          | 41446 / 11804 / 10523  | 63699 / 20847 / 18516  | 52161 / 15647 / 13985  |
| drawer          | 48347 / 13772 / 12174  | 98162 / 30683 / 26994  | N/A                    |
| dropzone        | 21554 / 6979 / 6197    | 42329 / 14444 / 12922  | N/A                    |
| field           | 42202 / 11376 / 10236  | 15460 / 5192 / 4621    | N/A                    |
| fieldset        | 8850 / 2660 / 2388     | 9601 / 3570 / 3165     | N/A                    |
| form            | 75117 / 18337 / 16333  | N/A                    | N/A                    |
| input           | 6820 / 2569 / 2324     | N/A                    | N/A                    |
| input-otp       | 28632 / 8918 / 8045    | 31524 / 11082 / 9987   | 24286 / 8526 / 7657    |
| menu            | 100680 / 28847 / 25420 | 106638 / 34361 / 30221 | 139687 / 38179 / 33054 |
| navigation-menu | 93016 / 26222 / 23135  | 59689 / 19268 / 17263  | 63086 / 17449 / 15457  |
| popover         | 71042 / 21761 / 19468  | 93756 / 31659 / 27978  | 104635 / 30612 / 26960 |
| preview-card    | 62022 / 19759 / 17857  | 70148 / 24643 / 21817  | 99662 / 29941 / 26399  |
| progress        | 11276 / 3472 / 3117    | 23802 / 8291 / 7514    | 10002 / 4059 / 3671    |
| radio           | 28615 / 9035 / 8090    | 33290 / 11457 / 10307  | 19996 / 7092 / 6324    |
| radio-group     | 44308 / 12264 / 11017  | 33290 / 11457 / 10307  | 19996 / 7092 / 6324    |
| scroll-area     | 19007 / 5225 / 4631    | 36336 / 12450 / 11241  | 44277 / 12010 / 10558  |
| select          | 110041 / 32967 / 29144 | 108101 / 34690 / 30607 | 124156 / 34505 / 30174 |
| sidebar         | 27218 / 7515 / 6640    | N/A                    | N/A                    |
| slider          | 38578 / 11166 / 9938   | 45113 / 15117 / 13623  | 37197 / 10115 / 8983   |
| switch          | 25676 / 8142 / 7320    | 29113 / 10480 / 9449   | 15174 / 5644 / 4993    |
| tabs            | 22437 / 7057 / 6340    | 37650 / 12986 / 11700  | 20512 / 6959 / 6203    |
| toast           | 23359 / 6649 / 5913    | 42650 / 14654 / 13223  | N/A                    |
| toggle          | 10621 / 3519 / 3220    | 17577 / 6734 / 6087    | 10307 / 4163 / 3764    |
| toggle-group    | 19139 / 5626 / 5128    | 24564 / 9148 / 8284    | 18367 / 6619 / 5944    |
| tooltip         | 62579 / 20348 / 18408  | 66209 / 23090 / 20525  | 109285 / 31959 / 28118 |

## Shared bundles

Each overlap compiles its listed families together. Repeated descriptors and shared code count once. Adding individual rows would count shared code repeatedly.

| Overlap       | Families | Starwind                 | Ark UI                   | Bits UI                 |
| ------------- | -------- | ------------------------ | ------------------------ | ----------------------- |
| starwind-ark  | 32       | 863006 / 210704 / 145686 | 615443 / 160367 / 122337 | N/A                     |
| starwind-bits | 26       | 670679 / 163705 / 110291 | N/A                      | 450142 / 100975 / 76514 |
| three-way     | 25       | 666216 / 162759 / 109863 | 424777 / 110346 / 84930  | 449371 / 100804 / 76363 |

**starwind-ark:** accordion, alert-dialog, avatar, carousel, checkbox, checkbox-group, collapsible, color-picker, combobox, context-menu, dialog, drawer, dropzone, field, fieldset, input-otp, menu, navigation-menu, popover, preview-card, progress, radio, radio-group, scroll-area, select, slider, switch, tabs, toast, toggle, toggle-group, tooltip.

**starwind-bits:** accordion, alert-dialog, avatar, button, checkbox, checkbox-group, collapsible, combobox, context-menu, dialog, input-otp, menu, navigation-menu, popover, preview-card, progress, radio, radio-group, scroll-area, select, slider, switch, tabs, toggle, toggle-group, tooltip.

**three-way:** accordion, alert-dialog, avatar, checkbox, checkbox-group, collapsible, combobox, context-menu, dialog, input-otp, menu, navigation-menu, popover, preview-card, progress, radio, radio-group, scroll-area, select, slider, switch, tabs, toggle, toggle-group, tooltip.

## Package and compiler inputs

| Package                      | Version |
| ---------------------------- | ------- |
| @starwind-ui/svelte          | 0.0.0   |
| @starwind-ui/runtime         | 1.2.1   |
| @ark-ui/svelte               | 5.24.2  |
| bits-ui                      | 2.19.2  |
| svelte                       | 5.57.0  |
| vite                         | 7.3.5   |
| @sveltejs/vite-plugin-svelte | 6.2.1   |
| @internationalized/date      | 3.12.4  |
| @floating-ui/dom             | 1.7.6   |
| embla-carousel               | 8.6.0   |

Host: darwin arm64, Apple M5 Pro, 18 logical CPUs, Node v24.20.0, pnpm 11.8.0.

## Category mappings

Starwind retains every runtime export from each component subpath. Ark retains every runtime export from each mapped component subpath. Bits retains the complete explicitly named namespace from its root export. Types contribute no runtime bytes.

| Family          | Ark surface     | Bits namespace |
| --------------- | --------------- | -------------- |
| accordion       | accordion       | Accordion      |
| alert-dialog    | dialog          | AlertDialog    |
| avatar          | avatar          | Avatar         |
| button          | N/A             | Button         |
| carousel        | carousel        | N/A            |
| checkbox        | checkbox        | Checkbox       |
| checkbox-group  | checkbox        | Checkbox       |
| collapsible     | collapsible     | Collapsible    |
| color-picker    | color-picker    | N/A            |
| combobox        | combobox        | Combobox       |
| context-menu    | menu            | ContextMenu    |
| dialog          | dialog          | Dialog         |
| drawer          | drawer          | N/A            |
| dropzone        | file-upload     | N/A            |
| field           | field           | N/A            |
| fieldset        | fieldset        | N/A            |
| form            | N/A             | N/A            |
| input           | N/A             | N/A            |
| input-otp       | pin-input       | PinInput       |
| menu            | menu            | DropdownMenu   |
| navigation-menu | navigation-menu | NavigationMenu |
| popover         | popover         | Popover        |
| preview-card    | hover-card      | LinkPreview    |
| progress        | progress        | Progress       |
| radio           | radio-group     | RadioGroup     |
| radio-group     | radio-group     | RadioGroup     |
| scroll-area     | scroll-area     | ScrollArea     |
| select          | select          | Select         |
| sidebar         | N/A             | N/A            |
| slider          | slider          | Slider         |
| switch          | switch          | Switch         |
| tabs            | tabs            | Tabs           |
| toast           | toast           | N/A            |
| toggle          | toggle          | Toggle         |
| toggle-group    | toggle-group    | ToggleGroup    |
| tooltip         | tooltip         | Tooltip        |

Aliases share the mapped public surface: Ark Alert Dialog uses Dialog; Checkbox Group uses Checkbox; Context Menu uses Menu; Dropzone uses File Upload; Input OTP uses Pin Input; Preview Card uses Hover Card; Radio uses Radio Group. Bits Checkbox Group uses Checkbox, Radio uses RadioGroup, Menu uses DropdownMenu, and Preview Card uses LinkPreview. N/A indicates that the audited package supplies no selected category surface.

## Method and limits

The official Vite Svelte plugin compiles components and rune modules for a production client build. The target is ES2020 with esbuild minification. An observable global array retains each complete family namespace. The compiler may remove exports that have no runtime value.

The output graph defines the eager JavaScript closure. Its ordered files are concatenated before gzip level 9 and Brotli quality 11 compression, using the same synthetic compression method as the React comparison. Emitted assets and deferred JavaScript are recorded separately. Compression of this synthetic concatenation differs from serving each file separately.

These values measure delivered Primitive adapters with their required behavior dependencies. Public surface breadth and implemented behavior differ across libraries. Framework glue and Runtime execution cannot be isolated by subtracting unrelated rows. The table does not describe a Styled page, an npm archive, actual network transfer, or equivalent task behavior. Theme, Styled components, copied theme CSS and CLI installation are excluded.

## Deferred JavaScript

These files are outside the eager totals above. Starwind form-related surfaces retain dynamic Runtime imports for additional form controls. Loading a deferred control can fetch these files. This observation warrants a separate import-scope investigation.

| Measurement                    | Deferred raw minified bytes | All emitted raw minified bytes |
| ------------------------------ | --------------------------- | ------------------------------ |
| starwind-svelte/checkbox       | 252176                      | 282526                         |
| starwind-svelte/checkbox-group | 243866                      | 278589                         |
| starwind-svelte/combobox       | 191443                      | 309151                         |
| starwind-svelte/dropzone       | 258620                      | 280174                         |
| starwind-svelte/field          | 267047                      | 309249                         |
| starwind-svelte/form           | 266745                      | 341862                         |
| starwind-svelte/input-otp      | 252380                      | 281012                         |
| starwind-svelte/radio          | 252695                      | 281310                         |
| starwind-svelte/radio-group    | 235829                      | 280137                         |
| starwind-svelte/select         | 184771                      | 294812                         |
| starwind-svelte/slider         | 243098                      | 281676                         |
| starwind-svelte/switch         | 255390                      | 281066                         |
| starwind-svelte/starwind-ark   | 2523                        | 865529                         |
| starwind-svelte/starwind-bits  | 61749                       | 732428                         |
| starwind-svelte/three-way      | 61749                       | 727965                         |

15 measurements emit deferred JavaScript. 5 measurements emit assets outside the JavaScript totals. The evidence records those counts and asset bytes per measurement.

[Measured values and input digests](performance-evidence/svelte/2026-09-15-size-52081c63a5ca/sizes.json) reproduce every table cell. Provider scope follows the [Ark UI documentation](https://ark-ui.com/docs/overview/about) and [Bits UI documentation](https://www.bits-ui.com/docs/introduction). Compiler settings follow the [official Svelte plugin](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md).

</details>
