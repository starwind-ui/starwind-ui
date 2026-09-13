# Retained React stress fixture audit

The native task capture remains the current Menu, Select, Combobox, and submenu comparison. This
suite adds five large workloads with one excluded warmup and five fresh measured contexts per
provider. A context mounts once and receives one trusted input. The input clock starts in the
browser's capture listener and ends when the required DOM state is observed. Full item and form
inventories are checked before input and after the timed endpoint.

| Workload        | Public integration and checked work                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog          | Each provider uses its Dialog Root, Trigger, and content. The closed fixture has 10,000 outside nodes. Open content and focus inside are required.                                                                                                                                                                                                                                                                                                                                           |
| Navigation Menu | Each root starts at `primary` through `defaultValue`. Two sources contain 500 links each. The list uses the legacy horizontal flex row so the first panel leaves the second trigger reachable. An untimed center hit test checks that point before input. The pointer starts outside the target. A trusted pointer entry on the second trigger must make `target` active and visible while `primary` becomes inactive. No click follows. The capture listener runs before provider handlers. |
| Tabs            | The first of 1,000 tabs starts selected. All 1,000 panels stay in the DOM. Ark uses manual activation; each provider selects the last tab by click.                                                                                                                                                                                                                                                                                                                                          |
| Accordion       | All 1,000 initially closed items and panels stay mounted. The last item expands by click.                                                                                                                                                                                                                                                                                                                                                                                                    |
| Radio Group     | The first of 1,000 radios starts selected. A single click selects the last item. Native `choice` submission and exactly one checked input are required. This replaces the archived 1,000-click sweep.                                                                                                                                                                                                                                                                                        |

Starwind uses its generated React adapter, Base UI uses its 1.8.0 public parts, and Ark UI uses
its 5.39.1 public parts. Ark Radio Group includes `ItemHiddenInput`; its Tabs and Accordion keep
the default retained content policy. Each production entry imports only its provider. The build
records separate dependency and bundle hashes. Closed or inactive content may use different DOM
presence across providers; the report records the observed counts and checks the declared panels.

Ark API references: [Dialog](https://ark-ui.com/docs/components/dialog),
[Navigation Menu](https://ark-ui.com/docs/components/navigation-menu),
[Tabs](https://ark-ui.com/docs/components/tabs),
[Accordion](https://ark-ui.com/docs/components/accordion), and
[Radio Group](https://ark-ui.com/docs/components/radio-group).
