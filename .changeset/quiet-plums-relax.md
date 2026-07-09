---
'@graphiql/react': patch
---

Stop unstyled buttons (`.graphiql-un-styled`) from painting the native `buttonface` background, which ignored the active theme when the OS color scheme differed from it. Also make `useGraphiQLSettings` the single writer of the `data-theme` attribute by dropping a redundant `<html>` write from the theme store.
