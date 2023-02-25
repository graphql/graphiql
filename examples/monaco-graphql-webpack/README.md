A simple example of `monaco-graphql` using webpack 4

[live demo](https://monaco-graphql.netlify.com) of the monaco webpack example

### Setup

`yarn` and `yarn start` from this folder to start webpack dev server

### JS only

If you want to learn how to bundle `monaco-graphql` using webpack without
typescript, these steps will help:

1. rename .ts files to .js
1. rename .ts to .js in webpack.config.js
1. remove fork ts checker plugin from webpack.config.js
1. remove typescript annotations from the renamed files
