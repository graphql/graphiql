Below is a temporary, manually maintained changelog that will eventually be controlled by something like `cz-conventional-changelog`. Until we get there, we have a manual publish strategy. Updates to `Contributing.md` with more details coming soon

## GraphiQL 0.14.2 - 11 Aug, 2019

### Fixes 
- Fix SSR & use of window when introducing new `extraKeys` capability (#942)


## GraphiQL 0.14.0 - 11 Aug, 2019

### Features
-  Add defaultVariableEditorOpen prop (#744) - @acao

### Fixes 
- Fix formatting of subscription errors -  #636, #722 - @benjie
- preserve ctrl-f key for macOS - #759 - @pd4d10
- Fix earlier 'Mode graphql failed to advance stream' on Linux by eating an exotic whitespace character - #735 closed by #932 - @benjie
- Fix: check `this.editor` exists before `this.editor.off` in QueryEditor


## Codemirror GraphQL - 0.9 - 11 Aug, 2019

### Chores
- BREAKING: Update to gls-interface and gls-parser ^2.1
- BREAKING: Deprecate support for GraphQL 0.11 and below
- BREAKING: introduce MIT license
- BREAKING: Support GraphQL 14


## GraphQL Language Service Server 2.1.0 - 11 Aug, 2019

### Features
- Replace babylon with @babel/parser (#879) @ganemone
- Add support for gql template tags (#883) @ganemone @Neitsch

### Chores
- BREAKING: remove incompatible dependencies on graphql 0.11 and below 
- BREAKING: add peer support for graphql 14.x
- BREAKING: change copyright to MIT
- update formatting for monorepo eslint/prettier rules
- update readme, badges


## GraphQL Language Service Parser 2.1.0 - 11 Aug, 2019

### Fixes
- Fix 'mode graphql failed to advance stream' error from shift-alt-space, etc - #932 - @benjie


## GraphQL Language Service Interface 2.1.0 - 11 Aug, 2019

### Features
- add __typename field suggestion against object type - (#903) @yoshiakis
- Update sortText logic, so that field sort is schema driven rather than alphabetically sorted - (#884) @ganenome

### Chores
- BREAKING: add peer support for graphql 14.x
- MINOR BREAKING: Use MIT license
- add test case for language service hover - @divyenduz @AGS-


## GraphQL Language Service  2.1.0
- BREAKING: add peer support for graphql 14.x
- BREAKING: remove incompatible dependencies on graphql 0.11 and below (b/c of gls-utils 2.x) 


## GraphQL Language Service Utils 2.1.0 - 11 Aug, 2019

### Chores
- BREAKING: change copyright to MIT
- update formatting for monorepo eslint/prettier rules
- update readme, badges


## GraphQL Language Service Types 1.3.0 - 11 Aug, 2019

### Chores
- BREAKING: change copyright to MIT
- BREAKING: add peer support for graphql 14.x
- update formatting for monorepo eslint/prettier rules
- update readme, badges


## GraphiQL 0.13.2 - 21 June, 2019

### Features
- Hint/popup/etc DOM nodes use container rather than creating children of <body> - #791 - @codestryke
- Add readOnly prop and pass to `QueryEditor` and `VariableEditor` - #718 - @TheSharpieOne
- Add operationName to introspection query - #664 - @jbblanchet
- Image Preview Functionality - #789 - @dunnbobcat @asiandrummer

### Fixes
- Destroy image hover tooltip when it isn't needed - #874 - @acao
- Copy non-formatted query to avoid stripping out comments - #832 - @jaebradley
- Normalizes no-break spaces - #781 - @zouxuoz
- Prevents crashing on Shift-Alt-Space - #781 - @zouxuoz
- Fix UI state change after favoriting a query - #747 - @benjie

### Chores
- BREAKING: Upgrade to `codemirror-graphql` 0.8.3 - #773 - @jonaskello
- BREAKING: Change copyright to GraphQL Contributors, License to MIT
- Netlify deployments per PR - @orta
- Add unit test coverage
- Switch to Jest


## Codemirror Graphql Mode 0.8.4 - 11 Aug, 2018
You will now be importing async methods from gls-interface 2.0.0, thus your bundler will require regenerator runtime

## Chores
- BREAKING - Use GLS interface/parser 2.1.0 for graphql 14
- BREAKING - This introduces async/await

## GraphQL Language Service Interface 2.0.0 - 11 Sep, 2018

### Chores
- BREAKING: upgrade internal dependencies - gls-parser, gls-types, and gls-utils to 2.0.0 - @lostplan
- BREAKING: remove incompatible dependencies on graphql 0.11 and below - @lostplan


## GraphQL Language Service Utils 2.0.0 - 11 Sep, 2018

### Chores
- BREAKING: deprecate support for graphql-js 0.11.x and below - @lostplan [graphql/graphql-language-service#256](https://github.com/graphql/graphql-language-service/pull/256) [new ref](https://github.com/graphql/graphiql/commit/895e68537fd802b8b6ddf2578a1f76f85982c773) because of [this change](https://github.com/graphql/graphiql/commit/068c57fdb4a147be3c2fc38167e2def74d217a82#diff-696ceb17e38e4a274d4a149d24513b78)
- BREAKING: GraphQL 14.x support, peer dependency resolutions - #244 - @AGS-


## GraphQL Language Service Utils 1.2.2 - 11 Sep, 2018

### Chores
-  add graphql-js 0.13 to peer deps of types package (graphql/graphql-language-service#241) 


## GraphQL Language Service Server 2.0.0 - 11 Sep, 2019

### Chores
- add graphql-js 0.13 to peer dependencies (graphql/graphql-language-service#241) 
- BREAKING: ugrade internal dependencies - gls-interface, gls-server and gls-utils to 2.0.0 @lostplan


## GraphQL Language Service 2.0.0 - 11 Sep, 2018

### Chores
- BREAKING: ugrade internal dependencies - gls-interface, gls-server and gls-utils to 2.0.0 @Sol

