---
'@graphiql/react': patch
'@graphiql/plugin-history': patch
'graphiql': patch
---

History panel: hold `⌥` (or `Alt` on non-Mac) and click a row to open a side-by-side diff of the current query against the row's query. `Apply` loads the row into the editors; `Cancel` or `ESC` dismisses without changes. `@graphiql/react` exports a new `OperationDiffEditor` component and a `diffOverlay` slice on the editor store, which any consumer can populate to render a diff in the operation editor area.
