---
'@graphiql/react': patch
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
---

Add a global keyboard focus ring and fill in a few missing screen-reader labels. Every control now shows a clearly visible blue outline when focused with the keyboard, with enough contrast against the canvas in both light and dark themes. Decorative icons that sit next to a text label no longer announce a redundant name, the doc explorer search box shows a focus ring while typing, and the cancel button on a history label edit now has an accessible name.
