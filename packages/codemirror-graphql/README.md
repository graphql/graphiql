# GraphQL mode for CodeMirror

[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg?style=flat-square)](https://npmjs.com/codemirror-graphql)
![npm downloads](https://img.shields.io/npm/dm/codemirror-graphql?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/codemirror-graphql.svg?style=flat-square)](LICENSE)

Provides CodeMirror with a parser mode for GraphQL along with a live linter and
typeahead hinter powered by your GraphQL Schema.

![Demo .gif of GraphQL Codemirror Mode](https://raw.githubusercontent.com/graphql/graphiql/main/packages/codemirror-graphql/resources/example.gif)

### Getting Started

```
npm install --save codemirror-graphql
```

CodeMirror helpers install themselves to the global CodeMirror when they
are imported.

```js
import type { ValidationContext, SDLValidationContext } from 'graphql';

import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

CodeMirror.fromTextArea(myTextarea, {
  mode: 'graphql',
  lint: {
    schema: myGraphQLSchema,
    validationRules: [ExampleRule],
  },
  hintOptions: {
    schema: myGraphQLSchema,
  },
});
```

## External Fragments Example

If you want to have autcompletion for external fragment definitions, there's a new configuration setting available

```ts
import { parse, visit } from 'graphql';
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

const externalFragmentsExample = `
  fragment MyFragment on Example {
    id: ID!
    name: String!
  }
   fragment AnotherFragment on Example {
    id: ID!
    title: String!
  }
`;

const fragmentDefinitions = visit(parse(externalFragmentsExample), {
  FragmentDefinition(node) {
    return node;
  },
});

CodeMirror.fromTextArea(myTextarea, {
  mode: 'graphql',
  lint: {
    schema: myGraphQLSchema,
  },
  hintOptions: {
    schema: myGraphQLSchema,
    externalFragmentDefinitions: fragmentDefinitions,
  },
});
```

### Custom Validation Rules

```js
import type { ValidationContext, SDLValidationContext } from 'graphql';

import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

const ExampleRule = (context: ValidationContext | SDLValidationContext) => {
  // your custom rules here
  const schema = context.getSchema();
  const document = context.getDocument();
  // do stuff
  if (containsSomethingWeDontWant(document, schema)) {
    context.reportError('Nope not here');
  }
};

CodeMirror.fromTextArea(myTextarea, {
  mode: 'graphql',
  lint: {
    schema: myGraphQLSchema,
    validationRules: [ExampleRule],
  },
  hintOptions: {
    schema: myGraphQLSchema,
  },
});
```

Build for the web with [webpack](http://webpack.github.io/) or
[browserify](http://browserify.org/).
