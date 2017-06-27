#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`npm install\` before building GraphiQL."
  exit 1
fi

rm -rf dist/ && mkdir -p dist/
babel src --ignore __tests__ --out-dir dist/
echo "Bundling graphiql.js..."
browserify -g browserify-shim -s GraphiQL dist/index.js > graphiql.js
echo "Bundling graphiql.min.js..."
browserify -g browserify-shim -t uglifyify -s GraphiQL dist/index.js 2> /dev/null | uglifyjs -c > graphiql.min.js 2> /dev/null
echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css
echo "Done"
