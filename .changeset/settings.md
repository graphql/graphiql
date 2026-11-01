---
'@graphiql/react': minor
'graphiql': minor
---

pr: 4322

Add `useGraphiQLSettings()` for reading and updating persisted theme, density, and font-size preferences. Settings are shared between consumers, including plugins and the exported `SettingsDialog`. The hook exposes `resolvedTheme` so plugins can follow light and dark appearance, including operating-system changes when the theme is `auto`.

`SettingsDialog` also controls header persistence. The existing `forcedTheme` and `showPersistHeadersSettings` props continue to apply; a forced theme hides the theme control.
