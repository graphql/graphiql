#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn install\` before building GraphiQL."
  exit 1
fi

rm -rf dist/ && mkdir -p dist/
rm -rf cdn/ && mkdir -p cdn/

babel src --ignore __tests__ --out-dir dist/
CDN=true babel src --ignore __tests__ --out-dir cdn/

echo "Bundling graphiql.js..."
browserify -g browserify-shim -s GraphiQL cdn/index.js > graphiql.js

echo "Bundling graphiql.min.js..."
browserify -g browserify-shim -t uglifyify -s GraphiQL cdn/index.js 2> /dev/null | uglifyjs -c > graphiql.min.js 2> /dev/null

echo "Bundling graphiql.css..."
postcss --no-map --use autoprefixer -d dist/ css/*.css
cat dist/*.css > graphiql.css

echo "Done"
