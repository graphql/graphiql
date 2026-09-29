---
'@graphiql/react': minor
---

Add a `KeycapHint` primitive for displaying inline keyboard shortcuts (e.g. `⌘K`, `⌘⏎`), available for general consumer use. It takes semantic modifier names via the `MODIFIER` constant: `MODIFIER.Meta` renders as `⌘` on macOS and `Ctrl` elsewhere; `Ctrl`/`Alt`/`Shift` render as Mac glyphs (`⌃`/`⌥`/`⇧`) on macOS and plain text on other platforms; `Enter` renders as `⏎` everywhere.
