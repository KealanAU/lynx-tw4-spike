import { resolve } from 'node:path';

import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

import { pluginLynxConfig } from '@lynx-js/config-rsbuild-plugin';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

// The switches only reproduce the README's runs; see `Smallest setup` there.
const { ENTRY = 'src/App.css', CSS_RULE, POSTCSS, OPTIMIZE, ENGINE, INLINE_VARS, INHERIT } = process.env;

export default defineConfig({
  source: {
    entry: { main: './src/index.tsx' },
    alias: { '@entry.css': resolve(ENTRY) },
    define: {
      __RUN__: JSON.stringify(
        [
          ENTRY,
          `cssRule ${CSS_RULE === '0' ? 'off' : 'on'}`,
          `postcss ${POSTCSS === '0' ? 'off' : 'on'}`,
          `optimize ${OPTIMIZE === '0' ? 'default' : 'on'}`,
          `engine ${ENGINE ?? 'default'}`,
          `inlineVars ${INLINE_VARS === '0' ? 'off' : 'on'}`,
          `inherit ${INHERIT === '0' ? 'off' : 'on'}`,
        ].join(' · '),
      ),
    },
  },
  // `web` serves a browser preview at /__web_preview. Browsers support
  // @layer/oklch/color-mix, so web passing says nothing about native Lynx.
  environments: { lynx: {}, web: {} },
  plugins: [
    pluginReactLynx(ENGINE ? { engineVersion: ENGINE } : {}),
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
    // In dev too: otherwise `opacity: 50%`, `calc(infinity * 1px)` and `color-mix()`
    // only get lowered in production, so the two modes render differently.
    pluginTailwindcss(OPTIMIZE === '0' ? {} : { optimize: true }),
    // Same flags as examples/tailwindcss, so failures are v4's, not config's.
    pluginLynxConfig({
      enableCSSInlineVariables: INLINE_VARS !== '0',
      enableCSSInheritance: INHERIT !== '0',
      // @media needs it (Lynx 4.0+).
      enableCSSRule: CSS_RULE !== '0',
    }),
  ],
});
