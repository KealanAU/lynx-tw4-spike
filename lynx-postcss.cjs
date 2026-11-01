const OKLCH =
  /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+(-?[\d.]+|none)(?:deg)?\s*(?:\/\s*([\d.]+)(%?)\s*)?\)/g;

// Lightning CSS leaves oklch() alone because its targets support it; Lynx's colour
// parser doesn't. rebeccapurple is the one CSS colour name missing from its keywords.
const UNSUPPORTED_COLOUR = /\b(?:ok)?(?:lab|lch)\(|\bcolor(?:-mix)?\(|\blight-dark\(|\brebeccapurple\b/;

// Tailwind can't resolve a colour that's only a var(), so its /opacity fallback has no alpha.
const lostOpacity = (fallback, value) =>
  value.includes('color-mix(') && /^var\(--[\w-]+\)$/.test(fallback ?? '');

const APPLIES = /^:(?:not|hover|active|focus|root|before|after)$/;

// One of these makes the encoder drop the whole rule, and Lightning CSS merges unrelated
// utilities into one list, so a single has-* would take active:* down with it.
const REJECTED = /:(?:is|where|has)\(|::(?:backdrop|file-selector-button)/;
const unescaped = selector => selector.replace(/\\./g, '');

function toHexByte(channel) {
  return Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, '0');
}

// Björn Ottosson's OKLab to linear sRGB, then sRGB gamma. Out-of-gamut channels are
// clamped, not gamut-mapped.
function oklchToHex(lightness, chroma, hue, alpha = 1) {
  const a = chroma * Math.cos((hue * Math.PI) / 180);
  const b = chroma * Math.sin((hue * Math.PI) / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const hex = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
    .map(c => toHexByte(c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055))
    .join('');
  return `#${hex}${alpha < 1 ? toHexByte(alpha) : ''}`;
}

function replaceOklch(value) {
  return value.replace(OKLCH, (_, l, lPct, c, h, alpha, aPct) =>
    oklchToHex(
      Number(l) / (lPct ? 100 : 1),
      Number(c),
      h === 'none' ? 0 : Number(h),
      alpha === undefined ? 1 : Number(alpha) / (aPct ? 100 : 1),
    ),
  );
}

// Anything too nested to rewrite safely is left for REJECTED and the warning.
function rewriteSelector(selector) {
  return selector
    .replace(/:(?:is|where)\(([^()\s,>~+]+)\)/g, '$1')
    .replace(/^:(?:is|where)\(((?:[^()]|\([^()]*\))*)\)$/, '$1')
    .replace(
      /^(.*):is\(([^(),]+?)(?:\s*(~)\s*|\s+)\*\)$/,
      (_, subject, ancestor, sibling) => `${ancestor} ${sibling ? '~ ' : ''}${subject}`,
    );
}

function unmatchable(selector) {
  return unescaped(selector)
    .match(/(?<!:):[a-z-]+|::(?:backdrop|file-selector-button)|\[[^\]]*\]/g)
    ?.find(part => !APPLIES.test(part));
}

function rejected(selector) {
  return REJECTED.test(unescaped(selector));
}

// Lynx ignores @supports, so what's inside it is Tailwind's enhancement over a fallback.
function inSupports(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.name === 'supports') return true;
  }
  return false;
}

module.exports = () => ({
  postcssPlugin: 'lynx-tailwind-v4',
  OnceExit(root, { result }) {
    const problems = [];

    root.walkAtRules(/^(?:container|starting-style)$/, rule => {
      problems.push(`@${rule.name} ${rule.params}`.trim());
    });

    root.walkRules(rule => {
      const selectors = rule.selectors
        .filter(s => s !== ':host' && s !== '::backdrop')
        .map(rewriteSelector);
      for (const selector of selectors) {
        const part = unmatchable(selector);
        if (part) problems.push(`${part} in ${selector}`);
      }
      const kept = selectors.filter(s => !rejected(s));
      if (kept.length) rule.selectors = kept;
      else rule.remove();
    });

    const fallbacks = new Map();
    root.walkDecls(decl => {
      if (decl.value.includes('oklch(')) decl.value = replaceOklch(decl.value);
      const key = `${decl.parent.selector} ${decl.prop}`;
      if (inSupports(decl)) {
        if (lostOpacity(fallbacks.get(key), decl.value)) {
          problems.push(`the opacity in ${decl.parent.selector}, which renders solid`);
        }
        return;
      }
      fallbacks.set(key, decl.value);
      if (UNSUPPORTED_COLOUR.test(decl.value)) {
        problems.push(`the colour in ${decl.prop}: ${decl.value}`);
      }
    });

    // One warning with no node, because a per-node warning prints the whole merged rule.
    if (problems.length) {
      result.warn(`Lynx can't apply:\n${problems.map(p => `  ${p}`).join('\n')}`);
    }
  },
});
module.exports.postcss = true;
Object.assign(module.exports, { lostOpacity, rejected, replaceOklch, rewriteSelector, unmatchable });
