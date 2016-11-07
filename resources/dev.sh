#!/bin/sh

set -e

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`npm install\` before developing GraphiQL."
  exit 1
elif [ ! -d "example/node_modules" ]; then
  echo "Be sure to run \`npm install\` in the example directory before developing GraphiQL."
  exit 1
fi

# Clean up dist in example
rm -rf example/dist && mkdir -p example/dist

# Boot the server
node example/server.js &

# Watch JS source files and recompile
watchify\
  src\
  -v\
  -t babelify\
  -g browserify-shim\
  -s GraphiQL\
  --ignore __tests__\
  -o graphiql.js
