module.exports = {
  plugins: [
    // Lightning CSS pass, which production enables by default. Without it,
    // color-mix() and `opacity: 50%` fail on Lynx.
    require('@tailwindcss/postcss')({ optimize: true }),
    // RAW=1 skips the rewrite to show unmodified v4 output on device.
    ...(process.env.RAW
      ? []
      : [require('./lynx-postcss.cjs')({ keepLayers: Boolean(process.env.KEEP_LAYERS) })]),
  ],
};
