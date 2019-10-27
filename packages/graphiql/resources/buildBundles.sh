#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn install\` before building GraphiQL."
  exit 1
fi

rm -rf graphiql.min.js bundle/

echo "Webpack Bundle: /graphiql.min.js..."
ESM=true ANALYZE=true webpack-cli --config resources/webpack.production.min.config.js

echo "Webpack Async CDN Bundle: /graphiql.lazy.min.js and friends..."
ESM=true ANALYZE=true webpack-cli --config resources/webpack.production.lazy.config.js
cp -v bundle/graphiql.main.min.js graphiql.lazy.min.js

# echo "Bundling graphiql.min.js..."
# browserify -g browserify-shim -t uglifyify -s GraphiQL graphiql.js | uglifyjs -c > graphiql.min.js
# echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css
echo "Done"
