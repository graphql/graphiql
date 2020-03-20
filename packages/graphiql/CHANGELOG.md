# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.3](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.2...graphiql@1.0.0-alpha.3) (2020-03-20)

**Note:** Version bump only for package graphiql

# [1.0.0-alpha.2](https://github.com/graphql/graphiql/compare/graphiql@1.0.0-alpha.0...graphiql@1.0.0-alpha.2) (2020-03-20)

### Bug Fixes

- Fix typo in documentation (comments) ([#1431](https://github.com/graphql/graphiql/issues/1431)) ([fdda8f0](https://github.com/graphql/graphiql/commit/fdda8f04479412d22e9a3e9215c7caa5369e7d83))
- initial request cache set, import tsc bugs ([#1266](https://github.com/graphql/graphiql/issues/1266)) ([6b98f8a](https://github.com/graphql/graphiql/commit/6b98f8a442d4a8ea160fb90a29acf33f5382db2e))

# [1.0.0-alpha.1](https://github.com/graphql/graphiql/compare/graphiql@0.17.5...graphiql@1.0.0-alpha.1) (2020-01-18)

### Bug Fixes

- hmr, file resolution warnings ([69bf701](https://github.com/graphql/graphiql/commit/69bf701))
- prefer displayName over type equality for children overrides ([e4cec0a](https://github.com/graphql/graphiql/commit/e4cec0a))
  - remove use of `findDOMNode` ([0b12323](https://github.com/graphql/graphiql/commit/0b12323)) by [@ryan-m-walker](https://github.com/ryan-m-walker)

### Features

- deprecate support for 15, support react 16 features ([#1107](https://github.com/graphql/graphiql/issues/1107)) ([bc4b6fc](https://github.com/graphql/graphiql/commit/bc4b6fc))
- **graphiql-theming:** Toolbar component ([#1203](https://github.com/graphql/graphiql/issues/1203)) by [@walaura](https://github.com/walaura) ([adb73f5](https://github.com/graphql/graphiql/commit/adb73f5))
- [new-ui] Tabs & Tabbars ([#1198](https://github.com/graphql/graphiql/issues/1198)) ([033f971](https://github.com/graphql/graphiql/commit/033f971)) by [@walaura](https://github.com/walaura)
- replace use of enzyme with react-testing-library ([#1144](https://github.com/graphql/graphiql/issues/1144)) by [@ryan-m-walker](https://github.com/ryan-m-walker) ([de73d6c](https://github.com/graphql/graphiql/commit/de73d6c))
- storybook+theme-ui for the new design ([#1145](https://github.com/graphql/graphiql/issues/1145)) ([7f97c0c](https://github.com/graphql/graphiql/commit/7f97c0c)) by [@walaura](https://github.com/walaura)

### BREAKING CHANGES

- Deprecate support for React 15. Please use React 16.8 or greater for hooks support.
  Co-authored-by: @ryan-m-walker, @acao
  Reviewed-by: @benjie

## [0.17.5](https://github.com/graphql/graphiql/compare/graphiql@0.17.4...graphiql@0.17.5) (2019-12-09)

**Note:** Version bump only for package graphiql

## [0.17.4](https://github.com/graphql/graphiql/compare/graphiql@0.17.3...graphiql@0.17.4) (2019-12-09)

### Bug Fixes

- graphiql babel test ignore paths ([e1588d9](https://github.com/graphql/graphiql/commit/e1588d9))

## [0.17.3](https://github.com/graphql/graphiql/compare/graphiql@0.17.2...graphiql@0.17.3) (2019-12-09)

### Bug Fixes

- express-graphql version ([e9848b0](https://github.com/graphql/graphiql/commit/e9848b0))
- test output, webpack resolution, clean build ([3b1c2c1](https://github.com/graphql/graphiql/commit/3b1c2c1))

## [0.17.2](https://github.com/graphql/graphiql/compare/graphiql@0.17.1...graphiql@0.17.2) (2019-12-03)

### Bug Fixes

- ensure css files move with babel dist ([ca95547](https://github.com/graphql/graphiql/commit/ca95547))
- remove css from downstream components. soon to be replaced w styled ([e765543](https://github.com/graphql/graphiql/commit/e765543))

## [0.17.1](https://github.com/graphql/graphiql/compare/graphiql@0.17.0...graphiql@0.17.1) (2019-12-03)

### Bug Fixes

- **graphiql:** duplicate query history key issue, fixes [#988](https://github.com/graphql/graphiql/issues/988) ([#1035](https://github.com/graphql/graphiql/issues/1035)) ([69c6826](https://github.com/graphql/graphiql/commit/69c6826))
- convert browserify build to webpack, fixes [#976](https://github.com/graphql/graphiql/issues/976) ([#1001](https://github.com/graphql/graphiql/issues/1001)) ([3caf041](https://github.com/graphql/graphiql/commit/3caf041))
- hints vertical scroll ([216eaeb](https://github.com/graphql/graphiql/commit/216eaeb))

# [0.17.0](https://github.com/graphql/graphiql/compare/graphiql@0.16.0...graphiql@0.17.0) (2019-11-26)

### Bug Fixes

- security bump, resolves [#1004](https://github.com/graphql/graphiql/issues/1004), SNYK-JS-MARKDOWNIT-459438 ([89c83db](https://github.com/graphql/graphiql/commit/89c83db))
- webpack resolutions for [#882](https://github.com/graphql/graphiql/issues/882), add webpack example ([ea9df3e](https://github.com/graphql/graphiql/commit/ea9df3e))

### Features

- **graphiql:** Prettify also formats query variables ([b7d0bfd](https://github.com/graphql/graphiql/commit/b7d0bfd))

# [0.16.0](https://github.com/graphql/graphiql/compare/graphiql@0.15.1...graphiql@0.16.0) (2019-10-19)

### Bug Fixes

- **accessibility:** improve accessibility of all components ([#967](https://github.com/graphql/graphiql/issues/967)) ([73a3f90](https://github.com/graphql/graphiql/commit/73a3f90))
- **css:** added minimum width for result panel in GraphiQL ([#980](https://github.com/graphql/graphiql/issues/980)) ([0c8b7ad](https://github.com/graphql/graphiql/commit/0c8b7ad))
- **graphiql:** better quota management ([#764](https://github.com/graphql/graphiql/issues/764)) ([7efed6c](https://github.com/graphql/graphiql/commit/7efed6c))

### Features

- **css:** beautify code tag in doc explorer ([#959](https://github.com/graphql/graphiql/issues/959)) resolves [#949](https://github.com/graphql/graphiql/issues/949) ([30810a2](https://github.com/graphql/graphiql/commit/30810a2))

## [0.15.1](https://github.com/graphql/graphiql/compare/graphiql@0.15.0...graphiql@0.15.1) (2019-10-04)

### Bug Fixes

- build tweaks ([0bc6a7c](https://github.com/graphql/graphiql/commit/0bc6a7c))

# 0.15.0 (2019-10-04)

### Bug Fixes

- check `window` is defined before using it ([#962](https://github.com/graphql/graphiql/issues/962)) ([e4866ad](https://github.com/graphql/graphiql/commit/e4866ad))
- **graphiql:** prettify keybinding bug for Firefox. Fixes [#905](https://github.com/graphql/graphiql/issues/905) ([fdf98ba](https://github.com/graphql/graphiql/commit/fdf98ba))
- check `this.editor` exist before `this.editor.off` in QueryEditor ([#669](https://github.com/graphql/graphiql/issues/669)) ([ca226ee](https://github.com/graphql/graphiql/commit/ca226ee)), closes [#665](https://github.com/graphql/graphiql/issues/665)
- extraKeys bugfix window regression ([f3d0427](https://github.com/graphql/graphiql/commit/f3d0427))
- preserve ctrl-f key for macOS ([7c381f9](https://github.com/graphql/graphiql/commit/7c381f9))

### Features

- convert LSP from flow to typescript ([#957](https://github.com/graphql/graphiql/issues/957)) [@acao](https://github.com/acao) @Neitch [@benjie](https://github.com/benjie) ([36ed669](https://github.com/graphql/graphiql/commit/36ed669))

## 0.13.2 (2019-06-21)

## 0.14.3 (2019-09-01)

### Bug Fixes

- check `this.editor` exist before `this.editor.off` in QueryEditor ([#669](https://github.com/graphql/graphiql/issues/669)) ([ca226ee](https://github.com/graphql/graphiql/commit/ca226ee)), closes [#665](https://github.com/graphql/graphiql/issues/665)
- extraKeys bugfix window regression ([f3d0427](https://github.com/graphql/graphiql/commit/f3d0427))
- preserve ctrl-f key for macOS ([7c381f9](https://github.com/graphql/graphiql/commit/7c381f9))
- remove newline ([19f5d1d](https://github.com/graphql/graphiql/commit/19f5d1d))

## 0.13.2 (2019-06-21)

## 0.13.2 (2019-06-21)
