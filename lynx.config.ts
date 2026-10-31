import path from 'node:path';

import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';

import { pluginLynxConfig } from '@lynx-js/config-rsbuild-plugin';
import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

export default defineConfig({
  source: {
    entry: { main: './src/index.tsx' },
  },
  // `web` serves a browser preview at /__web_preview. Browsers support
  // @layer/oklch/color-mix, so web passing says nothing about native Lynx.
  environments: { lynx: {}, web: {} },
  plugins: [
    pluginReactLynx(),
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
    // Lightning CSS pass, which production enables by default. Without it,
    // color-mix() and `opacity: 50%` fail on Lynx.
    pluginTailwindcss({ optimize: true }),
    {
      name: 'lynx-tw4-postprocess',
      setup(api) {
        // RAW=1 skips the post-process to show unmodified v4 output on device.
        if (process.env['RAW']) return;
        api.modifyBundlerChain((chain, { CHAIN_ID }) => {
          for (const oneOf of chain.module.rule(CHAIN_ID.RULE.CSS).oneOfs.values()) {
            if (!oneOf.uses.has('tailwindcss')) continue;
            // `.before` puts it earlier in the list, so it runs after Tailwind.
            oneOf.use('lynx-tw4-postprocess')
              .loader(path.resolve(import.meta.dirname, 'lynx-postprocess.cjs'))
              .before('tailwindcss');
          }
        });
      },
    },
    // Same flags as examples/tailwindcss, so failures are v4's, not config's.
    pluginLynxConfig({
      enableCSSInlineVariables: true,
      enableCSSInheritance: true,
      // Off by default because it also changes how @supports and @layer decode,
      // which could shift the other rows' results. @media needs it (Lynx 4.0+).
      enableCSSRule: Boolean(process.env['CSS_RULE']),
    }),
  ],
});
