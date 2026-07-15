---
'@graphiql/react': patch
---

Disable Fira Code's font ligatures in the Monaco editors. Programming ligatures rewrote valid GraphQL into misleading glyphs — most notably `Int!=1` (a non-null `Int` with a default value of `1`) rendered as `Int≠1`, implying an inequality that isn't there. Characters now render literally. The Windows caret fix from #4040 is preserved.
