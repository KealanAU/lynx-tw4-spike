# Tailwind CSS v4 on Lynx: spike

This spike tests what Tailwind CSS v4 output needs before Lynx renders it. It accompanies [lynx-family/lynx-stack#69](https://github.com/lynx-family/lynx-stack/issues/69).

Each row renders a v4 class next to an inline-style reference box. If the two boxes differ, that utility doesn't work on Lynx.

## Run

```sh
pnpm install
pnpm dev          # with the post-process step
RAW=1 pnpm dev    # unmodified v4 output, for comparison
CSS_RULE=1 pnpm dev    # with enableCSSRule, which @media variants need
```

Open the printed `main.lynx.bundle` URL in [Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html). Delete `dist/` when you switch between modes.

## What's here

- `lynx-postprocess.cjs`: a PostCSS loader that runs after Tailwind. It unwraps `@layer`, removes `@property`, rewrites `:root,:host` to `:root`, drops unsupported utilities, splits grouped selectors so one unsupported selector can't remove the others, and unwraps `:is()`.
- `src/App.css`: Tailwind without preflight, a hex `@theme`, plain-value transform steps and `text-lg`, and `@utility` overrides for `rotate`, `translate`, `scale` and `shadow-md`. The overrides are ported from `@lynx-js/tailwind-preset` v3.
- `lynx.config.ts`: `@rsbuild/plugin-tailwindcss` with `optimize: true`, plus the loader wiring.

Tested with rspeedy 0.18.2, `@rsbuild/plugin-tailwindcss` 2.0.3 and tailwindcss 4.3.3 in Lynx Explorer on the iOS simulator.

## Results

| Row | `CSS_RULE=1` | `pnpm dev` | `RAW=1` |
|---|---|---|---|
| `bg-[#ef4444]`, `opacity-50`, `bg-red-500`, `bg-red-500/50` | Pass | Pass | Fail |
| `rounded-xl` | Pass | Pass | Fail |
| `rotate-45`, `rotate-[45deg]`, `scale-50`, `scale-[0.5]`, `rotate-45 scale-50`, `translate-x-[16px]` | Pass | Pass | Fail |
| `shadow-md` | Pass | Pass | Fail |
| `w-24`, `translate-x-4`, `text-lg` | Applied, smaller than reference | Applied, smaller than reference | Fail |
| `max-sm:` | Pass | Fail | Fail |
| `sm:` | Pass | Inconclusive, stays blue with `@media` off | Fail |
| `first:` | Fail | Fail | Fail |
| `*:` | Pass | Pass | Fail |
| `active:` | Pass | Pass | Fail |
| `dark:` | Not testable | Not testable | Fail |

- **`RAW=1`:** Lynx applies none of the utilities inside `@layer`, so left boxes lose their class styles. A box with no inline background or width disappears.
- **`rem`:** Lynx's default font size is 14px, so `1rem` is 14px, not 16px. The references assume 16px: `w-24` is 84px against 96px, `translate-x-4` is 14px against 16px, and `text-lg` is 15.75px against 18px. The `w-24` row also overflows, so both of its boxes shrink.
- **`text-lg` line height:** a line height of `calc()` inside a custom property has no effect. The plain value in `src/App.css` applies.
- **`first:`:** the rule reaches Lynx, but Lynx doesn't apply `:first-child`.
- **`dark:`:** the rule is in the build, but released Explorer (4.2.0 and earlier) never passes the simulator's appearance to Lynx, so `prefers-color-scheme` stays `light`. Toggling it with ⇧⌘A changes nothing. Explorer's support is on `develop` ([`be09081`](https://github.com/lynx-family/lynx/commit/be09081d3)), not in a release. Apps need a host that calls `updateColorScheme`, or a class-based `@custom-variant` driven by `lynx.__globalProps`, which is untested here.
- **Warnings:** the post-process builds warn that `translate`, `scale` and `rotate` were removed. This is harmless, as the `transform` overrides do the work.
