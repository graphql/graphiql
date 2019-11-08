#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn install\` before building GraphiQL."
  exit 1
fi

rm -rf graphiql.js *.min.js graphiql.min.js bundle

echo "
Webpack CDN Bundle: /graphiql.min.js..."
BUNDLE=true ESM=true webpack-cli --config resources/webpack.production.min.config.js


echo "
Webpack CDN Bundle: /graphiql.js..."
BUNDLE=true ESM=true webpack-cli --config resources/webpack.development.bundle.config.js

cp bundle/*.js .

# echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css
echo "Done"
