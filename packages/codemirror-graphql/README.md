# GraphQL mode for CodeMirror

[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg?style=flat-square)](https://npmjs.com/codemirror-graphql)
![npm downloads](https://img.shields.io/npm/dm/codemirror-graphql?label=npm%20downloads)
[![License](https://img.shields.io/npm/l/codemirror-graphql.svg?style=flat-square)](LICENSE)
[Discord Channel](https://discord.gg/cffZwk8NJW)

**NOTE: For CodeMirror 6, use [cm6-graphql](/packages/cm6-graphql/) instead**

Provides CodeMirror with a parser mode for GraphQL along with a live linter and
typeahead hinter powered by your GraphQL Schema.

![Demo .gif of GraphQL Codemirror Mode](https://raw.githubusercontent.com/graphql/graphiql/main/packages/codemirror-graphql/resources/example.gif)

### Getting Started

```sh
npm install --save codemirror-graphql
```

CodeMirror helpers install themselves to the global CodeMirror when they are
imported.

```ts
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

If you want to have autocompletion for external fragment definitions, there's a
new configuration setting available

```ts
import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

const externalFragments = /* GraphQL */ `
  fragment MyFragment on Example {
    id: ID!
    name: String!
  }
   fragment AnotherFragment on Example {
    id: ID!
    title: String!
  }
`;

CodeMirror.fromTextArea(myTextarea, {
  mode: 'graphql',
  lint: {
    schema: myGraphQLSchema,
  },
  hintOptions: {
    schema: myGraphQLSchema,
    // here we use a string, but
    // you can also provide an array of FragmentDefinitionNodes
    externalFragments,
  },
});
```

### Custom Validation Rules

If you want to show custom validation, you can do that too! It uses the
`ValidationRule` interface.

```ts
import type { ValidationRule } from 'graphql';

import CodeMirror from 'codemirror';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/lint/lint';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/mode';

const ExampleRule: ValidationRule = context => {
  // your custom rules here
  const schema = context.getSchema();
  const document = context.getDocument();
  return {
    NamedType(node) {
      if (node.name.value !== node.name.value.toLowercase()) {
        context.reportError('only lowercase type names allowed!');
      }
    },
  };
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
