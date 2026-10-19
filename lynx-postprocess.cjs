// Runs after the Tailwind loader. Rewrites v4 output into CSS the Lynx
// encoder and runtime accept.
const postcss = require('postcss');

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

module.exports = function lynxPostprocess(source) {
  const root = postcss.parse(source);

  // `@layer properties` only holds @property fallbacks for --tw-* vars the
  // overrides in App.css don't use.
  root.walkAtRules('layer', (layer) => {
    if (!layer.nodes || layer.params === 'properties') layer.remove();
    else layer.replaceWith(layer.nodes);
  });
  root.walkAtRules('property', (rule) => rule.remove());

  root.walkRules((rule) => {
    const kept = rule.selectors.filter(
      (s) => !UNSUPPORTED_CLASSES.has(s) && !UNSUPPORTED_SELECTOR.test(s),
    );
    if (kept.length) rule.selectors = kept;
    else rule.remove();
  });

  return root.toString();
};
