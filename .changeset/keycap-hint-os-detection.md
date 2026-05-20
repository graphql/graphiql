---
'@graphiql/react': minor
---

`KeycapHint` now takes semantic modifier names via the new `MODIFIER` constant. `MODIFIER.Meta` renders as `⌘` on macOS and `Ctrl` elsewhere; `Ctrl`/`Alt`/`Shift` render as Mac glyphs (`⌃`/`⌥`/`⇧`) on macOS and as plain text on other platforms. `Enter` renders as `⏎` on every platform.
