# Native-scroll recovery

Branch: codex/wholeness-native-recovery
Historical reference: 0168b7b6ff8a71bb2a3dabfa3bb09c3f4c3bdd68, including f70a977 and fc86d54.

The historical architecture uses one viewport-height sticky stage, a normal-flow narration sibling overlapping it by one viewport, and local sticky question contents. JavaScript reads individual question geometry to draw wedges; it does not position the stage. Later v4 global timelines and ending clones are intentionally excluded.

At the original v5 HEAD (39f0424), browser measurements showed the stage starting at y=60.5, below the result strip, and moving to y=0 during opening scroll. It then stayed pinned in the tested browser. Thus full mid-story disappearance was not reproduced. The historical negative strip margin plus equal padding also leaves an initial stage offset; copying that rule literally would not satisfy the stationary-from-first-frame requirement. The rebuilt story cancels the strip height without adding it back. The strip remains normal flow.

V5 also added a 6% transform to ordinary narration and transformed the stage during exit, on top of its native sticky containment. Both mechanisms are removed. The final article's remaining height ends the stage's containing block precisely when the question centre reaches its reading position. Native sticky containment then releases the stage at normal scroll speed.

Each hold's height is its measured text height plus 30vh. Its native sticky child therefore holds for exactly 30vh, the same distance used for wedge growth. Text measurement runs on layout changes, not on scrolling. Non-hold narration has no dynamic transform. The constant -50% text transform centres its box at the reading position.

Mobile: stage stacking is above narration; only the visual region has an opaque paper background and feather. The transparent remainder leaves narration readable. Grid columns use minmax(0,1fr). A separate overflow source was the background mock app's fixed 70px heading (387px scroll width at a 320px viewport); responsive typography fixes that source. Root overflow-x:clip is defensive and does not create a nested scrolling ancestor.

## Browser verification

Tested in Codex's in-app browser at 1280x720, 320x640, and 390x844, using interactive scroll, screenshots, and DOM measurements.

- Desktop stage and diagram centre at 360px in a 720px viewport.
- Opening moves 144px for 144px scroll; stage remains at y=0.
- First question text top remains 300.777px across a 72px scroll while wedge radius grows from approximately 150 to 181.
- During final exit, 144px scroll moves stage and final text upward by exactly 144px.
- Narrow mobile document scroll width equals viewport width (320 and 390).
- All six mobile label boxes fit; top label clearance at 320px is approximately 7.9px after correction.
- Narration passes behind the diagram's paper region and feather.
- Spiral path grows to completion at unchanged scrollY=3533; reverse scroll resets it.
- Explore opens existing sections/cards and returns to Wholeness.
- No browser warnings/errors in final check; JavaScript syntax and git whitespace checks pass.

Physical iPhone Safari, browser-toolbar resizing, and subjective trackpad pacing remain to be checked with the user. This is the foundation milestone, not final timing calibration.

## Preserved decisions / next discussion

Only v5 changed. v2/v3/v4 and love-story remain untouched. The shell and placeholder cards remain. Spiral geometry and approximately 4.1-second autonomous animation remain.

Score geometry remains rank-based: radii 190, 272, 354. This does not quantitatively encode score differences and intentionally awaits a separate design decision. No normative mean/SD mapping was introduced.
