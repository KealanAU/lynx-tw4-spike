# Tailwind CSS v4 on Lynx: spike

This spike tests what Tailwind CSS v4 output needs before Lynx renders it. It accompanies [lynx-family/lynx-stack#69](https://github.com/lynx-family/lynx-stack/issues/69).

Each row renders a v4 class next to an inline-style reference box. If the two boxes differ, that utility doesn't work on Lynx.

## Run

```sh
pnpm install
pnpm dev                          # with the post-process step
RAW=1 pnpm dev                    # unmodified v4 output, for comparison
CSS_RULE=1 pnpm dev               # with enableCSSRule, which @media variants need
KEEP_LAYERS=1 CSS_RULE=1 pnpm dev # post-process step, but @layer left in place
node lynx-postcss.test.cjs        # checks the post-process step without a device
```

Open the printed `main.lynx.bundle` URL in [Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html). Delete `dist/` when you switch between modes.

## What's here

- `lynx-postcss.cjs`: a PostCSS plugin that runs after `@tailwindcss/postcss`. It unwraps `@layer`, removes `@property`, rewrites `:root,:host` to `:root`, drops unsupported utilities, splits grouped selectors so one unsupported selector can't remove the others, and unwraps `:is()`.
- `src/App.css`: Tailwind without preflight, a hex `@theme`, plain-value transform steps and `text-lg`, and `@utility` overrides for `rotate`, `translate`, `scale` and `shadow-md`. The overrides are ported from `@lynx-js/tailwind-preset` v3.
- `postcss.config.cjs`: `@tailwindcss/postcss` with `optimize: true`, then the plugin.
- `lynx.config.ts`: the Lynx plugins and flags.

Tested with rspeedy 0.18.2 and tailwindcss 4.3.3 in Lynx Explorer on the iOS simulator.

## Results

The `CSS_RULE=1` column was confirmed on the PostCSS setup. The other two columns come from the earlier setup, which used `@rsbuild/plugin-tailwindcss` and a custom loader.

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

- **`RAW=1`:** with `enableCSSRule` off, none of the utilities inside `@layer` apply, so left boxes lose their class styles. A box with no inline background or width disappears. With it on and `KEEP_LAYERS=1`, the selector groups are fixed and there are no warnings, but the left side is still broken on Explorer. Lynx's encoder, decoder and style resolver all have `@layer` code, so the cause is an open question, and the plugin still unwraps `@layer`.
- **Selector groups:** with the flag on, the encoder drops `:root,:host`, `*,:before,:after,::backdrop` and the merged `:is()`, `:first-child` and `:active` group whole, because each contains an unsupported selector.
- **`rem`:** Lynx's default font size is 14px, so `1rem` is 14px, not 16px. The references assume 16px: `w-24` is 84px against 96px, `translate-x-4` is 14px against 16px, and `text-lg` is 15.75px against 18px. The `w-24` row also overflows, so both of its boxes shrink.
- **`text-lg` line height:** a line height of `calc()` inside a custom property has no effect. The plain value in `src/App.css` applies.
- **`first:`:** the rule reaches Lynx, but Lynx doesn't apply `:first-child`.
- **`dark:`:** the rule is in the build, but released Explorer (4.2.0 and earlier) never passes the simulator's appearance to Lynx, so `prefers-color-scheme` stays `light`. Toggling it with ⇧⌘A changes nothing. Explorer's support is on `develop` ([`be09081`](https://github.com/lynx-family/lynx/commit/be09081d3)), not in a release. Apps need a host that calls `updateColorScheme`, or a class-based `@custom-variant` driven by `lynx.__globalProps`, which is untested here.
- **Warnings:** the earlier setup warned that `translate`, `scale` and `rotate` were removed, which was harmless because the `transform` overrides do the work. The PostCSS setup doesn't show those warnings, though selector warnings still appear with `RAW=1 CSS_RULE=1`.
- **Production:** `CSS_RULE=1 pnpm build` shows no warnings, so no selector group is dropped. It hasn't been opened on a device.
