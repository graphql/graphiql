#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn install\` before building GraphiQL."
  exit 1
fi

babel src --ignore __tests__ --out-dir dist/
ESM=true babel src --ignore __tests__ --out-dir esm/
cp -rf src/locales dist/
echo "Bundling graphiql.js..."
browserify -g browserify-shim -s GraphiQL dist/index.js > graphiql.js
echo "Bundling graphiql.min.js..."
browserify -g browserify-shim -t uglifyify -s GraphiQL graphiql.js | uglifyjs -c > graphiql.min.js
echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css
echo "Done"
