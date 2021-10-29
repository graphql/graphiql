## global efforts
- [ ] improve build and package exports using a more efficient and dynamic bundling pattern. consider swc, esbuild, etc
- [ ] upgrade to yarn 3?
- [ ] explore using esbuild/swc, etc. 
   - [ ] estrella, vite, etc as webpack replacements for dev tooling

## docs efforts
- [ ] move detailed readme instructions to a root `docs` folder? or `docs` folders for each workspace in `packages`? 
  - so,`docs/graphiql`/`docs/monaco-graphql` or `packages/graphiql/docs`/`packagess/monaco-graphql/docs`?
- [ ] Replace non-build-verifying examples with codesandbox examples linked from the examples/README.md pointed to `latest` tags for graphiql/etc
  - Monaco-example verifies the monaco-graphql type/build interface
  - Graphiql-webpack example verifies the graphiql type/build interface
  - Other examples make more sense on codesandbox
  - Removing CRA and other build tools will speed up the install and github actions pipeline substantially
  - each project (graphiql, monaco-graphql, codemirror-graphql) should have an `examples` section in it's readme that links to various codesandbox examples, using `latest` tag of that module

## `graphiql@1.x`
- [ ] use dynamic imports instead of inline require for SSR & support esbuild consumers

## `graphiql@2.x`

`graphiql@2.x` will be a lightweight implementation of the below two SDK libraries, as will the new graphql playground replacement
- [ ] implement `@graphiql/toolkit` and `@graphql/react` to create a simple, react-based editor
 - [ ] query history dropped?
 - [ ] doc explorer optional?

### `@graphiql/toolkit`
- [ ] `createFetcher` make it more pluggable - exchange/link as inspiration?
- [ ] port `graphiql` utilities and in-component utilities, anything that is useful that isn't react focused.
  - [ ] `mergeAST`
  - [ ] `getQueryFacts`

### `@graphiql/react`
- [ ] port existing `graphiql` components, reconciling the context rfc react , monaco redesign and rewrite with the important upstream 1.x changes
  - [ ] flexible, seperate editor components, configurable via props and/or `monaco-graphql`
   - consider controlled via uncontrolled state as an explicit rather than implied option
  - [ ] `DocExplorer` and friends can move here, for a more lightweight import to use this directly
- [ ] convert to hooks entirely, expose hooks for other `@graphiql/react` implementations to use
- [ ] provide & document theme configuration
- [ ] add any new translation strings from 1.x work
- [ ] set up translation platform

## `monaco-graphql`
- [ ] Improve Language Service & worker patterns
  - Dynamic webworker input means re-creating webworkers constantly, because concurrency models denote fixed input state for each concurrent process.
  - We need to simplify how these instantiate - potentially by using cacheing in the main process?
- [ ] add symbols support
- [ ] add variables validation support
- [ ] add variables completion support

## `codemirror-graphql`

most improvements will be to underlying dependencies, shared by `monaco-graphql`

- [ ] standalone examples on codesandbox
