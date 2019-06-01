GraphQL mode for CodeMirror
===========================

[![Build Status](https://travis-ci.org/graphql/codemirror-graphql.svg?branch=master)](https://travis-ci.org/graphql/codemirror-graphql)

Provides CodeMirror with a parser mode for GraphQL along with a live linter and
typeahead hinter powered by your GraphQL Schema.

![](resources/example.gif)

### Getting Started

```
npm install --save codemirror-graphql
```

CodeMirror helpers install themselves to the global CodeMirror when they
are imported.

```js
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

CodeMirror.fromTextArea(myTextarea, {
  mode: 'graphql',
  lint: {
    schema: myGraphQLSchema
  },
  hintOptions: {
    schema: myGraphQLSchema
  }
});
```

Build for the web with [webpack](http://webpack.github.io/) or
[browserify](http://browserify.org/).
