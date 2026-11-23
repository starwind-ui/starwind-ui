The fixture measures a live direction change in the generated Astro, React, Vue, and Svelte
consumers. The outer RTL scope contains an LTR island. The inner section switches between both
directions while the controls retain focus.

| Control         | Geometry and motion                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carousel        | A 192px horizontal root puts its previous and next button centers 128px from center on opposite sides. The signs exchange in RTL. Slide padding and its 16px compensation follow inline start. The default horizontal chevrons rotate in RTL. A caller's icon keeps its orientation. Vertical controls retain their physical horizontal center, with the existing 90-degree button rotation.          |
| Navigation Menu | Runtime publishes logical next and previous markers. A switch between differently sized items moved the LTR positioner from x=361 to 645; in RTL it moved from x=751 to 467. Automatic physical positioning can snap while data-instant is active. The content fades through opacity. Its transform and translate stay neutral under both motion preferences. The indicator gap follows inline start. |
| Scroll Area     | The 10px vertical rail and corner sit on inline end. Its 1px transparent gutter faces the content. The horizontal thumb starts 1px from the physical right edge in RTL. Ticket 17 covers the native scroll coordinates, asymmetric track padding and physical thumb travel in each browser.                                                                                                           |
| Tabs            | The indicator's left and right offsets measure the active tab's physical box inside the list. A move from the first to second tab publishes right in LTR and left in RTL. Styled Tabs uses the existing Runtime measurements.                                                                                                                                                                         |

The nested examples place a horizontal Carousel inside a vertical slide and a vertical Carousel
inside a horizontal slide. Each case runs in LTR and RTL with wrapped controls. The fixture
measures both control centers, the slide padding, and the container's negative margins. Separate
copies check default arrows and caller icons, including a caller's 45-degree rotation.

The original LTR pages use capture revision `402dacef9d7ce62f0ba31c1d733204b6eef63198`. Replaying the four original cases
matched the saved LTR geometry in all 16 row and framework pairs. The full screenshots include
opposite-direction islands and controls in transition. The stage saves both normal and reduced
motion images for the focused fixture.
