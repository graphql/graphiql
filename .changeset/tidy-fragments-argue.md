---
'graphql-language-service': minor
'graphql-language-service-server': minor
'monaco-graphql': minor
'@graphiql/react': minor
'graphiql': minor
'codemirror-graphql': patch
'cm6-graphql': patch
---

Add opt-in GraphQL 17 fragment argument syntax support to parsing, validation,
type information, autocomplete, hover, and editor integrations. Enable it with
`experimentalFragmentArguments: true`; it defaults to `false` until server
capabilities can advertise support.

Also fix variable autocomplete to respect operation and fragment scope while
including variables from operations that spread the current fragment.
