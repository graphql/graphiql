_work in progress_

# What's in a theme?

Themes export a `<Layout/>` component and a `theme-ui` theme. Smaller themes can just forward the existing layout component but more ambitious themes can provide their own `<Layout/>` and override how the application is renderer

## The <Layout/> component

The Layout component takes a specific shape of `PropTypes` that helps it render all neccesary elements in place. It's meant to be a controlled component.

## Using themes

`themes/provider.js` exports a context provider that must wrap the app and a `useThemeLayout` hook that returns the `<Layout/>` component. This is shimmed right now but this API format should support different implementations, night mode, etc.

## Switching themes

_(Not done)_ Just pass a the theme to the provider, the API could look like this:

```jsx
import ThemeProvider from 'themes/provider.js';

import defaultTheme from 'themes/default/index.js';
import nightTheme from 'themes/night/index.js';

export default App = () => (
  <ThemeProvider theme={TimeZone.isPastSunset() ? nightTheme : defaultTheme}>
    {'...'}
  </ThemeProvider>
);
```
