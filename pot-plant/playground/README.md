# NCD Pot Plant Playground

Standalone review: https://adamdjohnstone.github.io/ncd-prototypes/pot-plant/playground/?lang=en

A client-only illustration, with no scores, storage, tracking, export dependency, or backend. Existing comparison, viewer and Church Survey pages are unchanged. Open `index.html` through an HTTP server; no build or installation is needed.

## State and development

`model.js` stores permutations weakest to strongest; the visible list reverses this order. The example resolves the HSG/LR tie explicitly as HSG then LR. It corresponds to the brief's input `[50,47,41,51,36,46,43,46]`, without retaining scores.

For any `[a,b,c,d,e,f,g,h]`, development produces `[c,b,d,a,e,f,g,h]`: the original minimum moves to fourth place, one adjacent pair among the remaining seven exchanges, and all other relative relationships remain. This is an illustrative positional rule, not a prediction or an inferred relationship between particular qualities.

Before radii are 72–324, spaced by 36; After radii are 108–360. The former minimum grows by 144. Only the new minimum moves inward (36); one quality stays at its absolute radius and the others grow by 36. `geometry.js` preserves the comparison compass, wedges, gradients, circular typography and first-entry stopping geometry. The existing spiral extends from its old endpoint instead of replaying from its centre. The previous point remains an outlined gold marker.

The sequence lasts approximately 5.75 seconds: attention, minimum growth, stillness, other growth, spiral extension, settling. Reduced motion uses short static changes (about half a second). Resizing uses the same SVG viewBox and cannot restart an animation. Sorting, reset and repeated activation are disabled while busy. Return restores the captured starting arrangement; Start again restores the supplied example. The original arrangement remains visible in After.

## Files

- `index.html`, `playground.css`: responsive three-column layout, compact sticky mobile plant, modal quality information.
- `model.js`, `model.test.cjs`: pure order/radius model and exhaustive checks.
- `setup.js`, `geometry.js`, `playground.js`: localization setup, adapted drawing primitives, sorting and two-state orchestration.
- `strings.js`: all new interface and accessibility text.
- `embed.js`, `embed-demo.html`: optional host integration and working demonstration.

## Accessibility and languages

Drag using the dotted handle; other card areas retain ordinary touch scrolling. Up/down buttons work with mouse, touch and keyboard. Focus a handle and press ArrowUp/ArrowDown to reorder. Order changes are announced, and focus remains on the moved quality. SVG wedges and labels open a native modal with Escape and focus restoration. The current minimum and previous-stop meaning are also provided in text.

`?lang=en`, `de`, `nb`, or `th` reuses the existing quality names, heart questions, descriptions and arc typography. New strings currently ship in English, with per-key English fallback. Add a locale object beside `en` in `strings.js`; translate every key, preserving `{name}` and `{order}` placeholders. English Effective Structures deliberately uses “Do I really have room to grow here?” only in this playground. Other locales retain their existing approved question.

## Standalone survey destination

Set `surveyUrl` to a URL-encoded absolute HTTP(S) URL of a survey introduction. Example:

`index.html?lang=en&surveyUrl=https%3A%2F%2Fexample.org%2Fchurch%23survey`

Without configuration the invitation shows a clearly labelled demonstration message. No national website is hardcoded. In a configured embed, the host invitation message takes precedence over `surveyUrl`.

## Embed on a national website

Place after the existing video. Keep video and national content in the host page. Import the helper as an ES module and give the destination a focusable heading or section:

```html
<iframe id="ncd-plant" title="NCD Pot Plant Playground"></iframe>
<section id="church-survey" tabindex="-1">
  <!-- National survey introduction -->
</section>
<script type="module">
  import {mountPlayground} from
    'https://adamdjohnstone.github.io/ncd-prototypes/pot-plant/playground/embed.js';
  const disconnect = mountPlayground(document.getElementById('ncd-plant'), {
    src: 'https://adamdjohnstone.github.io/ncd-prototypes/pot-plant/playground/',
    language: 'en',
    surveyTarget: '#church-survey',
    id: 'church-plant'
  });
  // Call disconnect() if your application removes the iframe.
</script>
```

The helper listens before loading the iframe and validates exact origin, source window, namespace, version, instance ID, message type and finite height bounds. The child sends only to the exact HTTP(S) `parentOrigin` query parameter, never `*`; it accepts no inbound commands. Messages are `{namespace:'ncd-pot-plant-playground', version:1, id, type:'resize', height}` or the same envelope with `type:'discover'`. No visitor order or other personal data is transmitted. ResizeObserver keeps the iframe height aligned with content, including After and demonstration text. Hosts implementing their own handler must perform the same checks. Use unique valid IDs (letters, digits, `_`, `-`, at most 80 characters) for multiple instances.

`embed-demo.html` demonstrates both height adjustment and navigation to a host section. The actual national website is not changed. Host CSP must permit the iframe/script origin. In an automatically expanded iframe, a sticky child cannot follow the *host* viewport; the plant remains compact above the list instead. The standalone mobile page keeps it visible while sorting when there is enough screen height.

## Verification

Run `node pot-plant/playground/model.test.cjs` from the repository root. It checks all 40,320 permutations for valid deterministic results, minimum progress, new minimum, discrete radii, inward movement bounds and exactly one inversion among the other seven. All 64 old/new compass combinations are checked against the actual renderer to confirm a strictly longer After spiral.

Browser QA covers button/keyboard reordering, growth, retained original ordering, return, reset, quality modal, desktop/mobile layouts and the embedding demonstration. Physical touchscreen and assistive-technology testing remains recommended; only the English new interface copy is translated at this stage.
