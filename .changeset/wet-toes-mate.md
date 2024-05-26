---
'graphql-language-service-server': minor
'vscode-graphql': patch
---

Introduce `locateCommand` based on Relay LSP `pathToLocateCommand`:

Now with `<graphql config>.extensions.languageService.locateCommand`, you can specify either the [existing signature](https://marketplace.visualstudio.com/items?itemName=meta.relay#relay.pathtolocatecommand-default-null) for relay, with the same callback parameters and return signature.

Relay LSP currently supports `Type` and `Type.field` for the 2nd argument. Ours also returns `Type.field(argument)` as a point of reference. It works with object types, input types, fragments, executable definitions and their fields, and should work for directive definitions as well.

In the case of unnamed types such as fragment spreads, they return the name of the implemented type currently, but I'm curious what users prefer here. I assumed that some people may want to not be limited to only using this for SDL type definition lookups. Also look soon to see `locateCommand` support added for symbols, outline, and coming references and implementations.

The module at the path you specify in relay LSP for `pathToLocateCommand` should work as such

```ts
// import it
import { locateCommand } from './graphql/tooling/lsp/locate.js';
export default {
  languageService: {
    locateCommand,
  },

  projects: {
    a: {
      schema: 'https://localhost:8000/graphql',
      documents: './a/**/*.{ts,tsx,jsx,js,graphql}',
    },
    b: {
      schema: './schema/ascode.ts',
      documents: './b/**/*.{ts,tsx,jsx,js,graphql}',
    },
  },
};
```

```ts
// or define it inline

import { type LocateCommand } from 'graphql-language-service-server';

// relay LSP style
const languageCommand = (projectName: string, typePath: string) => {
  const { path, startLine, endLine } = ourLookupUtility(projectName, typePath);
  return `${path}:${startLine}:${endLine}`;
};

// an example with our alternative return signature
const languageCommand: LocateCommand = (projectName, typePath, info) => {
  // pass more info, such as GraphQLType with the ast node. info.project is also available if you need it
  const { path, range } = ourLookupUtility(
    projectName,
    typePath,
    info.type.node,
  );
  return { uri: path, range }; // range.start.line/range.end.line
};

export default {
  languageService: {
    locateCommand,
  },
  schema: 'https://localhost:8000/graphql',
  documents: './**/*.{ts,tsx,jsx,js,graphql}',
};
```

Passing a string as a module path to resolve is coming in a follow-up release. Then it can be used with `.yml`, `.toml`, `.json`, `package.json#graphql`, etc

For now this was a quick baseline for a feature asked for in multiple channels!

Let us know how this works, and about any other interoperability improvements between our graphql LSP and other language servers (relay, intellij, etc) used by you and colleauges in your engineering organisations. We are trying our best to keep up with the awesome innovations they have 👀!
