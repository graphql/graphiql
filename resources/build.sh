#!/bin/sh

set -e

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`npm install\` before building GraphiQL."
  exit 1
fi

rm -rf dist/ && mkdir -p dist/
babel src --ignore __tests__ --out-dir dist/
echo "Bundling graphiql.js..."
browserify -g browserify-shim -s GraphiQL dist/index.js > graphiql.js
echo "Bundling graphiql.min.js..."
browserify -g browserify-shim -g uglifyify -s GraphiQL dist/index.js 2> /dev/null | uglifyjs -c --screw-ie8 > graphiql.min.js 2> /dev/null
echo "Bundling graphiql.css..."
cat css/*.css > graphiql.css
echo "Done"
