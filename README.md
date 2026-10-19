# Tailwind CSS v4 on Lynx: spike

This spike tests what Tailwind CSS v4 output needs before Lynx renders it. It accompanies [lynx-family/lynx-stack#69](https://github.com/lynx-family/lynx-stack/issues/69).

Each row renders a v4 class next to an inline-style reference box. If the two boxes differ, that utility doesn't work on Lynx.

## Run

```sh
pnpm install
pnpm dev          # with the post-process step
RAW=1 pnpm dev    # unmodified v4 output, for comparison
```

Open the printed `main.lynx.bundle` URL in [Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html). Delete `dist/` when you switch between the two modes.

## What's here

- `lynx-postprocess.cjs`: a PostCSS loader that runs after Tailwind. It unwraps `@layer`, removes `@property`, rewrites `:root,:host` to `:root`, and drops unsupported utilities.
- `src/App.css`: Tailwind without preflight, a hex `@theme`, plain-value transform steps, and `@utility` overrides for `rotate`, `translate`, `scale` and `shadow-md`. The overrides are ported from `@lynx-js/tailwind-preset` v3.
- `lynx.config.ts`: `@rsbuild/plugin-tailwindcss` with `optimize: true`, plus the loader wiring.

Tested with rspeedy 0.18.2, `@rsbuild/plugin-tailwindcss` 2.0.3 and tailwindcss 4.3.3 in Lynx Explorer on the iOS simulator.
