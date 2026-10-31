const assert = require('node:assert');
const postcss = require('postcss');
const lynx = require('./lynx-postcss.cjs');

const run = (css, options) =>
  postcss([lynx(options)])
    .process(css, { from: undefined })
    .css.replace(/\s/g, '');

assert.equal(run('@layer utilities{.a{color:red}}'), '.a{color:red}');
assert.equal(run('@layer components;'), '');
assert.equal(run('@layer properties{.a{color:red}}'), '');
assert.equal(run('@property --x{syntax:"*"}'), '');
assert.equal(run(':root,:host{--x:1}'), ':root{--x:1}');
assert.equal(run('.inline{display:inline}'), '');
assert.equal(run('.a,.b::backdrop{color:red}'), '.a{color:red}');
assert.equal(
  run('.a:active,.b:first-child{color:red}'),
  '.a:active{color:red}.b:first-child{color:red}',
);
assert.equal(run(':is(.x>*){color:red}'), '.x>*{color:red}');
assert.equal(run(':is(.x,.y){color:red}'), ':is(.x,.y){color:red}');

const keep = { keepLayers: true };
assert.equal(
  run('@layer utilities{.a,:is(.x>*){color:red}}', keep),
  '@layerutilities{.a{color:red}.x>*{color:red}}',
);
assert.equal(run('@layer components;', keep), '@layercomponents;');
assert.equal(run('@layer properties{.a{color:red}}', keep), '');
