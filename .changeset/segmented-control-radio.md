---
'@graphiql/react': patch
---

Rewrite `SegmentedControl` on top of native radio inputs. Public props are unchanged. Keyboard navigation (arrow keys, Home / End) and screen-reader semantics now come from the browser; the group is a single tab stop instead of one per option.
