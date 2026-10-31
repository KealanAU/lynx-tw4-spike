# Tailwind CSS v4 on Lynx: spike

This spike looks for the smallest Lynx layer needed on top of the official Tailwind v4 integration, [`@rsbuild/plugin-tailwindcss`](https://rsbuild.rs/plugins/list/plugin-tailwindcss). It accompanies [lynx-family/lynx-stack#69](https://github.com/lynx-family/lynx-stack/issues/69).

`main` is currently the baseline: the official plugin with default options and no rewriting. Fixes get added one at a time, each with its result.

Each row renders a v4 class next to an inline-style reference. If the two boxes differ, that utility doesn't work on Lynx.

## Run

```sh
pnpm install
pnpm dev               # enableCSSRule off
CSS_RULE=1 pnpm dev    # enableCSSRule on, which @media variants need
```

Open the printed `main.lynx.bundle` URL in [Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html). Delete `dist/` when you switch between modes.

The references assume `1rem` is 16px, but Lynx's default is 14px, so `rem` rows differ.

The first attempt and its results are at the [`first-spike`](https://github.com/KealanAU/lynx-tw4-spike/tree/first-spike) tag.
