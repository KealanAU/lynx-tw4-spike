module.exports = {
  plugins: process.env.POSTCSS === '0' ? [] : [require('./lynx-postcss.cjs')()],
};
