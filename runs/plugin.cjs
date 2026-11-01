const plugin = require('tailwindcss/plugin');

module.exports = plugin(({ addUtilities }) => {
  addUtilities({ '.from-plugin': { 'background-color': '#ef4444' } });
});
