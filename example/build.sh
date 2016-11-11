#!/bin/sh

rm -rf dist/ && mkdir -p dist/ &&
babel *.js --out-dir dist/ &&
cp ../graphiql.js dist/graphiql.js &&
cp ../graphiql.css dist/graphiql.css &&
cp -r vendor/ dist/vendor/ &&
cat index.html > dist/index.html
