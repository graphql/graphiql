---
'@graphiql/react': minor
'graphiql': minor
---

Add a `SettingsDialog` with theme, density, font-size, and persist-headers controls, backed by a new `useGraphiQLSettings()` hook that persists preferences to `localStorage` and applies them to the GraphiQL container via `data-*` attributes. Density and font-size presets fill in concrete token values for the `[data-density]` and `[data-font-size]` blocks in `tokens.css`; Monaco editor font size, the status bar, and UI icon sizes follow the active font-size preset. The `forcedTheme` and `showPersistHeadersSettings` props continue to work, with `forcedTheme` hiding the theme control.
