#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn install\` before building GraphiQL."
  exit 1
fi

rm -rf graphiql.js *.min.js graphiql.min.js bundle

echo "
Webpack Bundle: /graphiql.min.js..."
BUNDLE=true ESM=true webpack-cli --config resources/webpack.production.min.config.js
cp bundle/min/*.min.js .
echo "
Webpack Bundle: /graphiql.js..."
BUNDLE=true ESM=true webpack-cli --config resources/webpack.development.bundle.config.js
cp bundle/index/*js .

echo "
Webpack Bundle: /graphiql.render.js..."
ESM=true webpack-cli --config resources/webpack.production.render.config.js
cp bundle/render/*.min.js .

echo "
Webpack Async CDN Bundle: /graphiql.lazy.min.js and friends..."
ESM=true webpack-cli --config resources/webpack.production.lazy.config.js
cp bundle/lazy/graphiql.main.min.js ./graphiql.lazy.min.js

# echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css
echo "Done"
