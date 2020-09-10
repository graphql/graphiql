module.exports = ({ file, options }) => ({
  plugins: {
    'postcss-import': { root: file.dirname },
    // contains autoprefixer, etc
    'postcss-preset-env': options['postcss-preset-env']
      ? options['postcss-preset-env']
      : false,
    cssnano: process.env.NODE_ENV === 'production' ? options.cssnano : false,
  },
});
