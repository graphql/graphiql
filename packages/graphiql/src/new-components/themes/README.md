_work in progress_

# What's in a theme?

Themes export a `<Layout/>` component and a `theme-ui` theme. Smaller themes can just re-export the default layout component and more ambitious themes can provide their own `<Layout/>` and override how the application is rendered. This allows top level markup/layout customization beyond simple aesthetics.

## The theme-ui theme

Components that are not the Layout itself rely on the `theme-ui` constants for styling. This is how they can be customized. To make sure this doesn't break, the theme will have some must-have constants yet to be defined.

## The Layout component

The Layout component takes a specific shape of `PropTypes` (defined in `themes/constants.js`) that helps it render all necessary elements in place. It's meant to be a controlled component so a higher level router or whatnot in graphiql can actually shuffle the blocks around and drive decisions like routing.

# Using themes from graphiql/storybook

`themes/provider.js` exports a context provider that must wrap the app, it also exports a `useThemeLayout` hook that returns the `<Layout/>` component. Currently this is shimmed to return the default theme in any event, but the userland api calls are ready for switching themes (read on:)

## Switching themes

_(Not done)_ Just pass the theme object to the provider, the API could look like this:

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
