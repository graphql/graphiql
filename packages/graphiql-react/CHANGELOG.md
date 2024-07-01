# @graphiql/react

## 0.22.4

### Patch Changes

- [#3634](https://github.com/graphql/graphiql/pull/3634) [`adf0ba01`](https://github.com/graphql/graphiql/commit/adf0ba019902dcac2e49ccee69b79a6665c4766d) Thanks [@dimaMachina](https://github.com/dimaMachina)! - when alpha is `1`, use `hsl` instead of `hsla`

## 0.22.3

### Patch Changes

- [#3624](https://github.com/graphql/graphiql/pull/3624) [`335d830c`](https://github.com/graphql/graphiql/commit/335d830c2a4e551ef97fbeff8ed7c538ff5cd4af) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix doc explorer search input is cut off while clicking on autocomplete results

## 0.22.2

### Patch Changes

- [#3602](https://github.com/graphql/graphiql/pull/3602) [`03ab3a6b`](https://github.com/graphql/graphiql/commit/03ab3a6b76378591ef79a828d80cc69b0b8f2842) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid using deprecated Component.defaultProps for icon titles

- Updated dependencies [[`aa6dbbb4`](https://github.com/graphql/graphiql/commit/aa6dbbb45bf51c1966537640fbe5c4f375735c8d)]:
  - graphql-language-service@5.2.1
  - codemirror-graphql@2.0.12

## 0.22.1

### Patch Changes

- [#3597](https://github.com/graphql/graphiql/pull/3597) [`224b43f5`](https://github.com/graphql/graphiql/commit/224b43f5473456f264a82998d48a34a441537f54) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix TypeScript type of the `label` prop of the `Tooltip` component

## 0.22.0

### Minor Changes

- [#3580](https://github.com/graphql/graphiql/pull/3580) [`d48f4ef5`](https://github.com/graphql/graphiql/commit/d48f4ef56578dad7ec90f33458353791e463ef7b) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Implement correct merging of incremental responses (@defer/@stream)

## 0.21.0

### Minor Changes

- [#3569](https://github.com/graphql/graphiql/pull/3569) [`5d051054`](https://github.com/graphql/graphiql/commit/5d05105469c3f0cbeb5e294da1cf6ff2355e4eb5) Thanks [@AaronMoat](https://github.com/AaronMoat)! - Update to markdown-it 14.x

## 0.20.4

### Patch Changes

- Updated dependencies [[`fc7de5a7`](https://github.com/graphql/graphiql/commit/fc7de5a75f4b23dd62dd630b705895b5fa5d0a03)]:
  - codemirror-graphql@2.0.11

## 0.20.3

### Patch Changes

- [#3526](https://github.com/graphql/graphiql/pull/3526) [`2b6ea316`](https://github.com/graphql/graphiql/commit/2b6ea3166c8d8e152f16d87c878aa8a66f1b3775) Thanks [@benjie](https://github.com/benjie)! - Add new `useOptimisticState` hook that can wrap a useState-like hook to perform optimistic caching of state changes, this helps to avoid losing characters when the user is typing rapidly. Example of usage: `const [state, setState] = useOptimisticState(useOperationsEditorState());`

## 0.20.2

### Patch Changes

- [#3447](https://github.com/graphql/graphiql/pull/3447) [`e89c432d`](https://github.com/graphql/graphiql/commit/e89c432d8d2b91f087b683360f23e0686462bc02) Thanks [@acao](https://github.com/acao)! - Remove initialState for new hooks, add `additionalComponent` to toolbar to allow buttons to use context

## 0.20.1

### Patch Changes

- [#3445](https://github.com/graphql/graphiql/pull/3445) [`39bf31d1`](https://github.com/graphql/graphiql/commit/39bf31d15b1e7fb5f235ec9adc1ce8081536de4a) Thanks [@acao](https://github.com/acao)! - Export new hooks

## 0.20.0

### Minor Changes

- [#3443](https://github.com/graphql/graphiql/pull/3443) [`f6afd22d`](https://github.com/graphql/graphiql/commit/f6afd22d3f5a20089759042f16fd865646a32038) Thanks [@acao](https://github.com/acao)! - Add useHeadersEditorState and generic useEditorState hooks

## 0.19.4

### Patch Changes

- Updated dependencies [[`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c), [`7b00774a`](https://github.com/graphql/graphiql/commit/7b00774affad1f25253ce49f1f48c9e3f372808c)]:
  - graphql-language-service@5.2.0
  - codemirror-graphql@2.0.10

## 0.19.3

### Patch Changes

- [#3371](https://github.com/graphql/graphiql/pull/3371) [`2348641c`](https://github.com/graphql/graphiql/commit/2348641c07748691c478ac5f67032b7e9081f9cb) Thanks [@acao](https://github.com/acao)! - Solves #2825, an old bug where new tabs were created on every refresh

  the bug occurred when:

  1. `shouldPersistHeaders` is not set to true
  2. `headers` or `defaultHeaders` are provided as props
  3. the user refreshes the browser

## 0.19.2

### Patch Changes

- [#3364](https://github.com/graphql/graphiql/pull/3364) [`d67c13f6`](https://github.com/graphql/graphiql/commit/d67c13f6e1f478b171801afd0767b98312db04c9) Thanks [@acao](https://github.com/acao)! - Fix search result bug on select, #33307

- Updated dependencies [[`4cbdf183`](https://github.com/graphql/graphiql/commit/4cbdf18385d34ef9bc095c376936f92a62eb9e9b)]:
  - @graphiql/toolkit@0.9.1

## 0.19.1

### Patch Changes

- [#3349](https://github.com/graphql/graphiql/pull/3349) [`17069e7a`](https://github.com/graphql/graphiql/commit/17069e7a0224dbce3f5523630a898e093f5c47c9) Thanks [@acao](https://github.com/acao)! - fix display of deprecation reason on field type docs

- [#3341](https://github.com/graphql/graphiql/pull/3341) [`e4a36207`](https://github.com/graphql/graphiql/commit/e4a362071edf1db53f87f271c523ab2f3a5c4717) Thanks [@acao](https://github.com/acao)! - Fix code exporter plugin on early init, add hooks

- Updated dependencies [[`ffb6486d`](https://github.com/graphql/graphiql/commit/ffb6486d1eab0be2bc8fdec366b5671a5d6504d1)]:
  - @graphiql/toolkit@0.9.0

## 0.19.0

### Minor Changes

- [#3130](https://github.com/graphql/graphiql/pull/3130) [`9a38de29`](https://github.com/graphql/graphiql/commit/9a38de29fddf174ba9e793ac5852407537244f87) Thanks [@lesleydreyer](https://github.com/lesleydreyer)! - - Add a "clear history" button to clear all history as well as trash icons to clear individual history items

  - Change so item is in history items or history favorites, not both
  - Fix history label editing so if the same item is in the list more than once it edits the correct label
  - Pass the entire history item in history functions (addToHistory, editLabel, toggleFavorite, etc.) so users building their own HistoryContext.Provider will get any additional props they added to the item in their customized functions
  - Adds a "setActive" callback users can use to customize their UI when the history item is clicked

## 0.18.0

### Minor Changes

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - remove `initialTabs`, use `defaultTabs` instead

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/dialog` by `@radix-ui/react-dialog` replace `@reach/visually-hidden` by `@radix-ui/react-visually-hidden`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/menu-button` by `@radix-ui/react-dropdown-menu` remove `@reach/listbox` remove `<ToolbarListbox />` and `<Listbox />` components (use `<Menu />` instead)

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - fixed long list items in dropdown were hidden

  rename `<Menu />` to `<DropdownMenu />` rename `<Menu.List />` to `<DropdownMenu.Content />` rename `<Menu.Item />` to `<DropdownMenu.Item />` rename `<Menu.Button />` to `<DropdownMenu.Button />`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/tooltip` by `@radix-ui/react-tooltip`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/combobox` with `Combobox` from `@headlessui/react`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - tabs could be reorderded

### Patch Changes

- [#2716](https://github.com/graphql/graphiql/pull/2716) [`bc9d243d`](https://github.com/graphql/graphiql/commit/bc9d243d40b95f95fc9d00d25aa0dd1733952626) Thanks [@SimenB](https://github.com/SimenB)! - Make `@types/codemirror` a dependency of `@graphiql/react`

- [#3228](https://github.com/graphql/graphiql/pull/3228) [`67bf93a3`](https://github.com/graphql/graphiql/commit/67bf93a33e98c60ae3a686063a1c47037f88ef49) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5), [`61986469`](https://github.com/graphql/graphiql/commit/619864691941c46cc0b0848e8713028e20212c36)]:
  - graphql-language-service@5.1.7
  - codemirror-graphql@2.0.9

## 0.18.0-alpha.1

### Patch Changes

- [#2716](https://github.com/graphql/graphiql/pull/2716) [`bc9d243d`](https://github.com/graphql/graphiql/commit/bc9d243d40b95f95fc9d00d25aa0dd1733952626) Thanks [@SimenB](https://github.com/SimenB)! - Make `@types/codemirror` a dependency of `@graphiql/react`

- [#3228](https://github.com/graphql/graphiql/pull/3228) [`67bf93a3`](https://github.com/graphql/graphiql/commit/67bf93a33e98c60ae3a686063a1c47037f88ef49) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- Updated dependencies [[`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9), [`d9e5089f`](https://github.com/graphql/graphiql/commit/d9e5089f78f85cd50c3e3e3ba8510f7dda3d06f5)]:
  - graphql-language-service@5.1.7-alpha.0
  - codemirror-graphql@2.0.9-alpha.1

## 0.18.0-alpha.0

### Minor Changes

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - remove `initialTabs`, use `defaultTabs` instead

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/dialog` by `@radix-ui/react-dialog` replace `@reach/visually-hidden` by `@radix-ui/react-visually-hidden`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/menu-button` by `@radix-ui/react-dropdown-menu` remove `@reach/listbox` remove `<ToolbarListbox />` and `<Listbox />` components (use `<Menu />` instead)

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - fixed long list items in dropdown were hidden

  rename `<Menu />` to `<DropdownMenu />` rename `<Menu.List />` to `<DropdownMenu.Content />` rename `<Menu.Item />` to `<DropdownMenu.Item />` rename `<Menu.Button />` to `<DropdownMenu.Button />`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/tooltip` by `@radix-ui/react-tooltip`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `@reach/combobox` with `Combobox` from `@headlessui/react`

- [#3181](https://github.com/graphql/graphiql/pull/3181) [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696) Thanks [@B2o5T](https://github.com/B2o5T)! - tabs could be reorderded

### Patch Changes

- Updated dependencies [[`61986469`](https://github.com/graphql/graphiql/commit/619864691941c46cc0b0848e8713028e20212c36)]:
  - codemirror-graphql@2.0.9-alpha.0

## 0.17.6

### Patch Changes

- [#3194](https://github.com/graphql/graphiql/pull/3194) [`911cf3e0`](https://github.com/graphql/graphiql/commit/911cf3e0b0fa13268245463c8db8299279e5c461) Thanks [@dwwoelfel](https://github.com/dwwoelfel)! - fix tab content getting replaced on `changeTab`

- [#3124](https://github.com/graphql/graphiql/pull/3124) [`c645932c`](https://github.com/graphql/graphiql/commit/c645932c7973e11ad917e1d1d897fd409f8c042f) Thanks [@B2o5T](https://github.com/B2o5T)! - avoid unecessary renders by using useMemo or useCallback

- [#3197](https://github.com/graphql/graphiql/pull/3197) [`2ca4841b`](https://github.com/graphql/graphiql/commit/2ca4841baf74e87a3f067b3415f8da3347ee3898) Thanks [@B2o5T](https://github.com/B2o5T)! - remove confusing ligatures, set `font-variant-ligatures: none`

- [#3136](https://github.com/graphql/graphiql/pull/3136) [`7bf90929`](https://github.com/graphql/graphiql/commit/7bf90929f62ba812c0946e0424f9f843f7b6b0ff) Thanks [@B2o5T](https://github.com/B2o5T)! - replace rest of `event.keyCode` usages by `event.code`

- [#3118](https://github.com/graphql/graphiql/pull/3118) [`431b7fe1`](https://github.com/graphql/graphiql/commit/431b7fe1efefa4867f0ea617adc436b1117052e8) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer `.textContent` over `.innerText`

## 0.17.5

### Patch Changes

- [#3147](https://github.com/graphql/graphiql/pull/3147) [`2b212941`](https://github.com/graphql/graphiql/commit/2b212941628498957d95ee89a7a5a0623f391b7a) Thanks [@Yahkob](https://github.com/Yahkob)! - limit code-mirror css scope to .graphiql-container

- [#3180](https://github.com/graphql/graphiql/pull/3180) [`9b333a04`](https://github.com/graphql/graphiql/commit/9b333a047d6b75db7681f484156d8772e9f91810) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Remove duplicate Vite config and again make sure to not include `react/jsx-runtime` in the bundle

## 0.17.4

### Patch Changes

- [#3077](https://github.com/graphql/graphiql/pull/3077) [`707f3cbc`](https://github.com/graphql/graphiql/commit/707f3cbca3ac2ce186058e7d2b145cdf69bf7d9c) Thanks [@Zolwiastyl](https://github.com/Zolwiastyl)! - show all schema types in explorer

- Updated dependencies [[`06007498`](https://github.com/graphql/graphiql/commit/06007498880528ed75dd4d705dcbcd7c9e775939)]:
  - graphql-language-service@5.1.6
  - codemirror-graphql@2.0.8

## 0.17.3

### Patch Changes

- Updated dependencies [[`4d33b221`](https://github.com/graphql/graphiql/commit/4d33b2214e941f171385a1b72a1fa995714bb284)]:
  - graphql-language-service@5.1.5
  - codemirror-graphql@2.0.7

## 0.17.2

### Patch Changes

- [#3113](https://github.com/graphql/graphiql/pull/3113) [`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `.forEach` with `for..of`

- [#3126](https://github.com/graphql/graphiql/pull/3126) [`4879984e`](https://github.com/graphql/graphiql/commit/4879984ea1803a6e9f97d81c97e8ba27aacddae9) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer KeyboardEvent#key over KeyboardEvent#keyCode

- [#3109](https://github.com/graphql/graphiql/pull/3109) [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-floating-promises` eslint rule

- Updated dependencies [[`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9), [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b), [`15c26eb6`](https://github.com/graphql/graphiql/commit/15c26eb6d621a85df9eecb2b8a5fa009fa2fe040)]:
  - codemirror-graphql@2.0.6
  - @graphiql/toolkit@0.8.4
  - graphql-language-service@5.1.4

## 0.17.1

### Patch Changes

- [#3033](https://github.com/graphql/graphiql/pull/3033) [`2d5c60ec`](https://github.com/graphql/graphiql/commit/2d5c60ecf717abafde2bddd32b2772261d3eec8b) Thanks [@B2o5T](https://github.com/B2o5T)! - remove redundant `catch` statement

- [#3046](https://github.com/graphql/graphiql/pull/3046) [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer .at() method for index access

- [#3017](https://github.com/graphql/graphiql/pull/3017) [`4a2284f5`](https://github.com/graphql/graphiql/commit/4a2284f54809f91d03ba51b9eb4e3ba7b8b7e773) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid bundling code from `react/jsx-runtime` so that the package can be used with Preact

- [#3042](https://github.com/graphql/graphiql/pull/3042) [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0) Thanks [@B2o5T](https://github.com/B2o5T)! - Prefer String#slice() over String#substr() and String#substring()

- [#3061](https://github.com/graphql/graphiql/pull/3061) [`7cf4908a`](https://github.com/graphql/graphiql/commit/7cf4908a5d4bd58af315047f4dec5236e8c701fc) Thanks [@B2o5T](https://github.com/B2o5T)! - remove unneeded `reference &&` assertion, convert to switch

- Updated dependencies [[`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d), [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0)]:
  - codemirror-graphql@2.0.5
  - @graphiql/toolkit@0.8.3
  - graphql-language-service@5.1.3

## 0.17.0

### Minor Changes

- [#3012](https://github.com/graphql/graphiql/pull/3012) [`65f5176a`](https://github.com/graphql/graphiql/commit/65f5176a408cfbbc514ca60e2e4bd2ea133a8b0b) Thanks [@benjie](https://github.com/benjie)! - GraphiQL now maintains the DocExplorer navigation stack as best it can when the schema is updated

### Patch Changes

- [#2993](https://github.com/graphql/graphiql/pull/2993) [`bdc966cb`](https://github.com/graphql/graphiql/commit/bdc966cba6134a72ff7fe40f76543c77ba15d4a4) Thanks [@B2o5T](https://github.com/B2o5T)! - add `unicorn/consistent-destructuring` rule

- Updated dependencies [[`e68cb8bc`](https://github.com/graphql/graphiql/commit/e68cb8bcaf9baddf6fca747abab871ecd1bc7a4c), [`f788e65a`](https://github.com/graphql/graphiql/commit/f788e65aff267ec873237034831d1fd936222a9b), [`bdc966cb`](https://github.com/graphql/graphiql/commit/bdc966cba6134a72ff7fe40f76543c77ba15d4a4), [`db2a0982`](https://github.com/graphql/graphiql/commit/db2a0982a17134f0069483ab283594eb64735b7d), [`8725d1b6`](https://github.com/graphql/graphiql/commit/8725d1b6b686139286cf05dec6a84d89942128ba)]:
  - graphql-language-service@5.1.2
  - codemirror-graphql@2.0.4
  - @graphiql/toolkit@0.8.2

## 0.16.0

### Minor Changes

- [#2895](https://github.com/graphql/graphiql/pull/2895) [`ccba2f33`](https://github.com/graphql/graphiql/commit/ccba2f33b67a03f492222f7afde1354cfd033b42) Thanks [@TheMightyPenguin](https://github.com/TheMightyPenguin)! - Add user facing setting for persisting headers

### Patch Changes

- [#2931](https://github.com/graphql/graphiql/pull/2931) [`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `no-negated-condition` and `no-else-return` rules

- [#2964](https://github.com/graphql/graphiql/pull/2964) [`cec3fb2a`](https://github.com/graphql/graphiql/commit/cec3fb2a493c4a0c40df7dfad04e1a95ed35e786) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-export-from` rule

- [#2932](https://github.com/graphql/graphiql/pull/2932) [`11e6ad11`](https://github.com/graphql/graphiql/commit/11e6ad11e745c671eb320731697887bb8d7177b7) Thanks [@B2o5T](https://github.com/B2o5T)! - replace `compose.ts` with `clsx` for class concatenation

- [#2937](https://github.com/graphql/graphiql/pull/2937) [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-includes`

- [#2933](https://github.com/graphql/graphiql/pull/2933) [`d502a33b`](https://github.com/graphql/graphiql/commit/d502a33b4332f1025e947c02d7cfdc5799365c8d) Thanks [@B2o5T](https://github.com/B2o5T)! - enable @typescript-eslint/no-unused-expressions

- [#2965](https://github.com/graphql/graphiql/pull/2965) [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `unicorn/prefer-optional-catch-binding` rule

- [#2963](https://github.com/graphql/graphiql/pull/2963) [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `prefer-destructuring` rule

- [#2942](https://github.com/graphql/graphiql/pull/2942) [`4ff2794c`](https://github.com/graphql/graphiql/commit/4ff2794c8b6032168e27252096cb276ce712878e) Thanks [@B2o5T](https://github.com/B2o5T)! - enable `sonarjs/no-redundant-jump` rule

- Updated dependencies [[`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147), [`d1fcad72`](https://github.com/graphql/graphiql/commit/d1fcad72607e2789517dfe4936b5ec604e46762b), [`4a8b2e17`](https://github.com/graphql/graphiql/commit/4a8b2e1766a38eb4828cf9a81bf9d767070041de), [`695100bd`](https://github.com/graphql/graphiql/commit/695100bd317940ff3ffd8f56b54248c1dba1ac04), [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9), [`c44ea4f1`](https://github.com/graphql/graphiql/commit/c44ea4f1917b97daac815c08299b934c8ca57ed9), [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913), [`18f8e80a`](https://github.com/graphql/graphiql/commit/18f8e80ae12edfd0c36adcb300cf9e06ac27ea49), [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215), [`6a9d913f`](https://github.com/graphql/graphiql/commit/6a9d913f0d1b847124286b3fa1f3a2649d315171)]:
  - codemirror-graphql@2.0.3
  - @graphiql/toolkit@0.8.1
  - graphql-language-service@5.1.1

## 0.15.0

### Minor Changes

- [#2908](https://github.com/graphql/graphiql/pull/2908) [`3340fd74`](https://github.com/graphql/graphiql/commit/3340fd745e181ba8f1f5a6ed002a04d253a78d4a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Deprecate the `initialTabs` prop and add a `defaultTabs` props that supersedes it

- [#2907](https://github.com/graphql/graphiql/pull/2907) [`3a7d0007`](https://github.com/graphql/graphiql/commit/3a7d00071922e2005777c92daf6ad0c1ce3e2816) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Clearly separate the fetching and subscription states for multipart requests (like subscriptions) and show the stop-button as long as the subscription is running

### Patch Changes

- [#2910](https://github.com/graphql/graphiql/pull/2910) [`16174a05`](https://github.com/graphql/graphiql/commit/16174a053ed89fb9554d096395ab7bf69c8f6911) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix autocomplete styles for field type and description on the right

- [#2919](https://github.com/graphql/graphiql/pull/2919) [`f6cae4ea`](https://github.com/graphql/graphiql/commit/f6cae4eaa0258ea7fcde97ba6368830955f0abf4) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix overflow when there are lots of tabs that don't fit into the tab bar at once

- [#2905](https://github.com/graphql/graphiql/pull/2905) [`0851d5f9`](https://github.com/graphql/graphiql/commit/0851d5f9ecf709597d0a698609d88f99c4395665) Thanks [@ccbrown](https://github.com/ccbrown)! - Fix: prevent default event for graphiql-doc-explorer-back link

- [#2912](https://github.com/graphql/graphiql/pull/2912) [`83364b28`](https://github.com/graphql/graphiql/commit/83364b28020b5946ed58908d6d977f1de766e75d) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add missing effect dependency to make sure updates to the `defaultHeaders` prop have the desired effect

## 0.14.0

### Minor Changes

- [#2821](https://github.com/graphql/graphiql/pull/2821) [`29630c22`](https://github.com/graphql/graphiql/commit/29630c2219bca8b825ab0897840864364a9de2e8) Thanks [@avaly](https://github.com/avaly)! - Initial tabs support

### Patch Changes

- [#2885](https://github.com/graphql/graphiql/pull/2885) [`8f926489`](https://github.com/graphql/graphiql/commit/8f9264896e9971951853463a283a90ba3d1310ef) Thanks [@simhnna](https://github.com/simhnna)! - Fix stop execution button showing a dropdown

- [#2886](https://github.com/graphql/graphiql/pull/2886) [`2ba2f620`](https://github.com/graphql/graphiql/commit/2ba2f620b6e7de3ae6b5ea641f33e600f7f44e08) Thanks [@B2o5T](https://github.com/B2o5T)! - feat: add `defaultHeaders` prop

## 0.13.7

### Patch Changes

- Updated dependencies [[`20869583`](https://github.com/graphql/graphiql/commit/20869583eff563f5d6494e93302a835f0e034f4b)]:
  - codemirror-graphql@2.0.2

## 0.13.6

### Patch Changes

- Updated dependencies [[`353f434e`](https://github.com/graphql/graphiql/commit/353f434e5f6bfd1bf6f8ee97d4ae8ce4f897085f)]:
  - codemirror-graphql@2.0.1

## 0.13.5

### Patch Changes

- [#2839](https://github.com/graphql/graphiql/pull/2839) [`682ad06e`](https://github.com/graphql/graphiql/commit/682ad06e58ded2f82fa973e8e6613dd654417fe2) Thanks [@ClemensSahs](https://github.com/ClemensSahs)! - Export the `PluginContextProvider` component

## 0.13.4

### Patch Changes

- [#2824](https://github.com/graphql/graphiql/pull/2824) [`4e2f7ff9`](https://github.com/graphql/graphiql/commit/4e2f7ff99c578ceae54a1ae17c02088bd91b89c3) Thanks [@TheMightyPenguin](https://github.com/TheMightyPenguin)! - fix: prevent key down events when pressing escape to close autocomplete dialogs

## 0.13.3

### Patch Changes

- [#2791](https://github.com/graphql/graphiql/pull/2791) [`42700076`](https://github.com/graphql/graphiql/commit/4270007671ce52f6c2250739916083611748b657) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure that the info overlay in editors is shown above the vertical scrollbar

* [#2792](https://github.com/graphql/graphiql/pull/2792) [`36839800`](https://github.com/graphql/graphiql/commit/36839800de128b05d11c262036c8240390c72a14) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid resetting visible plugin state when explorer or history context changes

- [#2778](https://github.com/graphql/graphiql/pull/2778) [`905f2e5e`](https://github.com/graphql/graphiql/commit/905f2e5ea3f0b304d27ea583e250ed4baff5016e) Thanks [@jonathanawesome](https://github.com/jonathanawesome)! - Adds a box-model reset for all children of the `.graphiql-container` class. This change facilitated another change to the `--sidebar-width` variable.

## 0.13.2

### Patch Changes

- [#2653](https://github.com/graphql/graphiql/pull/2653) [`39b4668d`](https://github.com/graphql/graphiql/commit/39b4668d43176526d37ecf07d8c86901d53e0d80) Thanks [@dylanowen](https://github.com/dylanowen)! - Fix `fetchError` not being cleared when a new `fetcher` is used

## 0.13.1

### Patch Changes

- Updated dependencies [[`e244b782`](https://github.com/graphql/graphiql/commit/e244b78291c2e2bb02d5753db82437926ebb4df4)]:
  - @graphiql/toolkit@0.8.0

## 0.13.0

### Minor Changes

- [#2735](https://github.com/graphql/graphiql/pull/2735) [`ca067d88`](https://github.com/graphql/graphiql/commit/ca067d88148c5d221d196790a997ad599038fad1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add CSS variables for color alpha values:
  - `--alpha-secondary`: A color for supplementary text that should be read but not be the main focus
  - `--alpha-tertiary`: A color for supplementary text which is optional to read, i.e. the UI would function without the user reading this text
  - `--alpha-background-light`, `--alpha-background-medium` and `--alpha-background-heavy`: Three alpha values used for backgrounds and borders that have different intensity

### Patch Changes

- [#2757](https://github.com/graphql/graphiql/pull/2757) [`32a70065`](https://github.com/graphql/graphiql/commit/32a70065434eaa7733e28cda0ea0e7d51952e62a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Use different colors for field names and argument names

- Updated dependencies [[`674bf3f8`](https://github.com/graphql/graphiql/commit/674bf3f8ff321dfb8471b0f6e5419bb77ddc94af)]:
  - @graphiql/toolkit@0.7.3

## 0.12.1

### Patch Changes

- Updated dependencies [[`bfa90f24`](https://github.com/graphql/graphiql/commit/bfa90f249be4f68049c1bb81abfb524ae623313f), [`8ab5fcd0`](https://github.com/graphql/graphiql/commit/8ab5fcd0a8399a0f8eb1b569751dd0e8390b9679)]:
  - @graphiql/toolkit@0.7.2

## 0.12.0

### Minor Changes

- [#2739](https://github.com/graphql/graphiql/pull/2739) [`98e14155`](https://github.com/graphql/graphiql/commit/98e14155c650ee7c5ac639e594eb47f0052b7fa9) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `DocsFilledIcon` component and use show that icon in the sidebar when the docs plugin is visible

### Patch Changes

- [#2740](https://github.com/graphql/graphiql/pull/2740) [`7dfea94a`](https://github.com/graphql/graphiql/commit/7dfea94afc0cfe79b5080f10d840bfdce53f02d7) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make SVG icon `stroke-width` consistent

* [#2734](https://github.com/graphql/graphiql/pull/2734) [`3aa1f39f`](https://github.com/graphql/graphiql/commit/3aa1f39f6df559b54f703937ed510c8ba1f21058) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Stop propagating keyboard events too far upwards in the search component for the docs

- [#2741](https://github.com/graphql/graphiql/pull/2741) [`0219eef3`](https://github.com/graphql/graphiql/commit/0219eef39146495749aca2487112db52fa3bb8fd) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add hover styles for buttons

- Updated dependencies [[`48872a87`](https://github.com/graphql/graphiql/commit/48872a87e6edec0c301102baaf669ffcce043a13)]:
  - @graphiql/toolkit@0.7.1

## 0.11.1

### Patch Changes

- [#2712](https://github.com/graphql/graphiql/pull/2712) [`d65f00ea`](https://github.com/graphql/graphiql/commit/d65f00ea2d158cf532d1c71844630c5d9ec13410) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure the back link and title are hidden when focussing the input field for searching the docs

* [#2708](https://github.com/graphql/graphiql/pull/2708) [`f15ee38d`](https://github.com/graphql/graphiql/commit/f15ee38d56e4f749c145e0a17f0ed8e9a6096ac2) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix computing the initial state for editor values and tabs to avoid duplicating tabs on page reload

- [#2712](https://github.com/graphql/graphiql/pull/2712) [`d65f00ea`](https://github.com/graphql/graphiql/commit/d65f00ea2d158cf532d1c71844630c5d9ec13410) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make sure hidden editors don't overflow

## 0.11.0

### Minor Changes

- [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: The `onHasCompletion` export has been removed as it is only meant to be used internally.

* [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - Add new components:
  - UI components (`Button`, `ButtonGroup`, `Dialog`, `Menu`, `Spinner`, `Tab`, `Tabs`, `Tooltip`, `UnStyledButton` and lots of icon components)
  - Editor components (`QueryEditor`, `VariableEditor`, `HeaderEditor` and `ResponseEditor`)
  - Toolbar components (`ExecuteButton`, `ToolbarButton`, `ToolbarMenu` and `ToolbarSelect`)
  - Docs components (`Argument`, `DefaultValue`, `DeprecationReason`, `Directive`, `DocExplorer`, `ExplorerSection`, `FieldDocumentation`, `FieldLink`, `SchemaDocumentation`, `Search`, `TypeDocumentation` and `TypeLink`)
  - `History` component
  - A `GraphiQLProvider` component that renders all other existing provider components from `@graphiql/react` for ease of use

- [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: Add a new context provider for plugins. This induces changes to the following other contexts and their provider components:
  - The property `isVisible` and the methods `hide` and `show` of the `ExplorerContext` have been removed. Also, the property `isVisible` and the methods `hide`, `show` and `toggle` of the `HistoryContext` have been removed. Visibility state of plugins is now part of the `PluginContext` using the `visiblePlugin` property. The visibility state can be altered using the `setVisiblePlugin` method of the `PluginContext`.
  - The `isVisible` prop of the `ExplorerContextProvider` has been removed. For controlling the visibility state of plugins you can now use the `visiblePlugin` prop of the `PluginContextProvider`.
  - The `onToggle` prop of the `HistoryContextProvider` and the `onToggleVisibility` prop of the `ExplorerContextProvider` have been removed. For listening on visibility changes for any plugin you can now use the `onTogglePluginVisibility` prop of the `PluginContextProvider`.

* [#2694](https://github.com/graphql/graphiql/pull/2694) [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279) Thanks [@acao](https://github.com/acao)! - BREAKING: The `ResponseTooltip` prop of the `ResponseEditor` has been renamed to `responseTooltip`

### Patch Changes

- Updated dependencies [[`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279), [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279), [`e59ec32e`](https://github.com/graphql/graphiql/commit/e59ec32e7ccdf3f7f68656533555c63620826279)]:
  - codemirror-graphql@2.0.0
  - @graphiql/toolkit@0.7.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`d6ff4d7a`](https://github.com/graphql/graphiql/commit/d6ff4d7a5d535a0c43fe5914016bac9ef0c2b782)]:
  - graphql-language-service@5.1.0
  - codemirror-graphql@1.3.3

## 0.10.0

### Minor Changes

- [#2651](https://github.com/graphql/graphiql/pull/2651) [`85d5af25`](https://github.com/graphql/graphiql/commit/85d5af25d77c29b7d02da90a431c8c15f610c22a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The following context properties have been removed as they are only meant for internal use:
  - The `subscription` property of the `ExecutionContext`
  - The `setSchema` method of the `SchemaContext`
  - The `setFetchError` method of the `SchemaContext`

* [#2652](https://github.com/graphql/graphiql/pull/2652) [`6ff0bab9`](https://github.com/graphql/graphiql/commit/6ff0bab978d63778b8ab4ba6e79fceb36c2db87f) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `validationErrors` property of the `SchemaContext` is now always non-null. If the schema is valid then it will contain an empty list.

- [#2644](https://github.com/graphql/graphiql/pull/2644) [`0aff68a6`](https://github.com/graphql/graphiql/commit/0aff68a645cceb6b9689e0f394e8bece01710efc) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `ResponseEditor` component no longer accepts the prop `value`. Instead you can now pass the prop `response` to the `EditorContextProvider`. This aligns it with the API design of the other editor components.

## 0.9.0

### Minor Changes

- [#2642](https://github.com/graphql/graphiql/pull/2642) [`100af928`](https://github.com/graphql/graphiql/commit/100af9284de18ca89524c646e86854313c5d067b) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a new prop `operationName` to the `ExecutionContextProvider` component that controls the operation sent with the request

* [#2642](https://github.com/graphql/graphiql/pull/2642) [`100af928`](https://github.com/graphql/graphiql/commit/100af9284de18ca89524c646e86854313c5d067b) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING: The `ExecutionContextProvider` and `QueryEditor` components no longer accepts the `onEditOperationName` prop. Instead you can now pass this prop to the `EditorContextProvider` component.

## 0.8.0

### Minor Changes

- [#2636](https://github.com/graphql/graphiql/pull/2636) [`62317e0b`](https://github.com/graphql/graphiql/commit/62317e0bae6d4ccf89d9e1e6607fd8feeb100078) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - BREAKING:
  - The `ExecutionContextProvider` and `QueryEditor` components no longer accept the `externalFragments` prop. Instead the prop can now be passed to the `EditorContextProvider` component. The provider component will normalize the prop value and provide a map of type `Map<string, FragmentDefinitionNode>` (using the fragment names as keys) as part of the value of the `EditorContext`.
  - The `QueryEditor` component no longer accept the `validationRules` prop. Instead the prop can now be passed to the `EditorContextProvider` component. The provider component will provide the list of validation rules (empty if there are none) as part of the value of the `EditorContext`.
  - The `ExecutionContextProvider` and `HeaderEditor` components no longer accept the `shouldPersistHeaders` prop. Instead the `EditorContextProvider` component now provides the value of its equally named prop as part of the value of the `EditorContext`.

## 0.7.1

### Patch Changes

- Updated dependencies [[`ea732ea8`](https://github.com/graphql/graphiql/commit/ea732ea8e12272c998f1467af8b3b88b6b508e12)]:
  - @graphiql/toolkit@0.6.1

## 0.7.0

### Minor Changes

- [#2618](https://github.com/graphql/graphiql/pull/2618) [`4c814506`](https://github.com/graphql/graphiql/commit/4c814506183579b78731659d871cd4b0ba93305a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a method `introspect` to the schema context and provide a short key (`Shift-Ctrl-R`) for triggering introspection

## 0.6.0

### Minor Changes

- [#2574](https://github.com/graphql/graphiql/pull/2574) [`0c98fa59`](https://github.com/graphql/graphiql/commit/0c98fa5924eadaee33713ccd8a9be6419d50cab1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Allow passing introspection data to the `schema` prop of the `SchemaContextProvider` component

### Patch Changes

- [#2574](https://github.com/graphql/graphiql/pull/2574) [`0c98fa59`](https://github.com/graphql/graphiql/commit/0c98fa5924eadaee33713ccd8a9be6419d50cab1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Set the schema correctly after refetching introspection (e.g. when the `fetcher` prop changes)

## 0.5.2

### Patch Changes

- [#2565](https://github.com/graphql/graphiql/pull/2565) [`f581b437`](https://github.com/graphql/graphiql/commit/f581b437e5bdab6f3ad817d230ee6d1b410bb591) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Don't invoke editor change callbacks when manually signaling "empty" changes.

## 0.5.1

### Patch Changes

- [#2561](https://github.com/graphql/graphiql/pull/2561) [`08346cba`](https://github.com/graphql/graphiql/commit/08346cba136825341881f9dfefc62a60d748e0ee) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add missing effect dependencies to make sure editors are recreated when changing the `keyMap` prop

## 0.5.0

### Minor Changes

- [#2541](https://github.com/graphql/graphiql/pull/2541) [`788d84ef`](https://github.com/graphql/graphiql/commit/788d84ef2784188981f1b4cfb78fba24153bf0cb) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `onSchemaChange` callback prop to the `SchemaContextProvider` component

### Patch Changes

- [#2545](https://github.com/graphql/graphiql/pull/2545) [`8ce5b483`](https://github.com/graphql/graphiql/commit/8ce5b483ee190b5f5dd84eaf42e5d1359ce185e6) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid top-level dynamic imports from `codemirror` that break importing the package in non-browser environments

## 0.4.3

### Patch Changes

- [#2526](https://github.com/graphql/graphiql/pull/2526) [`26e44120`](https://github.com/graphql/graphiql/commit/26e44120a18d49af451c97619fe3386a65579e05) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add missing `caller` arguments to hook calls so that the error message printed when a context provider is missing is more accurate about the component or hook that caused the error

## 0.4.2

### Patch Changes

- [#2501](https://github.com/graphql/graphiql/pull/2501) [`5437ee61`](https://github.com/graphql/graphiql/commit/5437ee61e1ba6cd28ccc1cb3543df1ea788278f4) Thanks [@acao](https://github.com/acao)! - Allow Codemirror 5 `keyMap` to be defined, default `vim` or `emacs` allowed in addition to the original default of `sublime`.

- Updated dependencies [[`cccefa70`](https://github.com/graphql/graphiql/commit/cccefa70c0466d60e8496e1df61aeb1490af723c)]:
  - graphql-language-service@5.0.6
  - codemirror-graphql@1.3.2

## 0.4.1

### Patch Changes

- Updated dependencies [[`c9c51b8a`](https://github.com/graphql/graphiql/commit/c9c51b8a98e1f0427272d3e9ad60989b32f1a1aa)]:
  - graphql-language-service@5.0.5
  - codemirror-graphql@1.3.1

## 0.4.0

### Minor Changes

- [#2461](https://github.com/graphql/graphiql/pull/2461) [`7dfe3ece`](https://github.com/graphql/graphiql/commit/7dfe3ece4e8ab6b3400888f7f357e394db63439d) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add `useDragResize` utility hook

## 0.3.0

### Minor Changes

- [#2453](https://github.com/graphql/graphiql/pull/2453) [`1b41e33c`](https://github.com/graphql/graphiql/commit/1b41e33c4a871a345836de58f415b7c461ced1f8) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add execution context to `@graphiql/react` and move over the logic from `graphiql`

* [#2452](https://github.com/graphql/graphiql/pull/2452) [`ee0fd8bf`](https://github.com/graphql/graphiql/commit/ee0fd8bf4042053ec647080b83656dc5e54a7239) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move tab state from `graphiql` into editor context from `@graphiql/react`

- [#2449](https://github.com/graphql/graphiql/pull/2449) [`a0b02eda`](https://github.com/graphql/graphiql/commit/a0b02edaa629c6113c1c5518fd3aa05b355a1921) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Assume all context values are nullable and create hooks to consume individual contexts

* [#2450](https://github.com/graphql/graphiql/pull/2450) [`1e6fc68b`](https://github.com/graphql/graphiql/commit/1e6fc68b73941544ee64e0499e459f9c7d39aa14) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Extract the `copy`, `merge`, `prettify`, and `autoCompleteLeafs` functions into hooks and remove these functions from the editor context value

### Patch Changes

- [#2451](https://github.com/graphql/graphiql/pull/2451) [`0659e96e`](https://github.com/graphql/graphiql/commit/0659e96e07f98d532619f29f52cba59e2d528327) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Always use the current value of the headers for the introspection request

## 0.2.1

### Patch Changes

- [#2435](https://github.com/graphql/graphiql/pull/2435) [`89f0244f`](https://github.com/graphql/graphiql/commit/89f0244f7b7cdf01c168638a09f5137788401995) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix deriving default values for editors from storage

* [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move prettify query functionality to editor context in `@graphiql/react`

- [#2435](https://github.com/graphql/graphiql/pull/2435) [`89f0244f`](https://github.com/graphql/graphiql/commit/89f0244f7b7cdf01c168638a09f5137788401995) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic for deriving operation facts from the current query to `@graphiql/react` and store these facts as properties on the query editor instance

* [#2448](https://github.com/graphql/graphiql/pull/2448) [`3dae62fc`](https://github.com/graphql/graphiql/commit/3dae62fc871385e148a799cde55a52a5e6b41d19) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - don't introspect the schema if it's provided via props

- [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move copy query functionality to editor context in `@graphiql/react`

* [#2437](https://github.com/graphql/graphiql/pull/2437) [`1f933505`](https://github.com/graphql/graphiql/commit/1f9335051fffc9e6a6f950b6f8060ed521b56789) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move merge query functionality to editor context in `@graphiql/react`

- [#2436](https://github.com/graphql/graphiql/pull/2436) [`3e5295f0`](https://github.com/graphql/graphiql/commit/3e5295f0fd3b5f999643ea97e6cee706554f0b50) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Inline logic for clicking a reference to open the docs and remove the `onClickReference` and `onHintInformationRender` props of the editor components and hooks

* [#2436](https://github.com/graphql/graphiql/pull/2436) [`3e5295f0`](https://github.com/graphql/graphiql/commit/3e5295f0fd3b5f999643ea97e6cee706554f0b50) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move visibility state for doc explorer from `graphiql` to the explorer context in `@graphiql/react`

## 0.2.0

### Minor Changes

- [#2413](https://github.com/graphql/graphiql/pull/2413) [`8be164b1`](https://github.com/graphql/graphiql/commit/8be164b1e158d00752d6d3f30630a797d07d08c9) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a `StorageContext` and a `HistoryContext` to `@graphiql/react` that replaces the logic in the `graphiql` package

* [#2420](https://github.com/graphql/graphiql/pull/2420) [`3467cd33`](https://github.com/graphql/graphiql/commit/3467cd33264e0766a0a43cf53e52ec371df26962) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a `SchemaContext` to `@graphiql/react` that replaces the logic for fetching and validating the schema in the `graphiql` package

### Patch Changes

- Updated dependencies [[`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e), [`8be164b1`](https://github.com/graphql/graphiql/commit/8be164b1e158d00752d6d3f30630a797d07d08c9), [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e), [`84d8985b`](https://github.com/graphql/graphiql/commit/84d8985b87701133cc41fd424a24bb61c9b7272e)]:
  - @graphiql/toolkit@0.6.0

## 0.1.2

### Patch Changes

- [#2427](https://github.com/graphql/graphiql/pull/2427) [`ebc864f0`](https://github.com/graphql/graphiql/commit/ebc864f0ab05000758cb2898daaa73a2f15255ec) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Mark `graphql` as external dependency to avoid importing multiple instances

* [#2427](https://github.com/graphql/graphiql/pull/2427) [`ebc864f0`](https://github.com/graphql/graphiql/commit/ebc864f0ab05000758cb2898daaa73a2f15255ec) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix linting by also updating the options object in the internal codemirror state

## 0.1.1

### Patch Changes

- [#2423](https://github.com/graphql/graphiql/pull/2423) [`838e58da`](https://github.com/graphql/graphiql/commit/838e58dad652d8f5559af7b88d049b1c62348f2f) Thanks [@chentsulin](https://github.com/chentsulin)! - Fix peer dependency declaration by using `||` instead of `|` to link multiple major versions

## 0.1.0

### Minor Changes

- [#2409](https://github.com/graphql/graphiql/pull/2409) [`f2025ba0`](https://github.com/graphql/graphiql/commit/f2025ba06c5aa8e8ac68d29538ff135f3efc8e46) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the variable editor from the `graphiql` package into a hook `useVariableEditor` provided by `@graphiql/react`

* [#2408](https://github.com/graphql/graphiql/pull/2408) [`d825bb75`](https://github.com/graphql/graphiql/commit/d825bb7569ca6b1ebbe534b893354645c790e003) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the query editor from the `graphiql` package into a hook `useQueryEditor` provided by `@graphiql/react`

- [#2411](https://github.com/graphql/graphiql/pull/2411) [`ad448693`](https://github.com/graphql/graphiql/commit/ad4486934ba69247efd33ee500e30f8236ecd079) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Move the logic of the result viewer from the `graphiql` package into a hook `useResponseEditor` provided by `@graphiql/react`

* [#2404](https://github.com/graphql/graphiql/pull/2404) [`029ddf82`](https://github.com/graphql/graphiql/commit/029ddf82c29754ab8518ae7df66f9b25361a8247) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a context provider for editors and move the logic of the headers editor from the `graphiql` package into a hook `useHeaderEditor` provided by `@graphiql/react`

### Patch Changes

- [#2370](https://github.com/graphql/graphiql/pull/2370) [`7f695b10`](https://github.com/graphql/graphiql/commit/7f695b104f9b25ba8c6d36f7827c475b297b7482) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a context with provider component and hooks that manages the state related to the docs/explorer.
