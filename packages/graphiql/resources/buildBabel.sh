#!/bin/bash

set -e
set -o pipefail

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`yarn\` before building GraphiQL."
  exit 1
fi

rm -rf dist/ esm/ && mkdir -p dist/ esm/
echo \n"Babel CJS build..."
NODE_ENV=production babel src --ignore '**/__tests__/**' --out-dir dist/
echo \n"Babel ESM build..."
NODE_ENV=production ESM=true babel src --ignore '**/__tests__/**' --out-dir esm/
