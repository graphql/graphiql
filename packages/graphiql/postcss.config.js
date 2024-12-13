module.exports =
  process.env.NODE_ENV === 'test'
    ? {}
    : ({ options, webpackLoaderContext }) => ({
        plugins: {
          // https://github.com/postcss/postcss-import/issues/442#issuecomment-822427606
          'postcss-import': { root: webpackLoaderContext.context },
          // contains autoprefixer, etc
          'postcss-preset-env': options['postcss-preset-env'] || false,
          cssnano:
            process.env.NODE_ENV === 'production' ? options.cssnano : false,
        },
      });
