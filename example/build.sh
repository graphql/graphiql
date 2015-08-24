#!/bin/sh

rm -rf dist/ && mkdir -p dist/ &&
babel server.js --optional runtime -o dist/server.js &&
cp node_modules/graphiql/graphiql.min.js dist/graphiql.min.js &&
cp node_modules/graphiql/graphiql.css dist/graphiql.css &&
cat index.html > dist/index.html
