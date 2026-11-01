## CodeMirror 6 Legacy GraphQL Parser Example

This example adapts the CodeMirror 5 GraphQL stream parser from
`codemirror-graphql/cm6-legacy/mode` to the current CodeMirror 6 editor. Parcel 2
bundles the application, and TypeScript 7 checks its types.

The `codemirror6` npm alias supplies the modern editor's basic setup. The separate
CodeMirror 5 dependency satisfies the legacy adapter's peer dependency.

### Setup

Use Node.js 24 and pnpm. This example is outside the repository's pnpm workspace.
Run these commands from this directory:

```sh
pnpm --ignore-workspace install
pnpm types:check
pnpm start
```

Run `pnpm build` for production files in `dist`.

The repository widens the adapter's language peer to compatible 6.x releases.
Published `codemirror-graphql` 3.0.0 still declares exactly 6.0.0, so standalone
installs with newer language releases may report that peer warning until the
next patch release. The legacy parser works with the current language release.
