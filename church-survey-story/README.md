# Church Survey encounter — first visual prototype

A separate member of the Wholeness result family. Its layout and local sticky holds derive from wholeness-story-v5 at f1dfaf3; no changes to that prototype are required. Diagram geometry and label data derive from pot-plant/potplant.js and pot-plant/languages/*.js.

Open `index.html` through the repository's static server, or `/ncd-prototypes/church-survey-story/` on GitHub Pages. The default sample is also available explicitly as:

`?lang=en&scores=42.4,48,47.8,38.6,51.6,44.9,50.9,46.5`

## Score mapping (preserved, not redesigned)

URL order: EL, GBM, PS, ES, IWS, HSG, NOE, LR.

Clockwise order from the top, with the supplied sample:

| Quality | Score | Final radius |
| --- | ---: | ---: |
| Loving Relationships | 46.5 | 216 |
| Empowering Leadership | 42.4 | 144 |
| Effective Structures | 38.6 | 108 |
| Gift-based Ministry | 48 | 288 |
| Need-oriented Evangelism | 50.9 | 324 |
| Inspiring Worship Service | 51.6 | 360 |
| Passionate Spirituality | 47.8 | 252 |
| Holistic Small Groups | 44.9 | 180 |

**The old prototype uses ranks, not quantitative score magnitude:** ascending rank maps to `108 + rankIndex * 36`. Stable ordering for tied scores is preserved too, so equal scores can have unequal radii. Both quantitative mapping and tie behaviour need a separate design decision. No mean/SD mapping has been invented.

The spiral is the original Archimedean geometry: 33 radial units per turn, theta starts at -pi/2, sampled at .0045 radians. It stops at the first entry into the Minimum Factor sector after its radius has been exceeded, with the exact sector crossing appended. For the sample, this is Effective Structures, at `(567.6686028989035, 387.1179331900492)`. It is not a newly imposed circular radial cutoff. Timing comes from Wholeness: 4086ms autonomous growth after the life line crosses its reading position. Small reverse movements do not unwind it; crossing back beyond the 12vh threshold resets it.

## Structure

- `data.js`: validated URL inputs, stable quality identifiers, scores, ordinal radii, and existing language records (including deferred heart questions/descriptions).
- `diagram.js`: non-interactive SVG renderer; existing colours, gradients, reversed lower label arcs, translation line structure, and spiral geometry.
- `story.js`: native hold measurements, local scroll-driven reveals, independent spiral clock/reset.
- `style.css`: isolated copy of Wholeness geometry and paper/mobile feather treatment, plus the eightfold hold and label typography.
- `shell.js`, `shell.css`: separate focused-context shell and placeholder Why/What/How destinations.

Initial radius is 60; common explanatory radius is 96, below the smallest final radius so every wedge can grow during the result reveal. Eight reveals share a 120vh native hold (15vh each), rather than eight screens. Profile growth uses the existing 30vh hold and equal radial travel. No narration position is updated in JavaScript; no cloned ending or global scroll timeline exists.

English narrative only for this first pass. `lang` selects existing English, German, Norwegian, or Thai diagram records; unknown values fall back to English. This preserves translation-ready labels and data without claiming a translated narrative. Heart questions/descriptions are loaded as data but never added to the overview DOM. Wedges and labels have no click handlers, button roles, or tab stops.

## Verification

Actual interactive browser checks in the Codex browser:

- Desktop 1280x720: eight equal initial wedges; opening centre at 360px; stage y=0 initially and through the narrative.
- Quality text top stayed at 273.828px while scroll moved from 648 to 1044 and successive wedges developed. All eight explanatory wedges appeared before profile growth.
- Final sample radii and spiral endpoint matched the running original pot-plant reference exactly.
- Spiral continued growing at unchanged scrollY=2520 to completion.
- Desktop exit: stage and final text each moved 144px for 144px scroll.
- 320x640 and 390x844: document scrollWidth equals viewport width; all sixteen label boxes fit; narration visually passes behind the paper/feather region.
- Mobile exit: stage and final text each moved 128px for 128px scroll.
- At 390px, a 25.5px reverse scroll left the spiral running; crossing the reverse threshold faded/reset it; moving forward retriggered it.
- Explore, What/How placeholder destinations, return to overview, and close/reopen work. On return, all eight wedges reset and the spiral hides. The mock app becomes accessible only after leaving the result.
- No browser warnings/errors in final checks.
- `node --test church-survey-story/tests/data.test.cjs`: five passing tests covering score order, expected radii/minimum, future heart-question data, invalid input fallback, and language selection.

Physical iPhone/Safari toolbar resizing and subjective pacing remain for team review. The inherited 74vh mobile reading position and this first 120vh eightfold hold are initial calibration, not final pacing decisions.
