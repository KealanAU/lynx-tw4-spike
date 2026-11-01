const assert = require('node:assert');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const { lostOpacity, rejected, replaceOklch, rewriteSelector, unmatchable } = require('./lynx-postcss.cjs');

const MIX = 'color-mix(in oklab, var(--x) 50%, transparent)';
assert.ok(lostOpacity('var(--x)', MIX));
assert.ok(!lostOpacity('#ff880080', MIX));
assert.ok(!lostOpacity(undefined, MIX));
assert.ok(!lostOpacity('var(--x)', 'to right in oklch'));

for (const selector of ['.x:has(.y)', '.x:is(.a ~ *):is(.b *)', ':where(.a:not(.b)) .c', '.x::file-selector-button']) {
  assert.ok(rejected(selector), selector);
}
for (const selector of ['.has-\\[\\.on\\]\\:x:active', '.x:nth-child(2)', '.on .x', '.x:not(:first-child)', ':root']) {
  assert.ok(!rejected(selector), selector);
}

for (const [input, expected] of [
  ['.x:is(:where(.group):hover *)', '.group:hover .x'],
  ['.x:is(:where(.group\\/item):hover *)', '.group\\/item:hover .x'],
  ['.x:is(:where(.group):is(.on) *)', '.group.on .x'],
  ['.x:is(:where(.peer):active~*)', '.peer:active ~ .x'],
  ['.x:is(:where(.peer):active ~ *)', '.peer:active ~ .x'],
  ['.bg-\\[oklch\\(0_0_0\\)\\]:is(:where(.group):hover *)', '.group:hover .bg-\\[oklch\\(0_0_0\\)\\]'],
  [':where(.on) .x', '.on .x'],
  [':where(*:hover) .x', '*:hover .x'],
  [':where(.a) .x:not(:active)', '.a .x:not(:active)'],
  [':is(.a > *)', '.a > *'],
  [':where(.a>:not(:last-child))', '.a>:not(:last-child)'],
  // Left alone, because unwrapping these would change what they match.
  [':where(.a:not(.b)) .c:not(.d)', ':where(.a:not(.b)) .c:not(.d)'],
  ['.x:is([inert],[inert] *)', '.x:is([inert],[inert] *)'],
  ['.x:where(.a .b)', '.x:where(.a .b)'],
  ['.x:not(:active)', '.x:not(:active)'],
  ['.x:has(.y)', '.x:has(.y)'],
]) {
  assert.equal(rewriteSelector(input), expected);
}

for (const [selector, part] of [
  ['.group:hover .x', undefined],
  ['.x:not(:active)', undefined],
  ['.x::before', undefined],
  ['.first\\:bg-red:active', undefined],
  ['.bg-\\[\\#fff\\]', undefined],
  ['.x:first-child', ':first-child'],
  ['.x:not(:last-child)', ':last-child'],
  ['.x:nth-child(2)', ':nth-child'],
  ['.x:has(.y)', ':has'],
  ['.x:is(.a ~ *):is(.b *)', ':is'],
  ['.x:disabled', ':disabled'],
  ['.group[data-on] .x', '[data-on]'],
  ['.x::file-selector-button', '::file-selector-button'],
]) {
  assert.equal(unmatchable(selector), part);
}

assert.equal(replaceOklch('oklch(0% 0 0)'), '#000000');
assert.equal(replaceOklch('oklch(100% 0 0)'), '#ffffff');
assert.equal(replaceOklch('oklch(100% 0 none)'), '#ffffff');
assert.equal(replaceOklch('oklch(100% 0 0/.5)'), '#ffffff80');
assert.equal(replaceOklch('oklch(100% 0 0 / 50%)'), '#ffffff80');
assert.equal(replaceOklch('0 1px oklch(1 0 0), red'), '0 1px #ffffff, red');
assert.equal(replaceOklch('oklch(var(--l) 0 0)'), 'oklch(var(--l) 0 0)');

const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const distance = (a, b) => Math.max(...channels(a).map((c, i) => Math.abs(c - channels(b)[i])));
const entries = (file, value) =>
  [...readFileSync(join(__dirname, file), 'utf8').matchAll(new RegExp(`(--color-[a-z]+-\\d+): (${value});`, 'g'))];

assert.ok(distance(replaceOklch('oklch(62.8% 0.2577 29.23)'), '#ff0000') <= 2);

const hexPalette = new Map(entries('runs/palette.css', '#[0-9a-f]{6}').map(([, name, hex]) => [name, hex]));
const oklchPalette = entries('node_modules/tailwindcss/theme.css', 'oklch\\([^)]*\\)');

// The generated palette has no neutral-*, zinc-50 or mauve-50, whose hue is `none`, so
// those have nothing to compare against, but the plugin still has to convert them.
for (const [, name, value] of oklchPalette) {
  assert.match(replaceOklch(value), /^#[0-9a-f]{6}$/, name);
}

const shifts = oklchPalette
  .filter(([, name]) => hexPalette.has(name))
  .map(([, name, value]) => {
    const hex = replaceOklch(value);
    return { name, hex, expected: hexPalette.get(name), by: distance(hex, hexPalette.get(name)) };
  })
  .sort((a, b) => b.by - a.by);
console.log('Largest palette shifts:', shifts.slice(0, 5));
// A shift this size would be visible, so the generated palette would still be needed.
assert.ok(shifts[0].by <= 8);

console.log('ok');
