#!/bin/sh

rm -rf dist/ && mkdir -p dist/ &&
babel server.js -o dist/server.js &&
cp node_modules/graphiql/graphiql.js dist/graphiql.js &&
cp node_modules/graphiql/graphiql.css dist/graphiql.css &&
cat index.html > dist/index.html
