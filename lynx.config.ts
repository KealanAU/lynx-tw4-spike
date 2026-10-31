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
