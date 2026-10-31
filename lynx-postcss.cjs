// Runs after @tailwindcss/postcss. Rewrites v4 output into CSS the Lynx encoder
// and runtime accept.

// ponytail: a handful of v4 display utilities Lynx can't render; the preset
// would derive the full list from its existing DEFAULT_CORE_PLUGINS allowlist.
const UNSUPPORTED_CLASSES = new Set([
  '.inline',
  '.block',
  '.inline-block',
  '.inline-flex',
  '.table',
  '.contents',
]);
const UNSUPPORTED_SELECTOR = /:host|::backdrop|::file-selector-button/;

module.exports = ({ keepLayers = false } = {}) => ({
  postcssPlugin: 'lynx-tailwind',
  Once(root) {
    // `@layer properties` only holds @property fallbacks for --tw-* vars the
    // overrides in App.css don't use.
    root.walkAtRules('layer', (layer) => {
      if (layer.params === 'properties') layer.remove();
      else if (keepLayers) return;
      else if (!layer.nodes) layer.remove();
      else layer.replaceWith(layer.nodes);
    });
    root.walkAtRules('property', (rule) => rule.remove());

    root.walkRules((rule) => {
      const kept = rule.selectors.filter(
        (s) => !UNSUPPORTED_CLASSES.has(s) && !UNSUPPORTED_SELECTOR.test(s),
      );
      // Lightning CSS merges rules with identical declarations, and the Lynx
      // encoder drops a whole rule if any one of its selectors is unsupported.
      for (const selector of kept) {
        // The encoder rejects :is(), which the `*:` variant compiles to.
        // ponytail: only a whole-selector :is() with one simple argument; other
        // forms stay as they are and still show the encoder's warning.
        rule.cloneBefore({ selector: selector.replace(/^:is\(([^(),]+)\)$/, '$1') });
      }
      rule.remove();
    });
  },
});
module.exports.postcss = true;
