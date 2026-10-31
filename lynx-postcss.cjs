// Each of these selectors makes the encoder drop
// its whole rule, and Lightning CSS merges unrelated utilities into one list.
module.exports = () => ({
  postcssPlugin: 'lynx-selectors',
  Rule(rule) {
    const kept = rule.selectors
      .filter(s => s !== ':host' && s !== '::backdrop')
      .map(s => s.replace(/^:(?:is|where)\((.*)\)$/, '$1'));
    if (kept.join() !== rule.selectors.join()) rule.selectors = kept;
  },
});
module.exports.postcss = true;
