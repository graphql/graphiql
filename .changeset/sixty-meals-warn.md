---
"vscode-graphql": patch
---

LSP upgrades:

- bugfix for `insertText` & completion on invalid list types
- add support for template strings and tags with replacement expressions, so strings like these should work now:

```ts
const = /*GraphiQL*/
    `
        ${myFragments}
        query MyQuery {
            something
            ${anotherString}
        }

    `
```

```ts
const = gql`
        ${myFragments}
        query MyQuery {
            something
            ${anotherString}
        }

    `
```
