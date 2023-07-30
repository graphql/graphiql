Interactive explorer plugin for GraphiQL.

Try it live with the [GraphiQL Plugins Demo](https://graphiql-test.netlify.app/webpack).

## Created by OneGraph

[OneGraph](https://www.onegraph.com) provides easy, consistent access to the APIs that underlie your business--all through the power of GraphQL.

Sign up at [https://www.onegraph.com](http://www.onegraph.com).

[![npm version](http://img.shields.io/npm/v/graphiql-explorer.svg?style=flat)](https://npmjs.org/package/graphiql-explorer 'View this project on npm')

## Example usage

The recommended way to use `graphiql-explorer` is via the `graphiql` plugin - [`@graphiql/plugin-explorer`](../graphiql-plugin-explorer/)

[Read the rationale on the OneGraph blog](https://www.onegraph.com/blog/2019/01/24/How_OneGraph_onboards_users_new_to_GraphQL.html).

## Changes from the OneGraph version

1. Converted to Typescript
2. Split into multiple files
3. new `ExplorerInner` and `GraphiQLExplorerInnerProps` exports which remove some of the presentation complexity for the graphiql plugin.
4. uses modern targets and only exports esm build, does not export cjs, bundle and transpile as needed

## Customizing styles

The default styling matches for the Explorer matches the default styling for GraphiQL. If you've customized your GraphiQL styling, you can customize the Explorer's styling to match.

### Customizing colors

The Explorer accepts a `colors` prop as a map of the class names in GraphiQL's css to hex colors. If you've edited the GraphiQL class names that control colors (e.g. `cm-def`, `cm-variable`, `cm-string`, etc.) use those same colors in the colors map. The naming of the keys in the colors map tries to align closely with the names of the class names in GraphiQL's css (note that the Explorer can't just apply the classes because of conflicts with how the css file styles inputs).

Example style map:

```javascript
<Explorer
  colors={{
    keyword: '#B11A04',
    // OperationName, FragmentName
    def: '#D2054E',
    // FieldName
    property: '#1F61A0',
    // FieldAlias
    qualifier: '#1C92A9',
    // ArgumentName and ObjectFieldName
    attribute: '#8B2BB9',
    number: '#2882F9',
    string: '#D64292',
    // Boolean
    builtin: '#D47509',
    // Enum
    string2: '#0B7FC7',
    variable: '#397D13',
    // Type
    atom: '#CA9800',
  }}
/>
```

### Customizing arrows and checkboxes

The explorer accepts props for setting custom checkboxes (for leaf fields) and arrows (for object fields).

The props are `arrowOpen`, `arrowClosed`, `checkboxChecked`, and `checkboxUnchecked`. You can pass any react node for those props.

The defaults are

arrowOpen

```javascript
<svg width="12" height="9">
  <path fill="#666" d="M 0 2 L 9 2 L 4.5 7.5 z" />
</svg>
```

arrowClosed

```javascript
<svg width="12" height="9">
  <path fill="#666" d="M 0 0 L 0 9 L 5.5 4.5 z" />
</svg>
```

checkboxChecked

```javascript
<svg
  style={{ marginRight: '3px', marginLeft: '-3px' }}
  width="12"
  height="12"
  viewBox="0 0 18 18"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
    fill="#666"
  />
</svg>
```

checkboxUnchecked

```javascript
<svg
  style={{ marginRight: '3px', marginLeft: '-3px' }}
  width="12"
  height="12"
  viewBox="0 0 18 18"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
    fill="#CCC"
  />
</svg>
```

### Customizing the buttons to create new operations

You can modify the styles for the buttons that allow you to create new operations.

Pass the `styles` prop when you create the component. It's an object with two keys, `explorerActionsStyle` and `buttonStyle`.

Example styles map:

```javascript
<Explorer
  styles={{
    buttonStyle: {
      fontSize: '1.2em',
      padding: '0px',
      backgroundColor: 'white',
      border: 'none',
      margin: '5px 0px',
      height: '40px',
      width: '100%',
      display: 'block',
      maxWidth: 'none',
    },

    explorerActionsStyle: {
      margin: '4px -8px -8px',
      paddingLeft: '8px',
      bottom: '0px',
      width: '100%',
      textAlign: 'center',
      background: 'none',
      borderTop: 'none',
      borderBottom: 'none',
    },
  }}
/>
```
